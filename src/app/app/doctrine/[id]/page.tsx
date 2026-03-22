import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DoctrinePackDetail } from "./doctrine-pack-detail"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("doctrine_packs").select("name").eq("id", id).single()
  return { title: data?.name ?? "Doctrine Pack" }
}

export default async function DoctrinePackPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: pack }, { data: documents }, { data: rules }, { data: member }] = await Promise.all([
    supabase
      .from("doctrine_packs")
      .select("id, name, version, audience, status, description, document_count, rule_count, approved_at, created_at, updated_at")
      .eq("id", id)
      .single(),
    supabase
      .from("doctrine_documents")
      .select("id, title, file_type, status, chunk_count, created_at")
      .eq("pack_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("doctrine_rules")
      .select("id, title, description, category, approval_status, chunk_id, created_at")
      .eq("pack_id", id)
      .order("approval_status", { ascending: true }),
    supabase
      .from("organization_members")
      .select("role")
      .eq("is_active", true)
      .limit(1)
      .single(),
  ])

  if (!pack) notFound()

  const canApprove = ["org_admin", "doctrine_sme", "lead_proctor"].includes(member?.role ?? "")

  return (
    <DoctrinePackDetail
      pack={pack}
      documents={documents ?? []}
      rules={rules ?? []}
      canApprove={canApprove}
    />
  )
}
