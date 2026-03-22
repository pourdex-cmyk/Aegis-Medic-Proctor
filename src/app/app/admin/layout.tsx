import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ROUTES } from "@/lib/constants"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.signIn)

  const { data: member } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  const isAdmin = ["org_admin", "super_admin"].includes(member?.role ?? "")
  if (!isAdmin) redirect(ROUTES.dashboard)

  return <>{children}</>
}
