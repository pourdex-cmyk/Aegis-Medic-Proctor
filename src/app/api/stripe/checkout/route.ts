import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { priceId } = await req.json() as { priceId: string }
  if (!priceId) return NextResponse.json({ error: "priceId required" }, { status: 400 })

  // Get org + existing Stripe customer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberRaw } = await (supabase as any)
    .from("organization_members")
    .select("org_id, organizations(id, name, stripe_customer_id, stripe_subscription_id)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: false })
    .limit(1)
    .single() as {
      data: {
        org_id: string
        organizations: {
          id: string
          name: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        } | null
      } | null
    }

  const org = memberRaw?.organizations
  if (!org) return NextResponse.json({ error: "No organization found" }, { status: 400 })

  // If already has an active subscription, route to portal instead
  if (org.stripe_subscription_id) {
    return NextResponse.json({ error: "Already subscribed — use /api/stripe/portal to manage" }, { status: 400 })
  }

  const svc = await createServiceClient()

  // Create or reuse Stripe customer
  let customerId = org.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: org.name,
      metadata: { org_id: org.id, user_id: user.id },
    })
    customerId = customer.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (svc as any).from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", org.id)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { org_id: org.id },
    },
    metadata: { org_id: org.id },
    allow_promotion_codes: true,
    success_url: `${baseUrl}/app/billing?success=true`,
    cancel_url: `${baseUrl}/app/billing?canceled=true`,
  })

  return NextResponse.json({ url: session.url })
}
