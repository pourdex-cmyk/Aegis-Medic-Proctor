import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const bodySchema = z.object({
  name: z.string().min(2).max(120).optional(),
  settings: z.record(z.unknown()).optional(),
})

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.settings !== undefined) updates.settings = body.settings

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { data: org, error: updateError } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", member.org_id)
      .select()
      .single()

    if (updateError) throw updateError

    await supabase.from("audit_logs").insert({
      org_id: member.org_id,
      actor_id: user.id,
      action: "org.updated",
      resource_type: "organization",
      resource_id: member.org_id,
      description: `Organization settings updated: ${Object.keys(updates).join(", ")}`,
      metadata: { fields: Object.keys(updates) },
    })

    return NextResponse.json({ org })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 })
    }
    console.error("[admin/org]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update organization" },
      { status: 500 }
    )
  }
}
