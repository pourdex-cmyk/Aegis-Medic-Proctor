import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Verify the caller is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orgName, orgSlug, orgType, role, displayName } = await req.json() as {
    orgName: string
    orgSlug: string
    orgType: string
    role: string
    displayName: string
  }

  if (!orgName || !orgType || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const name = displayName || user.email?.split("@")[0] || "User"

  // Ensure profile exists — FK required by organization_members
  await supabase.from("profiles").upsert(
    { id: user.id, email: user.email ?? "", display_name: name },
    { onConflict: "id" }
  )

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: orgName.trim(), slug: orgSlug, type: orgType })
    .select("id")
    .single()

  if (orgError) {
    return NextResponse.json(
      { error: (orgError as { message?: string }).message ?? "Failed to create organization" },
      { status: 400 }
    )
  }

  // Create membership
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      org_id: org.id,
      user_id: user.id,
      role,
      display_name: name,
      is_active: true,
      joined_at: new Date().toISOString(),
    })

  if (memberError) {
    // Roll back the org we just created
    await supabase.from("organizations").delete().eq("id", org.id)
    return NextResponse.json(
      { error: (memberError as { message?: string }).message ?? "Failed to create membership" },
      { status: 400 }
    )
  }

  return NextResponse.json({ orgId: org.id })
}
