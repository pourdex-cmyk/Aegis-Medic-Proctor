import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/server"
import { InviteAccept } from "./invite-accept"

interface Props {
  params: Promise<{ token: string }>
}

export const metadata: Metadata = { title: "Accept Invitation" }

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createServiceClient()

  // Look up invite by ID (token is invite ID)
  const { data: invite } = await supabase
    .from("organization_invites")
    .select("id, email, role, expires_at, accepted_at, organizations(id, name, type)")
    .eq("token", token)
    .single()

  const isExpired = invite ? new Date(invite.expires_at) < new Date() : false
  const isAccepted = !!invite?.accepted_at

  return (
    <InviteAccept
      invite={invite ?? null}
      isExpired={isExpired}
      isAccepted={isAccepted}
      token={token}
    />
  )
}
