import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 })

  const supabase = await createServiceClient()

  // Validate token — cast to any since casualty_actor_sessions is a new table
  // not yet in the generated database.types.ts (run migration 004 first)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error: sessionError } = await (supabase as any)
    .from("casualty_actor_sessions")
    .select("id, run_id, casualty_id, expires_at")
    .eq("token", token.toUpperCase().trim())
    .single() as { data: { id: string; run_id: string; casualty_id: string; expires_at: string } | null; error: unknown }

  if (sessionError || !session) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 })
  }

  if (new Date(session.expires_at) < new Date()) {
    return NextResponse.json({ error: "Token has expired" }, { status: 410 })
  }

  // Fetch run + casualty in parallel
  const [{ data: run }, { data: casualty }] = await Promise.all([
    supabase
      .from("scenario_runs")
      .select("id, status, clock_seconds, started_at")
      .eq("id", session.run_id)
      .single(),
    supabase
      .from("casualty_profiles")
      .select("id, callsign, display_label, mechanism_of_injury, visible_injuries, hidden_complications, airway_status, breathing_status, circulation_state, neurologic_status, triage_category, baseline_vitals, pain_level, audio_profile")
      .eq("id", session.casualty_id)
      .single(),
  ])

  if (!run || !casualty) {
    return NextResponse.json({ error: "Run or casualty not found" }, { status: 404 })
  }

  return NextResponse.json({ run, casualty }, {
    headers: {
      // Allow polling from same origin
      "Cache-Control": "no-store",
    },
  })
}
