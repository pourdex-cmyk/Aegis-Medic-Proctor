"use client"

import React, { useState, useTransition } from "react"
import { motion } from "framer-motion"
import {
  Building2, Users, Shield, Layers, Globe, CreditCard,
  Save, AlertTriangle, CheckCircle2, Settings, Bell, Lock, Key
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert } from "@/components/ui/alert"
import { Header } from "@/components/layout/header"
import { toast } from "sonner"

interface Org {
  id: string
  name: string
  type: string
  slug: string
  plan_tier?: string
  max_members?: number
  created_at: string
  settings: unknown
}

interface OrgSettingsClientProps {
  org: Org | null
  memberRole: string
  userProfile: { id: string; display_name: string; email: string; avatar_url?: string | null } | null
}

const ORG_TYPE_LABELS: Record<string, string> = {
  military: "Military Unit",
  law_enforcement: "Law Enforcement",
  ems: "Emergency Medical Services",
  fire: "Fire Department",
  hospital: "Hospital / Medical Center",
  private: "Private / Corporate",
  academic: "Academic / Research",
}

const PLAN_CONFIGS: Record<string, { label: string; color: string; features: string[] }> = {
  free: { label: "Free", color: "text-[#9daabf]", features: ["5 scenarios", "2 seats", "Basic analytics"] },
  professional: { label: "Professional", color: "text-blue-400", features: ["Unlimited scenarios", "25 seats", "Full analytics", "Doctrine packs"] },
  enterprise: { label: "Enterprise", color: "text-amber-400", features: ["Unlimited everything", "Custom seats", "SSO", "API access", "Dedicated support"] },
}

export function OrgSettingsClient({ org, memberRole, userProfile }: OrgSettingsClientProps) {
  const [orgName, setOrgName] = useState(org?.name ?? "")
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const [notifSettings, setNotifSettings] = useState({
    run_completed: true,
    score_below_threshold: true,
    new_member: false,
    doctrine_pending: true,
  })

  const isAdmin = ["org_admin", "super_admin"].includes(memberRole)
  const plan = PLAN_CONFIGS[org?.plan_tier ?? "free"] ?? PLAN_CONFIGS.free

  const handleSaveGeneral = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/org", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: orgName }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Save failed")
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        toast.success("Organization settings saved")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save settings")
      }
    })
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Organization Settings"
        subtitle="Manage your organization, members, and preferences"
      />

      <div className="flex-1 p-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">
              <Building2 className="h-3.5 w-3.5 mr-1.5" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-3.5 w-3.5 mr-1.5" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              Security
            </TabsTrigger>
            <TabsTrigger value="plan">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              Plan & Billing
            </TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="space-y-6 mt-0">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 space-y-5">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Organization Details</CardTitle>
                    <CardDescription className="text-xs">Basic information about your organization</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="org-name">Organization Name</Label>
                      <Input
                        id="org-name"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        disabled={!isAdmin}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="org-slug">Slug</Label>
                      <Input
                        id="org-slug"
                        value={org?.slug ?? ""}
                        disabled
                        className="mt-1.5 font-mono text-[#6b7594]"
                      />
                      <p className="text-[11px] text-[#4a5370] mt-1">Slugs cannot be changed after creation.</p>
                    </div>
                    <div>
                      <Label>Organization Type</Label>
                      <div className="mt-1.5 px-3 py-2 rounded-lg border border-[#2d3347] bg-[#0d0f14] text-sm text-[#9daabf] capitalize">
                        {ORG_TYPE_LABELS[org?.type ?? ""] ?? org?.type ?? "—"}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex justify-end pt-2">
                        <Button
                          size="sm"
                          onClick={handleSaveGeneral}
                          loading={isPending}
                          leftIcon={saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                        >
                          {saved ? "Saved" : "Save Changes"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!isAdmin && (
                  <Alert variant="warning">
                    You have read-only access to organization settings. Contact an org admin to make changes.
                  </Alert>
                )}
              </div>

              {/* Right: Stats */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-xl font-bold mb-2 ${plan.color}`}>{plan.label}</div>
                    <ul className="space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-[#6b7594]">
                          <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Seat Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-2xl font-bold text-[#f0f4ff]">—</span>
                      <span className="text-sm text-[#4a5370] mb-0.5">/ {org?.max_members ?? "∞"}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1e2330] overflow-hidden">
                      <div className="h-full w-1/4 rounded-full bg-blue-500" />
                    </div>
                    <p className="text-[10px] text-[#4a5370] mt-1.5">Active members</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle className="text-sm">Notification Preferences</CardTitle>
                  <CardDescription className="text-xs">Control when the system sends alerts and emails</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: "run_completed", label: "Run Completed", description: "Notify when a scenario run is finished" },
                    { key: "score_below_threshold", label: "Score Below Threshold", description: "Alert when a score falls below 75%" },
                    { key: "new_member", label: "New Member Joined", description: "Notify org admins when someone joins" },
                    { key: "doctrine_pending", label: "Doctrine Pending Approval", description: "Alert doctrine SMEs when rules need review" },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-medium text-[#d3dce8]">{label}</p>
                        <p className="text-xs text-[#4a5370]">{description}</p>
                      </div>
                      <Switch
                        checked={notifSettings[key as keyof typeof notifSettings]}
                        onCheckedChange={(checked) =>
                          setNotifSettings((prev) => ({ ...prev, [key]: checked }))
                        }
                      />
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-end">
                    <Button size="sm" leftIcon={<Save className="h-3.5 w-3.5" />}>
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Authentication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Require email verification for new members", enabled: true },
                    { label: "Enforce session timeout after 8 hours", enabled: true },
                    { label: "Allow Google SSO login", enabled: false },
                    { label: "Restrict login to approved email domains", enabled: false },
                  ].map(({ label, enabled }) => (
                    <div key={label} className="flex items-center justify-between">
                      <p className="text-sm text-[#d3dce8]">{label}</p>
                      <Switch defaultChecked={enabled} disabled={!isAdmin} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">API Access</CardTitle>
                  <CardDescription className="text-xs">Manage API keys for integrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 rounded-lg border border-[#2d3347] bg-[#0d0f14] px-4 py-3 mb-3">
                    <Key className="h-4 w-4 text-[#4a5370]" />
                    <span className="text-xs text-[#4a5370] font-mono flex-1">•••••••••••••••••••••••••••••••</span>
                    <Badge variant="secondary" size="sm">Enterprise only</Badge>
                  </div>
                  <p className="text-[11px] text-[#4a5370]">API access requires an Enterprise plan. Contact sales to upgrade.</p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Plan */}
          <TabsContent value="plan" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Current Plan</CardTitle>
                  <CardDescription className="text-xs">Manage your subscription and billing details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-[#2d3347] bg-[#0d0f14] p-6 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xl font-bold ${plan.color}`}>{plan.label}</span>
                      <Badge variant="stable">Active</Badge>
                    </div>
                    <ul className="space-y-1.5 mb-4">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-[#6b7594]">
                          <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {org?.plan_tier !== "enterprise" && (
                      <Button size="sm" className="w-full">
                        Upgrade to Enterprise
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-[#4a5370] text-center">
                    Billing managed via Stripe. Contact{" "}
                    <span className="text-blue-400">partners@augmentationcg.onmicrosoft.com</span> for enterprise invoicing.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
