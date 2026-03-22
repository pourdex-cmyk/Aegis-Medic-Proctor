import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { buildInstructorCopilotPrompt } from "@/lib/ai/prompts"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      query,
      runId,
      scenarioTitle,
      casualties,
      interventions,
      clockSeconds,
    } = body as {
      query: string
      runId?: string
      scenarioTitle?: string
      casualties?: Array<{
        callsign: string
        triage_category: string
        mechanism_of_injury: string
        airway_status: string
        visible_injuries: Array<{ type: string; location: string; severity: string }>
        vitals?: { hr: number; rr: number; sbp: number; spo2: number; avpu: string }
      }>
      interventions?: Array<{
        action_type: string
        casualty_callsign?: string
        elapsed_seconds: number
      }>
      clockSeconds?: number
    }

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Build casualty context string
    const casualtyContext = casualties?.map((c) => {
      const vitals = c.vitals
        ? `HR:${c.vitals.hr} RR:${c.vitals.rr} SBP:${c.vitals.sbp} SpO2:${c.vitals.spo2}% AVPU:${c.vitals.avpu}`
        : "vitals unknown"
      const injuries = c.visible_injuries.map((i) => `${i.severity} ${i.type} (${i.location})`).join(", ")
      return `${c.callsign} [${c.triage_category}] — ${c.mechanism_of_injury} | ${injuries} | ${vitals} | Airway: ${c.airway_status}`
    }).join("\n") ?? "No casualty data"

    const interventionContext = interventions?.slice(0, 20).map((i) => {
      const elapsed = i.elapsed_seconds
      const minutes = Math.floor(elapsed / 60)
      const seconds = elapsed % 60
      return `T+${minutes}:${String(seconds).padStart(2, "0")} — ${i.casualty_callsign ?? "unknown"}: ${i.action_type}`
    }).join("\n") ?? "No interventions logged"

    const timeDisplay = clockSeconds != null
      ? `${Math.floor(clockSeconds / 60)}:${String(clockSeconds % 60).padStart(2, "0")}`
      : "00:00"

    const { system, user: userPrompt } = buildInstructorCopilotPrompt({
      query,
      scenario_title: scenarioTitle ?? "Unknown Scenario",
      elapsed_time: timeDisplay,
      casualty_context: casualtyContext,
      intervention_history: interventionContext,
    })

    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 512,
      temperature: 0.2,
    })

    // Log the copilot query to audit (org_id required)
    if (runId) {
      const { data: member } = await supabase
        .from("organization_members")
        .select("org_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      if (member?.org_id) {
        await supabase.from("audit_logs").insert({
          org_id: member.org_id,
          actor_id: user.id,
          action: "copilot.query",
          resource_type: "scenario_run",
          resource_id: runId,
          description: "Instructor copilot query during live run",
          metadata: { query: query.slice(0, 200) },
        })
      }
    }

    return NextResponse.json({ response: text.trim() })
  } catch (err) {
    console.error("[copilot]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Copilot error" },
      { status: 500 }
    )
  }
}
