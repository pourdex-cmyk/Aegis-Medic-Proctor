import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BillingClient } from "./billing-client"

export const metadata: Metadata = { title: "Billing" }

interface Props {
  searchParams: Promise<{ success?: string; canceled?: string }>
}

export default async function BillingPage({ searchParams }: Props) {
  const { success, canceled } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/sign-in")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberRaw } = await (supabase as any)
    .from("organization_members")
    .select("role, org_id, organizations(id, name, plan_tier, stripe_subscription_status, subscription_period_end)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: false })
    .limit(1)
    .single() as {
      data: {
        role: string
        org_id: string
        organizations: {
          id: string
          name: string
          plan_tier: string
          stripe_subscription_status: string | null
          subscription_period_end: string | null
        } | null
      } | null
    }

  if (!memberRaw?.organizations) redirect("/onboarding")

  return (
    <BillingClient
      org={memberRaw.organizations}
      role={memberRaw.role}
      successParam={success === "true"}
      canceledParam={canceled === "true"}
    />
  )
}
