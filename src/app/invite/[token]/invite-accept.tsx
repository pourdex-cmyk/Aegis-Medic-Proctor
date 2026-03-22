"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Shield, CheckCircle2, XCircle, Clock, Building2,
  Mail, Lock, User, ArrowRight, AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { ROUTES } from "@/lib/constants"
import { toast } from "sonner"

interface Invite {
  id: string
  email: string
  role: string
  expires_at: string
  accepted_at?: string | null
  organizations?: { id: string; name: string; type: string } | null
}

interface InviteAcceptProps {
  invite: Invite | null
  isExpired: boolean
  isAccepted: boolean
  token: string
}

const ROLE_LABELS: Record<string, string> = {
  org_admin: "Organization Admin",
  lead_proctor: "Lead Proctor",
  proctor: "Proctor",
  doctrine_sme: "Doctrine SME",
  analyst: "Training Analyst",
  observer: "Observer",
}

const ORG_TYPE_LABELS: Record<string, string> = {
  military: "Military",
  law_enforcement: "Law Enforcement",
  ems: "EMS / Fire",
  hospital: "Hospital",
  academic: "Academic",
  private: "Private",
}

export function InviteAccept({ invite, isExpired, isAccepted, token }: InviteAcceptProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<"choose" | "signup" | "signin">("choose")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const email = invite?.email ?? ""

  const handleSignUp = () => {
    if (!displayName.trim() || !password) {
      setError("Please fill in all fields")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    setError("")
    startTransition(async () => {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() },
        },
      })
      if (authError) {
        setError(authError.message)
        return
      }
      await acceptInvite()
    })
  }

  const handleSignIn = () => {
    if (!password) {
      setError("Enter your password")
      return
    }
    setError("")
    startTransition(async () => {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(authError.message)
        return
      }
      await acceptInvite()
    })
  }

  const acceptInvite = async () => {
    // Call server route to mark invite as accepted and create membership
    const res = await fetch("/api/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
    if (!res.ok) {
      const { error } = await res.json()
      toast.error("Failed to accept invite", { description: error })
      return
    }
    toast.success("Invite accepted! Welcome to the team.")
    router.push(ROUTES.dashboard)
  }

  // Error states
  if (!invite) {
    return (
      <InviteStatus
        icon={<XCircle className="h-8 w-8 text-red-400" />}
        title="Invalid Invitation"
        message="This invite link is not valid or has already been used."
        action={{ label: "Go to Sign In", href: ROUTES.signIn }}
        color="border-red-800/40 bg-red-950/10"
      />
    )
  }

  if (isExpired) {
    return (
      <InviteStatus
        icon={<Clock className="h-8 w-8 text-amber-400" />}
        title="Invite Expired"
        message="This invitation has expired. Ask your organization admin to send a new invite."
        action={{ label: "Go to Sign In", href: ROUTES.signIn }}
        color="border-amber-800/40 bg-amber-950/10"
      />
    )
  }

  if (isAccepted) {
    return (
      <InviteStatus
        icon={<CheckCircle2 className="h-8 w-8 text-green-400" />}
        title="Already Accepted"
        message="This invitation has already been accepted. Sign in to access your account."
        action={{ label: "Sign In", href: ROUTES.signIn }}
        color="border-green-800/40 bg-green-950/10"
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#070809] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-[#1a2444] border border-blue-800/40 flex items-center justify-center mx-auto mb-3">
            <Shield className="h-6 w-6 text-blue-400" />
          </div>
          <p className="text-[11px] text-[#4a5370] uppercase tracking-widest font-semibold">Aegis Medic Proctor</p>
        </div>

        {/* Invite card */}
        <div className="rounded-xl border border-[#2d3347] bg-[#0d0f14] p-6 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-[#1a2444] border border-blue-800/30 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#f0f4ff]">{invite.organizations?.name ?? "Organization"}</p>
              <p className="text-[11px] text-[#4a5370]">
                {ORG_TYPE_LABELS[invite.organizations?.type ?? ""] ?? invite.organizations?.type}
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#4a5370]">Invited email</span>
              <span className="text-xs text-[#d3dce8] font-mono">{email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#4a5370]">Role</span>
              <Badge variant="secondary" size="sm">{ROLE_LABELS[invite.role] ?? invite.role}</Badge>
            </div>
          </div>

          <p className="text-xs text-[#6b7594] text-center">
            You've been invited to join this organization on Aegis Medic Proctor.
          </p>
        </div>

        {/* Auth section */}
        {mode === "choose" && (
          <div className="space-y-3">
            <Button className="w-full" size="lg" onClick={() => setMode("signup")}>
              Create Account & Accept
            </Button>
            <Button className="w-full" size="lg" variant="secondary" onClick={() => setMode("signin")}>
              Sign In with Existing Account
            </Button>
          </div>
        )}

        {mode === "signup" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-lg border border-[#2d3347] bg-[#0d0f14] p-4 space-y-3">
              <div>
                <Label htmlFor="display-name" required>Full Name</Label>
                <Input
                  id="display-name"
                  placeholder="SSG John Torres"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  leftElement={<User className="h-3.5 w-3.5" />}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={email} disabled className="mt-1.5 text-[#6b7594]" leftElement={<Mail className="h-3.5 w-3.5" />} />
              </div>
              <div>
                <Label htmlFor="password" required>Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftElement={<Lock className="h-3.5 w-3.5" />}
                  className="mt-1.5"
                  onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSignUp}
              loading={isPending}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Create Account & Join
            </Button>
            <button
              onClick={() => { setMode("choose"); setError(""); setPassword("") }}
              className="w-full text-xs text-[#4a5370] hover:text-[#9daabf] text-center"
            >
              Back
            </button>
          </motion.div>
        )}

        {mode === "signin" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-lg border border-[#2d3347] bg-[#0d0f14] p-4 space-y-3">
              <div>
                <Label>Email</Label>
                <Input value={email} disabled className="mt-1.5 text-[#6b7594]" leftElement={<Mail className="h-3.5 w-3.5" />} />
              </div>
              <div>
                <Label htmlFor="signin-password" required>Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftElement={<Lock className="h-3.5 w-3.5" />}
                  className="mt-1.5"
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSignIn}
              loading={isPending}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Sign In & Accept Invite
            </Button>
            <button
              onClick={() => { setMode("choose"); setError(""); setPassword("") }}
              className="w-full text-xs text-[#4a5370] hover:text-[#9daabf] text-center"
            >
              Back
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

function InviteStatus({
  icon, title, message, action, color
}: {
  icon: React.ReactNode
  title: string
  message: string
  action: { label: string; href: string }
  color: string
}) {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-[#070809] flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className={cn("rounded-xl border p-8 mb-5", color)}>
          <div className="flex justify-center mb-4">{icon}</div>
          <h2 className="text-lg font-bold text-[#f0f4ff] mb-2">{title}</h2>
          <p className="text-sm text-[#6b7594]">{message}</p>
        </div>
        <Button className="w-full" onClick={() => router.push(action.href)}>
          {action.label}
        </Button>
      </div>
    </div>
  )
}
