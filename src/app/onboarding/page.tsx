import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingWizard } from "./onboarding-wizard"
import { ROUTES } from "@/lib/constants"

export const metadata: Metadata = { title: "Set Up Your Organization" }

export default async function OnboardingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.signIn)

  // If already onboarded (has org membership), skip
  const { data: member } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single()

  if (member) redirect(ROUTES.dashboard)

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
    />
  )
}
