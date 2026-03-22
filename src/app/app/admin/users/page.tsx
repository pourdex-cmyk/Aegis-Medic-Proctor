import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { UsersClient } from "./users-client"

export const metadata: Metadata = { title: "User Management" }

export default async function UsersPage() {
  const supabase = await createClient()

  const [{ data: currentMember }, { data: members }, { data: invites }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("role, org_id")
      .eq("is_active", true)
      .limit(1)
      .single(),
    supabase
      .from("organization_members")
      .select("id, role, is_active, joined_at, profiles(id, display_name, email, avatar_url)")
      .order("joined_at", { ascending: false }),
    supabase
      .from("organization_invites")
      .select("id, email, role, expires_at, created_at, accepted_at")
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ])

  return (
    <UsersClient
      members={members ?? []}
      invites={invites ?? []}
      currentRole={currentMember?.role ?? ""}
    />
  )
}
