import type { Metadata } from "next"
import { Sidebar } from "@/components/layout/sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

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
    .select("*")
    .eq("id", user.id)
    .single()

  // Fetch org
  const { data: member } = await supabase
    .from("organization_members")
    .select("*, organizations(name)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: false })
    .limit(1)
    .single()

  const orgName = (member?.organizations as unknown as { name: string })?.name

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
