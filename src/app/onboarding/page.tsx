import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingWizard } from "./onboarding-wizard"
import { ROUTES } from "@/lib/constants"

export const metadata: Metadata = { title: "Set Up Your Organization" }

interface Props {
  searchParams: Promise<{ success?: string; canceled?: string }>
}

export default async function OnboardingPage({ searchParams }: Props) {
  const { success, canceled } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.signIn)

  // If already onboarded (has org membership), only skip if NOT returning from Stripe
  const { data: member } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single()

  if (member && success !== "true") redirect(ROUTES.dashboard)

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .single()

  return (
    <OnboardingWizard
      userId={user.id}
      userEmail={profile?.email ?? user.email ?? ""}
      displayName={profile?.display_name ?? ""}
      subscriptionSuccess={success === "true"}
      subscriptionCanceled={canceled === "true"}
    />
  )
}
