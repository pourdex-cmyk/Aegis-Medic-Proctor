import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateObject } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { buildGradingNarrativePrompt } from "@/lib/ai/prompts"

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const aarSchema = z.object({
  overall_narrative: z.string(),
  strengths: z.array(z.string()),
  failures: z.array(z.string()),
  missed_critical_actions: z.array(z.string()),
  remediation_recommendations: z.array(z.object({
    category: z.string(),
    action: z.string(),
    doctrine_reference: z.string().nullable(),
    priority: z.enum(["high", "medium", "low"]),
  })),
  trainee_summary: z.string(),
  instructor_summary: z.string(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { run_id } = await request.json()

    // Fetch run data
    const [{ data: runRaw }, { data: interventionsRaw }, { data: scoresRaw }] = await Promise.all([
      supabase
        .from("scenario_runs")
        .select("*, scenarios(title, audience, doctrine_pack_id, casualty_count)")
        .eq("id", run_id)
        .single(),
      supabase
        .from("interventions")
        .select("*, casualty_profiles(callsign)")
        .eq("run_id", run_id)
        .order("elapsed_seconds"),
      supabase
        .from("scores")
        .select("*, rubrics(name)")
        .eq("run_id", run_id),
    ])

    interface RunWithScenario {
      id: string; org_id: string; status: string; clock_seconds: number; casualty_count: number; created_at: string;
      scenarios: { title: string; audience: string; doctrine_pack_id: string | null; casualty_count: number }
    }
    interface InterventionWithCasualty {
      id: string; action_type: string; elapsed_seconds: number; confidence_score: number;
      casualty_profiles: { callsign: string } | null
    }
    interface ScoreWithRubric {
      id: string; percentage: number; dimension_scores: unknown;
      rubrics: { name: string } | null
    }

    const run = runRaw as unknown as RunWithScenario | null
    const interventions = interventionsRaw as unknown as InterventionWithCasualty[] | null
    const scores = scoresRaw as unknown as ScoreWithRubric[] | null

    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 })

    const scenario = run.scenarios
    const overallScore = scores?.length
      ? scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length
      : 0

    // Fetch doctrine context if available
    let doctrineContext = ""
    if (scenario.doctrine_pack_id) {
      const { data: rules } = await supabase
        .from("doctrine_rules")
        .select("title, category, critical_action")
        .eq("pack_id", scenario.doctrine_pack_id)
        .eq("approval_status", "approved")
        .eq("critical_action", true)
        .limit(20)

      if (rules) {
        doctrineContext = rules.map((r) => `[${r.category}] ${r.title} [CRITICAL]`).join("\n")
      }
    }

    const prompt = buildGradingNarrativePrompt({
      scenario_title: scenario.title,
      audience: scenario.audience,
      casualty_count: run.casualty_count ?? 1,
      run_duration_seconds: run.clock_seconds ?? 0,
      interventions: (interventions ?? []).map((i) => ({
        action: i.action_type,
        elapsed: i.elapsed_seconds,
        casualty: i.casualty_profiles?.callsign ?? "Unknown",
        correct: i.confidence_score > 0.7,
      })),
      missed_critical_actions: scores?.flatMap((s) => {
        const dims = s.dimension_scores as Record<string, number>
        return Object.entries(dims)
          .filter(([, v]) => v < 50)
          .map(([k]) => `${k} (score: ${dims[k]}%)`)
      }) ?? [],
      scores: scores?.reduce((acc, s) => {
        const dims = s.dimension_scores as Record<string, number>
        Object.assign(acc, dims)
        return acc
      }, {}) ?? {},
      overall_percentage: Math.round(overallScore),
      doctrine_context: doctrineContext || undefined,
    })

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      system: prompt.system,
      prompt: prompt.user,
      schema: aarSchema,
      temperature: 0.4,
    })

    // Get org_id
    const { data: member } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single()

    // Save report
    const { data: report } = await supabase
      .from("reports")
      .insert({
        run_id,
        org_id: member?.org_id ?? run.org_id,
        generated_by: user.id,
        title: `AAR — ${scenario.title}`,
        status: "ready",
        ai_narrative: object.overall_narrative,
        remediation_plan: object.remediation_recommendations,
        strengths: object.strengths,
        failures: object.failures,
        summary: object.instructor_summary,
        metadata: {
          scenario_title: scenario.title,
          casualty_count: run.casualty_count ?? 1,
          participant_count: 0,
          run_duration_seconds: run.clock_seconds ?? 0,
          run_date: run.created_at,
        },
      })
      .select("id")
      .single()

    return NextResponse.json({ ...object, reportId: report?.id })
  } catch (err) {
    console.error("AAR generation error:", err)
    return NextResponse.json({ error: "AAR generation failed" }, { status: 500 })
  }
}
