import type { Metadata } from "next"
import { Sidebar } from "@/components/layout/sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ROUTES } from "@/lib/constants"

export const metadata: Metadata = {
  title: {
    template: "%s | Aegis Medic Proctor",
    default: "Dashboard | Aegis Medic Proctor",
  },
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/sign-in")
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, email, avatar_url, current_org_id, created_at, updated_at")
    .eq("id", user.id)
    .single()

  // Fetch org
  const { data: memberRaw } = await supabase
    .from("organization_members")
    .select("role, org_id, organizations(name)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: false })
    .limit(1)
    .single()

  type MemberWithOrg = { role: string; org_id: string; organizations: { name: string } | null }
  const member = memberRaw as unknown as MemberWithOrg | null

  // No org membership — send to onboarding
  if (!member) {
    redirect(ROUTES.onboarding)
  }

  const orgName = member?.organizations?.name

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0c10]">
      <Sidebar
        user={profile ? {
          display_name: profile.display_name,
          email: profile.email,
          avatar_url: profile.avatar_url ?? undefined,
          role: member?.role,
        } : undefined}
        orgName={orgName}
      />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
