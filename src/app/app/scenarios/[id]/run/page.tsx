import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { RunCommandCenter } from "./run-command-center"

export const metadata: Metadata = { title: "Live Run — Command Center" }

interface Props {
  params: Promise<{ id: string }>
}

export default async function RunPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: scenarioRaw }, { data: casualtiesRaw }, { data: profile }, { data: member }] = await Promise.all([
    supabase
      .from("scenarios")
      .select("id, title, environment, complexity, doctrine_pack_id")
      .eq("id", id)
      .single(),
    supabase
      .from("casualty_profiles")
      .select("id, callsign, display_label, mechanism_of_injury, visible_injuries, hidden_complications, airway_status, breathing_status, circulation_state, neurologic_status, triage_category, baseline_vitals, pain_level, audio_profile")
      .eq("scenario_id", id)
      .order("triage_category"),
    supabase.from("profiles").select("id, display_name").eq("id", user.id).single(),
    supabase.from("organization_members").select("org_id").eq("user_id", user.id).eq("is_active", true).limit(1).single(),
  ])

  if (!scenarioRaw) notFound()

  // Check if there's an active run
  const { data: activeRunRaw } = await supabase
    .from("scenario_runs")
    .select("id, status, clock_seconds, started_at")
    .eq("scenario_id", id)
    .in("status", ["active", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  type ScenarioRow = { id: string; title: string; environment: string; complexity: string; doctrine_packs?: { name: string } | null }
  type CasualtyProfileRow = {
    id: string; callsign: string; display_label: string; mechanism_of_injury: string;
    visible_injuries: Array<{ type: string; location: string; severity: string; laterality?: string | null }>;
    hidden_complications: Array<{ type: string; location: string; severity: string }>;
    airway_status: string; breathing_status: string; circulation_state: string;
    neurologic_status: string; triage_category: string;
    baseline_vitals: { hr: number; rr: number; sbp: number; dbp: number; spo2: number; temp: number; avpu: string };
    pain_level: number; audio_profile: { primary_complaint?: string };
  }

  return (
    <RunCommandCenter
      scenario={scenarioRaw as unknown as ScenarioRow}
      casualties={(casualtiesRaw as unknown as CasualtyProfileRow[]) ?? []}
      activeRun={activeRunRaw as unknown as { id: string; status: string; clock_seconds: number; started_at?: string | null } | null}
      userId={user.id}
      userName={(profile as { display_name: string } | null)?.display_name ?? "Proctor"}
      orgId={(member as { org_id: string } | null)?.org_id ?? ""}
    />
  )
}
