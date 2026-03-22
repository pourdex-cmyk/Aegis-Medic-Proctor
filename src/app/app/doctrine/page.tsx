import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { DoctrineClient } from "./doctrine-client"

export const metadata: Metadata = { title: "Doctrine Packs" }

export default async function DoctrinePage() {
  const supabase = await createClient()

  const [{ data: packs }, { data: member }] = await Promise.all([
    supabase
      .from("doctrine_packs")
      .select("id, name, version, audience, status, description, document_count, rule_count, approved_at, created_at, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("organization_members")
      .select("role, org_id")
      .eq("is_active", true)
      .limit(1)
      .single(),
  ])

  return (
    <DoctrineClient
      packs={packs ?? []}
      canManage={["org_admin", "doctrine_sme", "lead_proctor"].includes(member?.role ?? "")}
    />
  )
}
