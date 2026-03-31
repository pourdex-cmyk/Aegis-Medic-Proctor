import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  // Auth check with regular client
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
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

  // Use service client for writes — bypasses RLS so session JWT issues
  // never block legitimate org creation
  const db = await createServiceClient()

  const name = displayName || user.email?.split("@")[0] || "User"

  // Ensure profile exists — FK required by organization_members
  await db.from("profiles").upsert(
    { id: user.id, email: user.email ?? "", display_name: name },
    { onConflict: "id" }
  )

  // Create organization
  const { data: org, error: orgError } = await db
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
  const { error: memberError } = await db
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
    await db.from("organizations").delete().eq("id", org.id)
    return NextResponse.json(
      { error: (memberError as { message?: string }).message ?? "Failed to create membership" },
      { status: 400 }
    )
  }

  return NextResponse.json({ orgId: org.id })
}
