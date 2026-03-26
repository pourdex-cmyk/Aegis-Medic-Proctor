import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: "2024-06-20" as any,
  typescript: true,
})

export const PLANS = {
  professional: {
    name: "Professional",
    description: "Full platform access for operational teams",
    price: 199,
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID ?? "",
    tier: "professional" as const,
    maxMembers: 50,
    features: [
      "Up to 50 members",
      "Unlimited live scenarios",
      "AI treatment interpretation",
      "Patient actor system with TTS",
      "Doctrine pack management",
      "Real-time command center",
      "Priority email support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    description: "Unlimited scale for large organizations",
    price: 499,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? "",
    tier: "enterprise" as const,
    maxMembers: Infinity,
    features: [
      "Unlimited members",
      "Unlimited live scenarios",
      "AI treatment interpretation",
      "Patient actor system with TTS",
      "Custom doctrine packs",
      "Real-time command center",
      "Dedicated account manager",
      "SLA guarantee",
      "Custom integrations",
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS

export const PRICE_TO_TIER: Record<string, string> = {
  [process.env.STRIPE_PROFESSIONAL_PRICE_ID ?? "___"]: "professional",
  [process.env.STRIPE_ENTERPRISE_PRICE_ID ?? "___"]: "enterprise",
}

export function isSubscriptionActive(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing"
}
