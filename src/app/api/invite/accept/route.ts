import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json() as { token: string }
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 })

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const service = createServiceClient()

    // Look up invite by token column (not id)
    const { data: invite, error: inviteError } = await service
      .from("organization_invites")
      .select("id, email, role, org_id, expires_at, accepted_at")
      .eq("token", token)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invite not found or invalid" }, { status: 404 })
    }
    if (invite.accepted_at) {
      return NextResponse.json({ error: "Invite already accepted" }, { status: 409 })
    }
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 410 })
    }
    if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: "Email mismatch — this invite is for a different email address" }, { status: 403 })
    }

    // Get the user's display_name from their profile (required column)
    const { data: profile } = await service
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()

    const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Unknown"

    // Create membership (display_name is NOT NULL in schema)
    const { error: memberError } = await service.from("organization_members").insert({
      org_id: invite.org_id,
      user_id: user.id,
      role: invite.role,
      display_name: displayName,
      is_active: true,
      joined_at: new Date().toISOString(),
    })

    if (memberError && !memberError.message.includes("duplicate")) {
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    // Mark invite accepted
    await service
      .from("organization_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id)

    // Audit log (org_id + description are NOT NULL)
    await service.from("audit_logs").insert({
      org_id: invite.org_id,
      actor_id: user.id,
      actor_display_name: displayName,
      action: "member.invite_accepted",
      resource_type: "organization_invite",
      resource_id: invite.id,
      description: `${displayName} accepted invite for role ${invite.role}`,
      metadata: { org_id: invite.org_id, role: invite.role },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[invite/accept]", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
