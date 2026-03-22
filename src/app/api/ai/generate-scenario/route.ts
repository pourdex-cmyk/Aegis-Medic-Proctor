import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateObject } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { buildScenarioGenerationPrompt, buildCasualtyGenerationPrompt } from "@/lib/ai/prompts"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Output schema for scenario generation
const scenarioOutputSchema = z.object({
  title: z.string(),
  overview_narrative: z.string(),
  instructor_notes: z.string(),
  objectives: z.array(z.object({
    id: z.string(),
    text: z.string(),
    category: z.string(),
    critical: z.boolean(),
  })),
  tags: z.array(z.string()),
  estimated_duration_minutes: z.number(),
  decision_traps: z.array(z.string()),
  expected_milestones: z.array(z.string()),
  grading_considerations: z.array(z.string()),
})

const casualtyOutputSchema = z.object({
  callsign: z.string(),
  mechanism_of_injury: z.string(),
  visible_injuries: z.array(z.object({
    id: z.string(),
    type: z.string(),
    location: z.string(),
    severity: z.enum(["minor", "moderate", "severe", "critical"]),
    laterality: z.string().nullable(),
    description: z.string(),
    visible_to_trainee: z.boolean(),
  })),
  suspected_internal_injuries: z.array(z.object({
    id: z.string(),
    type: z.string(),
    location: z.string(),
    severity: z.enum(["minor", "moderate", "severe", "critical"]),
    laterality: z.string().nullable(),
    description: z.string(),
    visible_to_trainee: z.boolean(),
  })),
  hidden_complications: z.array(z.object({
    id: z.string(),
    type: z.string(),
    location: z.string(),
    severity: z.enum(["minor", "moderate", "severe", "critical"]),
    laterality: z.string().nullable(),
    description: z.string(),
    visible_to_trainee: z.boolean(),
  })),
  airway_status: z.enum(["patent", "partially_obstructed", "obstructed"]),
  breathing_status: z.enum(["normal", "labored", "shallow", "agonal"]),
  circulation_state: z.enum(["normal", "hemorrhage_controlled", "active_hemorrhage", "shock_compensated", "shock_decompensated"]),
  neurologic_status: z.enum(["intact", "altered", "unresponsive"]),
  baseline_vitals: z.object({
    hr: z.number(),
    rr: z.number(),
    sbp: z.number(),
    dbp: z.number(),
    spo2: z.number(),
    temp: z.number(),
    avpu: z.enum(["A", "V", "P", "U"]),
  }),
  triage_category: z.enum(["T1", "T2", "T3", "T4"]),
  primary_complaint: z.string(),
  generation_notes: z.string(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      audience, scenario_type, environment, complexity,
      casualty_count, evac_delay_minutes, hidden_complications,
      airway_emphasis, hemorrhage_emphasis, triage_emphasis,
      multisystem_emphasis, leadership_emphasis, audio_intensity,
      grading_strictness, equipment_limitations, weather_stressors,
      custom_notes, doctrine_pack_id, userId,
    } = body

    // Get org ID
    const { data: member } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (!member) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 })
    }

    // Fetch doctrine context if provided
    let doctrineContext = ""
    if (doctrine_pack_id) {
      const { data: rules } = await supabase
        .from("doctrine_rules")
        .select("title, description, category, critical_action, timing_expectation")
        .eq("pack_id", doctrine_pack_id)
        .eq("approval_status", "approved")
        .limit(30)

      if (rules && rules.length > 0) {
        doctrineContext = rules
          .map((r) => `[${r.category}] ${r.title}: ${r.description}${r.critical_action ? " [CRITICAL ACTION]" : ""}${r.timing_expectation ? ` — ${r.timing_expectation}` : ""}`)
          .join("\n")
      }
    }

    // Build scenario generation prompt
    const scenarioPrompt = buildScenarioGenerationPrompt({
      audience, scenario_type, environment, complexity,
      casualty_count, evac_delay_minutes, hidden_complications,
      airway_emphasis, hemorrhage_emphasis, triage_emphasis,
      multisystem_emphasis, leadership_emphasis, audio_intensity,
      grading_strictness, equipment_limitations, weather_stressors,
      custom_notes, doctrine_context: doctrineContext || undefined,
    })

    // Generate scenario
    const { object: scenarioOutput } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      system: scenarioPrompt.system,
      prompt: scenarioPrompt.user,
      schema: scenarioOutputSchema,
      temperature: 0.7,
    })

    // Insert scenario
    const { data: scenario, error: scenarioError } = await supabase
      .from("scenarios")
      .insert({
        org_id: member.org_id,
        doctrine_pack_id: doctrine_pack_id || null,
        created_by: user.id,
        title: scenarioOutput.title,
        audience,
        environment,
        scenario_type,
        complexity,
        casualty_count,
        evac_delay_minutes,
        status: "draft",
        ai_generated: true,
        settings: {
          hidden_complications,
          equipment_limitations,
          weather_stressors,
          triage_emphasis,
          airway_emphasis,
          hemorrhage_emphasis,
          multisystem_emphasis,
          leadership_emphasis,
          audio_intensity,
          grading_strictness,
        },
        objectives: scenarioOutput.objectives,
        overview_narrative: scenarioOutput.overview_narrative,
        instructor_notes: scenarioOutput.instructor_notes,
        tags: scenarioOutput.tags,
        description: custom_notes || null,
      })
      .select("id")
      .single()

    if (scenarioError || !scenario) {
      throw new Error(`Failed to create scenario: ${scenarioError?.message}`)
    }

    // Generate casualties
    const casualtyPromises = Array.from({ length: Math.min(casualty_count, 8) }, (_, i) =>
      generateObject({
        model: anthropic("claude-sonnet-4-6"),
        system: buildCasualtyGenerationPrompt({
          scenario_context: `${scenarioOutput.title}: ${scenarioOutput.overview_narrative.slice(0, 300)}`,
          audience,
          complexity,
          casualty_index: i,
          total_casualties: casualty_count,
          emphasis: { airway: airway_emphasis, hemorrhage: hemorrhage_emphasis, multisystem: multisystem_emphasis },
          hidden_complications,
          evac_delay_minutes,
          doctrine_context: doctrineContext || undefined,
        }).system,
        prompt: buildCasualtyGenerationPrompt({
          scenario_context: `${scenarioOutput.title}: ${scenarioOutput.overview_narrative.slice(0, 300)}`,
          audience,
          complexity,
          casualty_index: i,
          total_casualties: casualty_count,
          emphasis: { airway: airway_emphasis, hemorrhage: hemorrhage_emphasis, multisystem: multisystem_emphasis },
          hidden_complications,
          evac_delay_minutes,
          doctrine_context: doctrineContext || undefined,
        }).user,
        schema: casualtyOutputSchema,
        temperature: 0.75,
      })
    )

    const casualtyResults = await Promise.all(casualtyPromises)

    // Insert casualties
    const casualtyInserts = casualtyResults.map((result, i) => {
      const c = result.object
      return {
        scenario_id: scenario.id,
        org_id: member.org_id,
        callsign: c.callsign,
        display_label: `Casualty ${String.fromCharCode(65 + i)}`,
        mechanism_of_injury: c.mechanism_of_injury,
        visible_injuries: c.visible_injuries,
        suspected_internal_injuries: c.suspected_internal_injuries,
        hidden_complications: c.hidden_complications,
        airway_status: c.airway_status,
        breathing_status: c.breathing_status,
        circulation_state: c.circulation_state,
        neurologic_status: c.neurologic_status,
        pain_level: 7,
        mental_status: c.neurologic_status === "unresponsive" ? "Unresponsive" : c.neurologic_status === "altered" ? "Confused" : "Alert",
        baseline_vitals: c.baseline_vitals,
        deterioration_profile: {
          rate: c.triage_category === "T1" ? "rapid" : c.triage_category === "T2" ? "moderate" : "slow",
          primary_pathway: c.mechanism_of_injury,
          time_to_critical_seconds: c.triage_category === "T1" ? 600 : c.triage_category === "T2" ? 1800 : undefined,
          intervention_sensitivity: {},
        },
        triage_category: c.triage_category,
        audio_profile: {
          verbosity: audio_intensity === "high" ? "expressive" : audio_intensity === "minimal" ? "minimal" : "moderate",
          primary_complaint: c.primary_complaint,
          auto_trigger_conditions: [],
        },
        ai_generated: true,
        proctor_notes: c.generation_notes,
        sort_order: i,
      }
    })

    await supabase.from("casualty_profiles").insert(casualtyInserts)

    // Log audit event
    await supabase.from("audit_logs").insert({
      org_id: member.org_id,
      actor_id: user.id,
      action: "scenario.generate",
      resource_type: "scenario",
      resource_id: scenario.id,
      description: `AI-generated scenario: ${scenarioOutput.title}`,
      metadata: { casualty_count, complexity, audience, ai_generated: true },
    })

    // Update scenario status to ready
    await supabase
      .from("scenarios")
      .update({ status: "ready" })
      .eq("id", scenario.id)

    return NextResponse.json({ scenarioId: scenario.id, title: scenarioOutput.title })
  } catch (err) {
    console.error("Scenario generation error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    )
  }
}
