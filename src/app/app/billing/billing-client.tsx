"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Check, CreditCard, Zap, Building2, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { PLANS } from "@/lib/stripe"
import { toast } from "sonner"

interface OrgBilling {
  id: string
  name: string
  plan_tier: string
  stripe_subscription_status: string | null
  subscription_period_end: string | null
}

interface Props {
  org: OrgBilling
  role: string
  successParam?: boolean
  canceledParam?: boolean
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active:              { label: "Active",        color: "text-green-400",  dot: "bg-green-400" },
  trialing:            { label: "Trial",         color: "text-blue-400",   dot: "bg-blue-400 animate-pulse" },
  past_due:            { label: "Past Due",      color: "text-amber-400",  dot: "bg-amber-400 animate-pulse" },
  canceled:            { label: "Canceled",      color: "text-red-400",    dot: "bg-red-400" },
  unpaid:              { label: "Unpaid",        color: "text-red-400",    dot: "bg-red-400 animate-pulse" },
  incomplete:          { label: "Incomplete",    color: "text-amber-400",  dot: "bg-amber-400" },
  inactive:            { label: "No Subscription", color: "text-[#4a5370]", dot: "bg-[#4a5370]" },
}

export function BillingClient({ org, role, successParam, canceledParam }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const isActive = org.stripe_subscription_status === "active" || org.stripe_subscription_status === "trialing"
  const isAdmin = role === "org_admin"
  const statusCfg = STATUS_CONFIG[org.stripe_subscription_status ?? "inactive"] ?? STATUS_CONFIG.inactive

  const handleSubscribe = async (priceId: string, planKey: string) => {
    if (!isAdmin) {
      toast.error("Only org admins can manage billing")
      return
    }
    setLoading(planKey)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error ?? "Failed to start checkout")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  const handleManageBilling = async () => {
    if (!isAdmin) {
      toast.error("Only org admins can manage billing")
      return
    }
    setLoading("portal")
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error ?? "Failed to open billing portal")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#f0f4ff] p-6 md:p-10 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-[#f0f4ff]">Billing</h1>
        <p className="text-sm text-[#6b7594] mt-1">{org.name}</p>
      </div>

      {/* Success / Canceled banners */}
      {successParam && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-green-700/40 bg-green-950/30 px-5 py-4 mb-6"
        >
          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-300">Subscription activated</p>
            <p className="text-xs text-green-400/70">Your 14-day trial has started. Full access is now enabled.</p>
          </div>
        </motion.div>
      )}
      {canceledParam && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-amber-700/40 bg-amber-950/30 px-5 py-4 mb-6"
        >
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">Checkout was canceled. Your subscription has not been changed.</p>
        </motion.div>
      )}

      {/* Current status card */}
      <div className="rounded-2xl border border-[#1e2330] bg-[#0f1117] p-6 mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-[#4a5370] uppercase tracking-wider mb-2">Current Plan</p>
            <div className="flex items-center gap-2.5">
              <div className={cn("h-2 w-2 rounded-full", statusCfg.dot)} />
              <span className={cn("text-sm font-bold", statusCfg.color)}>{statusCfg.label}</span>
            </div>
            <p className="text-2xl font-black text-[#f0f4ff] mt-1 capitalize">{org.plan_tier}</p>
            {org.subscription_period_end && isActive && (
              <p className="text-xs text-[#4a5370] mt-1">
                {org.stripe_subscription_status === "trialing" ? "Trial ends" : "Renews"}{" "}
                {new Date(org.subscription_period_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
          {isActive && isAdmin && (
            <button
              onClick={handleManageBilling}
              disabled={loading === "portal"}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#2d3347] bg-[#0a0c10] text-sm font-semibold text-[#9daabf] hover:border-[#4a5370] hover:text-[#f0f4ff] transition-all disabled:opacity-50"
            >
              {loading === "portal" ? (
                <span className="h-4 w-4 border-2 border-[#4a5370] border-t-transparent rounded-full animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Manage Billing
            </button>
          )}
        </div>

        {!isAdmin && (
          <p className="mt-4 text-xs text-[#4a5370] border-t border-[#1e2330] pt-4">
            Contact your organization admin to manage the subscription.
          </p>
        )}

        {org.stripe_subscription_status === "past_due" && (
          <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 border-t border-[#1e2330] pt-4">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Payment failed. Update your payment method to restore access.
          </div>
        )}
      </div>

      {/* Pricing cards — shown when no active subscription */}
      {!isActive && (
        <>
          <div className="mb-6">
            <h2 className="text-lg font-black text-[#f0f4ff]">Choose a plan</h2>
            <p className="text-sm text-[#6b7594] mt-1">
              All plans include a 14-day free trial. No credit card charge until the trial ends.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.entries(PLANS) as [string, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => {
              const isPro = key === "professional"
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: isPro ? 0 : 0.08 }}
                  className={cn(
                    "relative rounded-2xl border p-6 flex flex-col",
                    isPro
                      ? "border-blue-700/60 bg-blue-950/10"
                      : "border-[#2d3347] bg-[#0f1117]"
                  )}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-6">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {isPro
                          ? <Zap className="h-4 w-4 text-blue-400" />
                          : <Building2 className="h-4 w-4 text-purple-400" />
                        }
                        <h3 className="text-base font-black text-[#f0f4ff]">{plan.name}</h3>
                      </div>
                      <p className="text-xs text-[#6b7594]">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <span className="text-4xl font-black text-[#f0f4ff]">${plan.price}</span>
                    <span className="text-sm text-[#4a5370]"> / month</span>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-[#9daabf]">
                        <Check className={cn("h-4 w-4 shrink-0 mt-0.5", isPro ? "text-blue-400" : "text-purple-400")} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.priceId, key)}
                    disabled={!!loading || !isAdmin || !plan.priceId}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50",
                      isPro
                        ? "bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/30"
                        : "bg-[#1e2330] hover:bg-[#2d3347] text-[#f0f4ff] border border-[#2d3347]"
                    )}
                  >
                    {loading === key ? (
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        {isAdmin ? "Start 14-Day Trial" : "Admin only"}
                      </>
                    )}
                  </button>

                  {!plan.priceId && (
                    <p className="text-[10px] text-[#3e465e] text-center mt-2">
                      Configure STRIPE_PROFESSIONAL_PRICE_ID in environment
                    </p>
                  )}
                </motion.div>
              )
            })}
          </div>
        </>
      )}

      {/* Active subscription — show plan comparison */}
      {isActive && (
        <div className="mt-2">
          <h2 className="text-sm font-semibold text-[#4a5370] uppercase tracking-wider mb-4">Your plan includes</h2>
          <div className="rounded-2xl border border-[#1e2330] bg-[#0f1117] p-6">
            <ul className="space-y-2">
              {(PLANS[org.plan_tier as keyof typeof PLANS] ?? PLANS.professional).features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-[#9daabf]">
                  <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
