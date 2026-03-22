"use client"

import React, { useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { motion } from "framer-motion"
import {
  User, Mail, Building2, Shield, Calendar, Key,
  Save, CheckCircle2, AlertTriangle, Lock,
} from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Header } from "@/components/layout/header"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { formatRelativeTime } from "@/lib/utils"

interface Profile {
  id: string
  display_name: string
  email: string
  avatar_url: string | null
  current_org_id: string | null
  created_at: string
}

interface Membership {
  role: string
  joined_at: string
  org_name: string | null
  org_type: string | null
}

interface SettingsClientProps {
  user: SupabaseUser | null
  profile: Profile | null
  membership: Membership | null
}

interface ProfileFormValues {
  display_name: string
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

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  org_admin: "Admin",
  proctor: "Proctor",
  viewer: "Viewer",
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="h-9 w-9 rounded-lg bg-[#1a2444] border border-blue-800/40 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-blue-400" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-[#f0f4ff]">{title}</h2>
        <p className="text-xs text-[#4a5370] mt-0.5">{description}</p>
      </div>
    </div>
  )
}

export function SettingsClient({ user, profile, membership }: SettingsClientProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)

  const { register, handleSubmit, formState: { isDirty, errors } } = useForm<ProfileFormValues>({
    defaultValues: {
      display_name: profile?.display_name ?? "",
    },
  })

  const onSaveProfile = useCallback(
    async (values: ProfileFormValues) => {
      if (!profile?.id) return
      setIsSaving(true)
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from("profiles")
          .update({ display_name: values.display_name })
          .eq("id", profile.id)
        if (error) throw error
        toast.success("Profile updated successfully")
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save profile"
        toast.error(msg)
      } finally {
        setIsSaving(false)
      }
    },
    [profile]
  )

  const handleChangePassword = useCallback(async () => {
    const email = user?.email ?? profile?.email
    if (!email) {
      toast.error("No email address found on your account")
      return
    }
    setIsSendingReset(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      toast.success(`Password reset email sent to ${email}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email"
      toast.error(msg)
    } finally {
      setIsSendingReset(false)
    }
  }, [user, profile])

  const avatarUrl = profile?.avatar_url ?? null
  const initials = (profile?.display_name ?? user?.email ?? "??")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Profile Settings" subtitle="Manage your account and preferences" />

      <div className="flex-1 p-6 max-w-2xl space-y-6">
        {/* Section 1 — Profile */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <Card>
            <CardContent className="p-6">
              <SectionHeader
                icon={User}
                title="Profile"
                description="Your public identity within the Aegis system"
              />

              <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar size="lg">
                    {avatarUrl && <AvatarImage src={avatarUrl} />}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-[#d3dce8]">{profile?.display_name ?? "—"}</p>
                    <p className="text-xs text-[#4a5370]">Avatar via Gravatar based on your email</p>
                  </div>
                </div>

                <Separator className="bg-[#1e2330]" />

                {/* Display name */}
                <div className="space-y-1.5">
                  <Label htmlFor="display_name" className="text-xs text-[#9daabf]">
                    Display Name
                  </Label>
                  <Input
                    id="display_name"
                    {...register("display_name", { required: "Display name is required", minLength: { value: 2, message: "Minimum 2 characters" } })}
                    placeholder="Your name"
                  />
                  {errors.display_name && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.display_name.message}
                    </p>
                  )}
                </div>

                {/* Email (read-only) */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#9daabf]">Email Address</Label>
                  <div className="flex items-center gap-2 rounded-lg border border-[#2d3347] bg-[#0a0c10] px-3 py-2">
                    <Mail className="h-3.5 w-3.5 text-[#4a5370] shrink-0" />
                    <span className="text-sm text-[#6b7594]">{profile?.email ?? user?.email ?? "—"}</span>
                    <Badge variant="secondary" size="sm" className="ml-auto">Read-only</Badge>
                  </div>
                  <p className="text-[11px] text-[#3e465e]">
                    Email is managed by your authentication provider.
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    disabled={!isDirty || isSaving}
                    leftIcon={<Save className="h-3.5 w-3.5" />}
                    size="sm"
                  >
                    {isSaving ? "Saving…" : "Save Profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 2 — Organization */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.08 }}
        >
          <Card>
            <CardContent className="p-6">
              <SectionHeader
                icon={Building2}
                title="Organization"
                description="Your current organization membership"
              />

              {membership ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#2d3347] bg-[#0f1117] divide-y divide-[#1e2330]">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-[#4a5370]" />
                        <span className="text-xs text-[#4a5370] font-semibold uppercase tracking-wider">Organization</span>
                      </div>
                      <span className="text-sm font-medium text-[#d3dce8]">{membership.org_name ?? "—"}</span>
                    </div>
                    {membership.org_type && (
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-[#4a5370]" />
                          <span className="text-xs text-[#4a5370] font-semibold uppercase tracking-wider">Type</span>
                        </div>
                        <span className="text-sm text-[#9daabf]">
                          {ORG_TYPE_LABELS[membership.org_type] ?? membership.org_type}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-[#4a5370]" />
                        <span className="text-xs text-[#4a5370] font-semibold uppercase tracking-wider">Role</span>
                      </div>
                      <Badge variant="secondary" size="sm">
                        {ROLE_LABELS[membership.role] ?? membership.role}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-[#4a5370]" />
                        <span className="text-xs text-[#4a5370] font-semibold uppercase tracking-wider">Joined</span>
                      </div>
                      <span className="text-sm text-[#6b7594]">
                        {formatRelativeTime(membership.joined_at)}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#3e465e]">
                    Organization settings are managed by your admin at{" "}
                    <a href="/app/admin/settings" className="text-blue-500 hover:underline">
                      Admin → Settings
                    </a>
                    .
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-[#2d3347] bg-[#0f1117] px-4 py-8 text-center">
                  <Building2 className="h-8 w-8 text-[#4a5370] mx-auto mb-2" />
                  <p className="text-sm text-[#6b7594]">Not a member of any organization</p>
                  <p className="text-xs text-[#3e465e] mt-1">Contact an admin to be invited to an organization.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 3 — Account */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.16 }}
        >
          <Card>
            <CardContent className="p-6">
              <SectionHeader
                icon={Lock}
                title="Account"
                description="Authentication and account security"
              />

              <div className="space-y-4">
                <div className="rounded-xl border border-[#2d3347] bg-[#0f1117] divide-y divide-[#1e2330]">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-[#4a5370]" />
                      <span className="text-xs text-[#4a5370] font-semibold uppercase tracking-wider">Email</span>
                    </div>
                    <span className="text-sm text-[#9daabf]">{user?.email ?? profile?.email ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-[#4a5370]" />
                      <span className="text-xs text-[#4a5370] font-semibold uppercase tracking-wider">Account Created</span>
                    </div>
                    <span className="text-sm text-[#6b7594]">
                      {profile?.created_at
                        ? formatRelativeTime(profile.created_at)
                        : user?.created_at
                        ? formatRelativeTime(user.created_at)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-[#4a5370]" />
                      <span className="text-xs text-[#4a5370] font-semibold uppercase tracking-wider">Auth Provider</span>
                    </div>
                    <Badge variant="secondary" size="sm">
                      {user?.app_metadata?.provider ?? "email"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#2d3347] bg-[#0f1117] px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-[#d3dce8]">Change Password</p>
                    <p className="text-xs text-[#4a5370] mt-0.5">
                      We&apos;ll send a password reset link to your email.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Key className="h-3.5 w-3.5" />}
                    onClick={handleChangePassword}
                    disabled={isSendingReset}
                  >
                    {isSendingReset ? "Sending…" : "Reset Password"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
