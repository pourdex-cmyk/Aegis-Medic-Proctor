import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { SettingsClient } from "./settings-client"

export const metadata: Metadata = { title: "Profile Settings" }

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: memberRaw }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, email, avatar_url, current_org_id, created_at")
      .eq("id", user?.id ?? "")
      .single(),
    supabase
      .from("organization_members")
      .select("role, joined_at, organizations(name, type)")
      .eq("user_id", user?.id ?? "")
      .eq("is_active", true)
      .limit(1)
      .single(),
  ])

  type MemberWithOrg = {
    role: string
    joined_at: string
    organizations: { name: string; type: string } | null
  }

  const member = memberRaw as unknown as MemberWithOrg | null

  return (
    <SettingsClient
      user={user ?? null}
      profile={profile ?? null}
      membership={
        member
          ? {
              role: member.role,
              joined_at: member.joined_at,
              org_name: member.organizations?.name ?? null,
              org_type: member.organizations?.type ?? null,
            }
          : null
      }
    />
  )
}
