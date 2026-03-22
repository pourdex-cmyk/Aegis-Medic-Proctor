import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MascalBoard } from "./mascal-board"

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ run?: string }>
}

export const metadata: Metadata = { title: "MASCAL Board" }

export default async function MascalPage({ params, searchParams }: Props) {
  const { id: scenarioId } = await params
  const { run: runId } = await searchParams
  const supabase = await createClient()

  const [{ data: scenario }, { data: casualties }, { data: run }] = await Promise.all([
    supabase.from("scenarios").select("id, title, casualty_count").eq("id", scenarioId).single(),
    supabase
      .from("casualty_profiles")
      .select("id, callsign, display_label, triage_category, mechanism_of_injury, visible_injuries, baseline_vitals, airway_status")
      .eq("scenario_id", scenarioId),
    runId
      ? supabase.from("scenario_runs").select("id, status, clock_seconds").eq("id", runId).single()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (!scenario) notFound()

  // Fetch live casualty states if run is active
  let liveStates: Array<{ casualty_id: string; current_vitals: unknown; triage_category?: string }> = []
  if (run?.id) {
    const { data } = await supabase
      .from("casualty_states")
      .select("casualty_id, current_vitals, triage_category")
      .eq("run_id", run.id)
    liveStates = data ?? []
  }

  type CasualtyRow = {
    id: string; callsign: string; display_label: string; triage_category: string; mechanism_of_injury: string;
    visible_injuries: Array<{ type: string; location: string; severity: string }>;
    baseline_vitals: { hr: number; rr: number; sbp: number; spo2: number; avpu: string };
    airway_status: string;
  }

  return (
    <MascalBoard
      scenario={scenario}
      casualties={(casualties as unknown as CasualtyRow[]) ?? []}
      run={run ?? null}
      liveStates={liveStates}
    />
  )
}
