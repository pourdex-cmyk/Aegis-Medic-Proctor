import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const patchSchema = z.object({
  role: z.enum(["org_admin", "lead_proctor", "proctor", "doctrine_sme", "analyst", "observer"]).optional(),
  is_active: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params
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

    // Verify the target member belongs to the same org
    const { data: targetMember } = await supabase
      .from("organization_members")
      .select("id, user_id, role, org_id")
      .eq("id", memberId)
      .eq("org_id", callerMember.org_id)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Prevent self-demotion of last admin
    if (targetMember.user_id === user.id) {
      return NextResponse.json({ error: "Cannot modify your own membership" }, { status: 400 })
    }

    const body = patchSchema.parse(await req.json())
    const updates: Record<string, unknown> = {}
    if (body.role !== undefined) updates.role = body.role
    if (body.is_active !== undefined) updates.is_active = body.is_active

    const { data: updated, error } = await supabase
      .from("organization_members")
      .update(updates)
      .eq("id", memberId)
      .select()
      .single()

    if (error) throw error

    await supabase.from("audit_logs").insert({
      org_id: callerMember.org_id,
      actor_id: user.id,
      action: "member.updated",
      resource_type: "organization_member",
      resource_id: memberId,
      description: `Member updated: ${Object.keys(updates).join(", ")}`,
      metadata: { target_user: targetMember.user_id, changes: updates as Record<string, string> },
    })

    return NextResponse.json({ member: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 })
    }
    console.error("[admin/members/PATCH]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update member" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params
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

    const { data: targetMember } = await supabase
      .from("organization_members")
      .select("id, user_id, org_id")
      .eq("id", memberId)
      .eq("org_id", callerMember.org_id)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    if (targetMember.user_id === user.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 })
    }

    // Soft delete — set is_active = false
    const { error } = await supabase
      .from("organization_members")
      .update({ is_active: false })
      .eq("id", memberId)

    if (error) throw error

    await supabase.from("audit_logs").insert({
      org_id: callerMember.org_id,
      actor_id: user.id,
      action: "member.removed",
      resource_type: "organization_member",
      resource_id: memberId,
      description: `Member removed from organization`,
      metadata: { target_user: targetMember.user_id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[admin/members/DELETE]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to remove member" },
      { status: 500 }
    )
  }
}
