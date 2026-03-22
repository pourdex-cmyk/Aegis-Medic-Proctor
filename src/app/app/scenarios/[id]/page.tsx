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

  const [{ data: scenario }, { data: casualties }, { data: injects }, { data: runs }] =
    await Promise.all([
      supabase
        .from("scenarios")
        .select("*, doctrine_packs(name, version)")
        .eq("id", id)
        .single(),
      supabase
        .from("casualty_profiles")
        .select("id, callsign, display_label, triage_category, mechanism_of_injury, visible_injuries, airway_status, breathing_status, circulation_state, neurologic_status, pain_level, baseline_vitals")
        .eq("scenario_id", id)
        .order("triage_category"),
      supabase
        .from("scenario_injects")
        .select("id, inject_type, trigger_type, trigger_value, title, description, elapsed_at_seconds")
        .eq("scenario_id", id)
        .order("elapsed_at_seconds", { ascending: true }),
      supabase
        .from("scenario_runs")
        .select("id, status, clock_seconds, created_at")
        .eq("scenario_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  if (!scenario) notFound()

  return (
    <ScenarioDetail
      scenario={scenario}
      casualties={casualties ?? []}
      injects={injects ?? []}
      recentRuns={runs ?? []}
    />
  )
}
