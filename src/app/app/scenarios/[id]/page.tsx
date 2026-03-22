import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ScenarioDetail } from "./scenario-detail"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("scenarios").select("title").eq("id", id).single()
  return { title: data?.title ?? "Scenario" }
}

export default async function ScenarioDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: scenarioRaw }, { data: casualtiesRaw }, { data: injects }, { data: runs }] =
    await Promise.all([
      supabase
        .from("scenarios")
        .select("id, org_id, title, description, audience, environment, scenario_type, complexity, casualty_count, evac_delay_minutes, status, objectives, created_at, updated_at, doctrine_pack_id")
        .eq("id", id)
        .single(),
      supabase
        .from("casualty_profiles")
        .select("id, callsign, display_label, triage_category, mechanism_of_injury, visible_injuries, airway_status, breathing_status, circulation_state, neurologic_status, pain_level, baseline_vitals")
        .eq("scenario_id", id)
        .order("triage_category"),
      supabase
        .from("scenario_injects")
        .select("id, trigger_type, trigger_time_seconds, title, description")
        .eq("scenario_id", id)
        .order("trigger_time_seconds", { ascending: true }),
      supabase
        .from("scenario_runs")
        .select("id, status, clock_seconds, created_at")
        .eq("scenario_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  if (!scenarioRaw) notFound()

  type ScenarioRow = typeof scenarioRaw & { objectives?: string[] | null }
  const scenario = scenarioRaw as unknown as ScenarioRow

  // Cast casualty visible_injuries and baseline_vitals from Json to typed arrays
  type CasualtyRow = {
    id: string; callsign: string; display_label: string; triage_category: string; mechanism_of_injury: string;
    visible_injuries: Array<{ type: string; location: string; severity: string; laterality?: string | null }>;
    airway_status: string; breathing_status: string; circulation_state: string; neurologic_status: string;
    pain_level: number;
    baseline_vitals: { hr: number; rr: number; sbp: number; dbp: number; spo2: number; temp: number; avpu: string };
  }

  return (
    <ScenarioDetail
      scenario={scenario}
      casualties={(casualtiesRaw as unknown as CasualtyRow[]) ?? []}
      injects={injects ?? []}
      recentRuns={runs ?? []}
    />
  )
}
