import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: callerMember } = await supabase
      .from("organization_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (!callerMember || !["org_admin", "super_admin"].includes(callerMember.role)) {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 })
    }

    const { data: invite } = await supabase
      .from("organization_invites")
      .select("id, org_id, email")
      .eq("id", inviteId)
      .eq("org_id", callerMember.org_id)
      .single()

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    // Mark as revoked by setting accepted_at to a sentinel value
    // A real revoke would ideally have a `revoked_at` column — here we set expires_at to now
    const { error } = await supabase
      .from("organization_invites")
      .update({ expires_at: new Date().toISOString() })
      .eq("id", inviteId)

    if (error) throw error

    await supabase.from("audit_logs").insert({
      org_id: callerMember.org_id,
      actor_id: user.id,
      action: "invite.revoked",
      resource_type: "organization_invite",
      resource_id: inviteId,
      description: `Invite revoked for ${invite.email}`,
      metadata: { email: invite.email },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[admin/invites/DELETE]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to revoke invite" },
      { status: 500 }
    )
  }
}

// Resend invite email
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: callerMember } = await supabase
      .from("organization_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (!callerMember || !["org_admin", "super_admin"].includes(callerMember.role)) {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 })
    }

    const { data: invite } = await supabase
      .from("organization_invites")
      .select("id, org_id, email, token, role")
      .eq("id", inviteId)
      .eq("org_id", callerMember.org_id)
      .single()

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    // Extend expiry
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from("organization_invites")
      .update({ expires_at: newExpiry })
      .eq("id", inviteId)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    const inviteUrl = `${appUrl}/invite/${invite.token}`

    return NextResponse.json({ inviteUrl })
  } catch (err) {
    console.error("[admin/invites/POST]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to resend invite" },
      { status: 500 }
    )
  }
}
