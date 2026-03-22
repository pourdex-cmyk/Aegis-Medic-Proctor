import { redirect } from "next/navigation"

// Redirect /admin to /admin/settings
export default function AdminPage() {
  redirect("/app/admin/settings")
}
