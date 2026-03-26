import { NextRequest, NextResponse } from "next/server"
import { stripe, PRICE_TO_TIER } from "@/lib/stripe"
import { createServiceClient } from "@/lib/supabase/server"
import type Stripe from "stripe"

// Next.js App Router does not buffer the body — read as text for Stripe signature
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  try {
    switch (event.type) {

      // ── New subscription created via checkout ──────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const orgId = session.metadata?.org_id
        if (!orgId || !session.subscription) break

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0]?.price.id ?? ""
        const planTier = PRICE_TO_TIER[priceId] ?? "professional"

        await db.from("organizations").update({
          stripe_subscription_id: subscription.id,
          stripe_subscription_status: subscription.status,
          plan_tier: planTier,
          subscription_period_end: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
        }).eq("id", orgId)
        break
      }

      // ── Subscription updated (renewal, upgrade, downgrade, pause) ──────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const orgId = subscription.metadata?.org_id
        if (!orgId) break

        const priceId = subscription.items.data[0]?.price.id ?? ""
        const planTier = PRICE_TO_TIER[priceId] ?? "professional"
        const isActive = subscription.status === "active" || subscription.status === "trialing"

        await db.from("organizations").update({
          stripe_subscription_status: subscription.status,
          plan_tier: isActive ? planTier : "free",
          subscription_period_end: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
        }).eq("id", orgId)
        break
      }

      // ── Subscription canceled ──────────────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const orgId = subscription.metadata?.org_id
        if (!orgId) break

        await db.from("organizations").update({
          stripe_subscription_id: null,
          stripe_subscription_status: "canceled",
          plan_tier: "free",
          subscription_period_end: null,
        }).eq("id", orgId)
        break
      }

      // ── Payment failed ─────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription
        if (!subscriptionId) break

        const { data: org } = await db
          .from("organizations")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .single()

        if (org) {
          await db.from("organizations").update({
            stripe_subscription_status: "past_due",
          }).eq("id", org.id)
        }
        break
      }

      // ── Payment succeeded (renewal) ────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription
        if (!subscriptionId) break

        const { data: org } = await db
          .from("organizations")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .single()

        if (org) {
          await db.from("organizations").update({
            stripe_subscription_status: "active",
          }).eq("id", org.id)
        }
        break
      }
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
