import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { DashboardClient } from "./dashboard-client"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch stats in parallel
  const [
    { data: profile },
    { data: member },
    { data: recentRuns },
    { data: recentScenarios },
    { count: totalScenarios },
    { count: activeRuns },
    { data: recentAudit },
  ] = await Promise.all([
    supabase.from("profiles").select("id, display_name, email, avatar_url, current_org_id, created_at, updated_at").eq("id", user.id).single(),
    supabase
      .from("organization_members")
      .select("*, organizations(name, type)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("joined_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("scenario_runs")
      .select("*, scenarios(title, environment, complexity)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("scenarios")
      .select("id, title, environment, complexity, casualty_count, created_at, status, audience")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("scenarios").select("*", { count: "exact", head: true }),
    supabase.from("scenario_runs").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("audit_logs")
      .select("id, action, resource_type, description, created_at, actor_display_name")
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  return (
    <DashboardClient
      user={profile}
      member={member}
      recentRuns={recentRuns ?? []}
      recentScenarios={recentScenarios ?? []}
      totalScenarios={totalScenarios ?? 0}
      activeRuns={activeRuns ?? 0}
      recentAudit={recentAudit ?? []}
    />
  )
}
