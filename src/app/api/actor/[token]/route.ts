import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 })

  const supabase = await createServiceClient()

  // Validate token — casualty_actor_sessions is added by migration 004
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error: sessionError } = await (supabase as any)
    .from("casualty_actor_sessions")
    .select("id, scenario_id, run_id, casualty_id, expires_at")
    .eq("token", token.toUpperCase().trim())
    .single() as {
      data: {
        id: string
        scenario_id: string
        run_id: string | null
        casualty_id: string
        expires_at: string
      } | null
      error: unknown
    }

  if (sessionError || !session) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 })
  }

  if (new Date(session.expires_at) < new Date()) {
    return NextResponse.json({ error: "Token has expired" }, { status: 410 })
  }

  // Fetch casualty profile
  const { data: casualty } = await supabase
    .from("casualty_profiles")
    .select("id, callsign, display_label, mechanism_of_injury, visible_injuries, hidden_complications, airway_status, breathing_status, circulation_state, neurologic_status, triage_category, baseline_vitals, pain_level, audio_profile")
    .eq("id", session.casualty_id)
    .single()

  if (!casualty) {
    return NextResponse.json({ error: "Casualty not found" }, { status: 404 })
  }

  // If run hasn't started yet, return standby state
  if (!session.run_id) {
    return NextResponse.json(
      { run: { id: null, status: "standby", clock_seconds: 0 }, casualty },
      { headers: { "Cache-Control": "no-store" } }
    )
  }

  // Fetch live run state
  const { data: run } = await supabase
    .from("scenario_runs")
    .select("id, status, clock_seconds, started_at")
    .eq("id", session.run_id)
    .single()

  if (!run) {
    return NextResponse.json(
      { run: { id: null, status: "standby", clock_seconds: 0 }, casualty },
      { headers: { "Cache-Control": "no-store" } }
    )
  }

  return NextResponse.json(
    { run, casualty },
    { headers: { "Cache-Control": "no-store" } }
  )
}
