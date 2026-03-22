import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { ReportsClient } from "./reports-client"

export const metadata: Metadata = { title: "After Action Reports" }

export default async function ReportsPage() {
  const supabase = await createClient()

  const [{ data: reports }, { data: scores }] = await Promise.all([
    supabase
      .from("reports")
      .select(`
        id, status, title, summary, ai_narrative, strengths, failures, remediation_plan, created_at,
        scenario_runs(
          id, status, clock_seconds, created_at,
          scenarios(title, complexity, audience, environment)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("scores")
      .select("run_id, percentage, dimension_scores, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ])

  return (
    <ReportsClient
      reports={reports ?? []}
      scores={scores ?? []}
    />
  )
}
