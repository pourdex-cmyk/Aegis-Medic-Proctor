import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { z } from "zod"
import { generateId } from "@/lib/utils"

const bodySchema = z.object({
  email: z.string().email(),
  role: z.enum(["org_admin", "lead_proctor", "proctor", "doctrine_sme", "analyst", "observer"]),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the caller's org membership and verify admin role
    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: "Not a member of any organization" }, { status: 403 })
    }

    if (!["org_admin", "super_admin"].includes(member.role)) {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 })
    }

    const body = bodySchema.parse(await req.json())

    // Check if email is already a member
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", body.email)
      .maybeSingle()

    if (existingProfile) {
      const { data: existingMember } = await supabase
        .from("organization_members")
        .select("id")
        .eq("org_id", member.org_id)
        .eq("user_id", existingProfile.id)
        .maybeSingle()

      if (existingMember) {
        return NextResponse.json({ error: "User is already a member of this organization" }, { status: 409 })
      }
    }

    // Expire any previous pending invite for this email + org
    await supabase
      .from("organization_invites")
      .update({ accepted_at: new Date().toISOString() }) // mark as consumed to deactivate
      .eq("org_id", member.org_id)
      .eq("email", body.email)
      .is("accepted_at", null)

    // Create invite token
    const token = generateId(32)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .insert({
        org_id: member.org_id,
        email: body.email,
        role: body.role,
        token,
        invited_by: user.id,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (inviteError) throw inviteError

    // Send invite email via Supabase Auth invite (uses configured SMTP)
    const serviceSupabase = createServiceClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    const inviteUrl = `${appUrl}/invite/${token}`

    // Use Supabase admin to send a magic link / invite-style email
    // This leverages the configured SMTP in Supabase Auth settings
    await serviceSupabase.auth.admin.inviteUserByEmail(body.email, {
      redirectTo: inviteUrl,
      data: {
        invite_token: token,
        invited_to_org: member.org_id,
      },
    })

    // Audit log
    await supabase.from("audit_logs").insert({
      org_id: member.org_id,
      actor_id: user.id,
      action: "invite.sent",
      resource_type: "organization_invite",
      resource_id: invite.id,
      description: `Invite sent to ${body.email} for role ${body.role}`,
      metadata: { email: body.email, role: body.role },
    })

    return NextResponse.json({ invite, inviteUrl })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 })
    }
    console.error("[admin/invite]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send invite" },
      { status: 500 }
    )
  }
}
