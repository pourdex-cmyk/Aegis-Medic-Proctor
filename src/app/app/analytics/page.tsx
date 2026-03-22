import type { Metadata } from "next"
import { AnalyticsDashboard } from "./analytics-client"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Analytics" }

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const [{ data: runs }, { data: scores }, { data: scenarios }, { count: totalRuns }] = await Promise.all([
    supabase
      .from("scenario_runs")
      .select("id, status, clock_seconds, created_at, scenarios(title, complexity, audience)")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("scores")
      .select("percentage, dimension_scores, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("scenarios")
      .select("id, audience, complexity, scenario_type")
      .limit(100),
    supabase.from("scenario_runs").select("*", { count: "exact", head: true }),
  ])

  return (
    <AnalyticsDashboard
      runs={runs ?? []}
      scores={scores ?? []}
      scenarios={scenarios ?? []}
      totalRuns={totalRuns ?? 0}
    />
  )
}
