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

  const [{ data: runRaw }, { data: casualtyRaw }, { data: audioCues }] = await Promise.all([
    supabase
      .from("scenario_runs")
      .select("id, status, clock_seconds")
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
      .order("created_at"),
  ])

  type RunRow = { id: string; status: string; clock_seconds: number; scenarios?: { title: string; environment: string } | null }
  type CasualtyRow = {
    id: string; callsign: string; display_label: string; mechanism_of_injury: string;
    visible_injuries: Array<{ type: string; location: string; severity: string }>;
    airway_status: string; triage_category: string;
    baseline_vitals: { hr: number; rr: number; sbp: number; spo2: number; avpu: string; temp?: number };
    pain_level: number; audio_profile?: { primary_complaint?: string } | null;
  }

  return (
    <RolePlayerClient
      run={runRaw as unknown as RunRow | null}
      casualty={casualtyRaw as unknown as CasualtyRow | null}
      audioCues={audioCues ?? []}
    />
  )
}
