import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { RolePlayerClient } from "./role-player-client"

export const metadata: Metadata = { title: "Role Player" }

// This page is intentionally unauthenticated-friendly (tablet/device sharing).
// It uses a run PIN or query param to identify the active run.
export default async function RolePlayerPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string; casualty?: string }>
}) {
  const { run: runId, casualty: casualtyId } = await searchParams
  const supabase = await createClient()

  if (!runId) {
    return <RolePlayerClient run={null} casualty={null} audioCues={[]} />
  }

  const [{ data: run }, { data: casualty }, { data: audioCues }] = await Promise.all([
    supabase
      .from("scenario_runs")
      .select("id, status, clock_seconds, scenarios(title, environment)")
      .eq("id", runId)
      .single(),
    casualtyId
      ? supabase
          .from("casualty_profiles")
          .select("id, callsign, display_label, mechanism_of_injury, visible_injuries, airway_status, triage_category, baseline_vitals, pain_level, audio_profile")
          .eq("id", casualtyId)
          .single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("audio_cues")
      .select("id, category, title, script_text, voice_style, intensity, tags")
      .eq("org_id", run ? undefined : "none")
      .order("created_at"),
  ])

  return (
    <RolePlayerClient
      run={run ?? null}
      casualty={casualty ?? null}
      audioCues={audioCues ?? []}
    />
  )
}
