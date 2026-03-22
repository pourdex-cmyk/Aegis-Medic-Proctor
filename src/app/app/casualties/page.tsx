import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { CasualtiesClient } from "./casualties-client"

export const metadata: Metadata = { title: "Casualty Profiles" }

export default async function CasualtiesPage() {
  const supabase = await createClient()

  const [{ data: casualties }, { data: scenarios }] = await Promise.all([
    supabase
      .from("casualty_profiles")
      .select(
        "id, callsign, display_label, mechanism_of_injury, triage_category, airway_status, breathing_status, circulation_state, neurologic_status, pain_level, visible_injuries, ai_generated, created_at, scenario_id"
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("scenarios")
      .select("id, title"),
  ])

  return (
    <CasualtiesClient
      casualties={casualties ?? []}
      scenarios={scenarios ?? []}
    />
  )
}
