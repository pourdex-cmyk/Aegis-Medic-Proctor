import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { OrgSettingsClient } from "./org-settings-client"

export const metadata: Metadata = { title: "Organization Settings" }

export default async function OrgSettingsPage() {
  const supabase = await createClient()

  const [{ data: memberRaw }, { data: profile }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("role, org_id, organizations(id, name, type, slug, created_at, settings)")
      .eq("is_active", true)
      .limit(1)
      .single(),
    supabase.from("profiles").select("id, display_name, email, avatar_url").single(),
  ])

  type MemberWithOrg = { role: string; org_id: string; organizations: { id: string; name: string; type: string; slug: string; created_at: string; settings: unknown } | null }
  const member = memberRaw as unknown as MemberWithOrg | null

  return (
    <OrgSettingsClient
      org={member?.organizations ?? null}
      memberRole={member?.role ?? ""}
      userProfile={profile}
    />
  )
}
