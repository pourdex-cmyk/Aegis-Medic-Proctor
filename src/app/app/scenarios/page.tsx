import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { ScenariosClient } from "./scenarios-client"

export const metadata: Metadata = { title: "Scenarios" }

export default async function ScenariosPage() {
  const supabase = await createClient()

  const [{ data: scenarios }, { data: doctrinePacks }] = await Promise.all([
    supabase
      .from("scenarios")
      .select("id, title, description, audience, environment, scenario_type, complexity, casualty_count, evac_delay_minutes, status, ai_generated, tags, created_at, updated_at, doctrine_pack_id")
      .order("updated_at", { ascending: false }),
    supabase
      .from("doctrine_packs")
      .select("id, name, status")
      .eq("status", "approved"),
  ])

  return (
    <ScenariosClient
      scenarios={scenarios ?? []}
      doctrinePacks={doctrinePacks ?? []}
    />
  )
}
