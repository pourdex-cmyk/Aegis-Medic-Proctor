import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ROUTES } from "@/lib/constants"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: member } = await supabase
    .from("organization_members")
    .select("role")
    .eq("is_active", true)
    .limit(1)
    .single()

  const isAdmin = ["org_admin", "super_admin"].includes(member?.role ?? "")
  if (!isAdmin) redirect(ROUTES.DASHBOARD)

  return <>{children}</>
}
