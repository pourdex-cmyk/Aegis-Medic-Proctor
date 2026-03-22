import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { OrgSettingsClient } from "./org-settings-client"

export const metadata: Metadata = { title: "Organization Settings" }

export default async function OrgSettingsPage() {
  const supabase = await createClient()

  const [{ data: member }, { data: profile }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("role, org_id, organizations(id, name, org_type, slug, plan_tier, max_members, created_at, settings)")
      .eq("is_active", true)
      .limit(1)
      .single(),
    supabase.from("profiles").select("id, display_name, email, avatar_url").single(),
  ])

  return (
    <OrgSettingsClient
      org={(member?.organizations as { id: string; name: string; org_type: string; slug: string; plan_tier: string; max_members: number; created_at: string; settings: unknown }) ?? null}
      memberRole={member?.role ?? ""}
      userProfile={profile}
    />
  )
}
