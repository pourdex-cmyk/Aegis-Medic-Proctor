import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberRaw } = await (supabase as any)
    .from("organization_members")
    .select("organizations(id, stripe_customer_id)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: false })
    .limit(1)
    .single() as {
      data: {
        organizations: { id: string; stripe_customer_id: string | null } | null
      } | null
    }

  const customerId = memberRaw?.organizations?.stripe_customer_id
  if (!customerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 })
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing`,
  })

  return NextResponse.json({ url: session.url })
}
