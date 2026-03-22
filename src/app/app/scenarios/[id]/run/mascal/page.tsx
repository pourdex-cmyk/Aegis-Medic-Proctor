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
  let liveStates: Array<{ casualty_id: string; current_vitals: unknown; triage_override?: string | null }> = []
  if (run?.id) {
    const { data } = await supabase
      .from("casualty_states")
      .select("casualty_id, current_vitals, triage_override")
      .eq("run_id", run.id)
    liveStates = data ?? []
  }

  return (
    <MascalBoard
      scenario={scenario}
      casualties={casualties ?? []}
      run={run ?? null}
      liveStates={liveStates}
    />
  )
}
