import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { ScenariosClient } from "./scenarios-client"

export const metadata: Metadata = { title: "Scenarios" }

export default async function ScenariosPage() {
  const supabase = await createClient()

  const [{ data: scenarios }, { data: doctrinePacks }] = await Promise.all([
    supabase
      .from("scenarios")
      .select("*")
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
