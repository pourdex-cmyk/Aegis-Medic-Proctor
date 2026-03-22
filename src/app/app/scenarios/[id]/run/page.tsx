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

  const [{ data: scenario }, { data: casualties }, { data: profile }] = await Promise.all([
    supabase
      .from("scenarios")
      .select("*, doctrine_packs(name)")
      .eq("id", id)
      .single(),
    supabase
      .from("casualty_profiles")
      .select("*")
      .eq("scenario_id", id)
      .order("sort_order"),
    supabase.from("profiles").select("id, display_name").eq("id", user.id).single(),
  ])

  if (!scenario) notFound()

  // Check if there's an active run
  const { data: activeRun } = await supabase
    .from("scenario_runs")
    .select("*")
    .eq("scenario_id", id)
    .in("status", ["active", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  return (
    <RunCommandCenter
      scenario={scenario}
      casualties={casualties ?? []}
      activeRun={activeRun ?? null}
      userId={user.id}
      userName={(profile as { display_name: string } | null)?.display_name ?? "Proctor"}
    />
  )
}
