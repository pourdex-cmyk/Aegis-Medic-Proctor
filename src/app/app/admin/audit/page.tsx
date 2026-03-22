import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { AuditClient } from "./audit-client"

export const metadata: Metadata = { title: "Audit Log" }

export default async function AuditPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from("audit_logs")
    .select(`
      id, action, resource_type, resource_id, metadata, created_at, ip_address,
      profiles(display_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(200)

  return <AuditClient logs={logs ?? []} />
}
