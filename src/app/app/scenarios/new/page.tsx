import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { ScenarioWizard } from "./scenario-wizard"

export const metadata: Metadata = { title: "New Scenario" }

export default async function NewScenarioPage() {
  const supabase = await createClient()

  const [{ data: doctrinePacks }, { data: profile }] = await Promise.all([
    supabase
      .from("doctrine_packs")
      .select("id, name, audience, version")
      .eq("status", "approved")
      .order("name"),
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return { data: null }
      return supabase.from("profiles").select("id, display_name").eq("id", user.id).single()
    }),
  ])

  return (
    <ScenarioWizard
      doctrinePacks={doctrinePacks ?? []}
      userId={(profile as { id: string } | null)?.id ?? ""}
    />
  )
}
