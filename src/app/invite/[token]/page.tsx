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

  // Look up invite by token
  const { data: inviteRaw } = await supabase
    .from("organization_invites")
    .select("id, email, role, expires_at, accepted_at")
    .eq("token", token)
    .single()

  type InviteData = { id: string; email: string; role: string; expires_at: string; accepted_at: string | null }
  const invite = inviteRaw as InviteData | null

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
