"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2, Users, BookOpen, ChevronRight, ChevronLeft,
  Check, Shield, Stethoscope, Flame, AlertCircle, Globe,
  Loader2, Plus, UserPlus, Upload, Sparkles, ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn, generateId } from "@/lib/utils"
import { ROUTES, ORG_TYPES } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface OnboardingWizardProps {
  userId: string
  userEmail: string
  displayName: string
}

type Step = "welcome" | "org" | "role" | "doctrine" | "invite" | "done"

const STEPS: Step[] = ["welcome", "org", "role", "doctrine", "invite", "done"]

const ORG_TYPE_OPTIONS = [
  { value: "military", label: "Military Unit", icon: Shield, description: "TCCC/CLS training for combat units" },
  { value: "law_enforcement", label: "Law Enforcement", icon: Shield, description: "TEMS and tactical medical training" },
  { value: "ems", label: "EMS / Fire", icon: Flame, description: "Prehospital trauma and mass casualty" },
  { value: "hospital", label: "Hospital / Medical", icon: Stethoscope, description: "Trauma team and ER simulation" },
  { value: "academic", label: "Academic / Research", icon: Globe, description: "Medical education and simulation research" },
  { value: "private", label: "Private / Corporate", icon: Building2, description: "Contractor and private security training" },
]

const ROLE_OPTIONS = [
  { value: "org_admin", label: "Organization Admin", description: "Manage team, doctrine, and all settings" },
  { value: "lead_proctor", label: "Lead Proctor", description: "Run scenarios and grade performance" },
  { value: "doctrine_sme", label: "Doctrine SME", description: "Review and approve extracted doctrine rules" },
  { value: "analyst", label: "Training Analyst", description: "View analytics and generate reports" },
]

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const stepIndex = STEPS.indexOf(currentStep)
  const visibleSteps = STEPS.filter((s) => s !== "welcome" && s !== "done")

  return (
    <div className="flex items-center gap-2">
      {visibleSteps.map((step, i) => {
        const stepActualIndex = STEPS.indexOf(step)
        const isDone = stepIndex > stepActualIndex
        const isCurrent = stepIndex === stepActualIndex
        return (
          <React.Fragment key={step}>
            <div className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
              isDone ? "bg-green-600 text-white" :
              isCurrent ? "bg-blue-600 text-white ring-2 ring-blue-400/30" :
              "bg-[#1e2330] text-[#4a5370] border border-[#2d3347]"
            )}>
              {isDone ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            {i < visibleSteps.length - 1 && (
              <div className={cn(
                "h-px w-8 transition-all",
                isDone ? "bg-green-600" : "bg-[#1e2330]"
              )} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export function OnboardingWizard({ userId, userEmail, displayName }: OnboardingWizardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>("welcome")

  // Form state
  const [orgName, setOrgName] = useState("")
  const [orgType, setOrgType] = useState("")
  const [orgSlug, setOrgSlug] = useState("")
  const [myRole, setMyRole] = useState("org_admin")
  const [inviteEmails, setInviteEmails] = useState<string[]>([""])
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null)

  const slugify = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)

  const handleOrgNameChange = (name: string) => {
    setOrgName(name)
    setOrgSlug(slugify(name))
  }

  const handleCreateOrg = () => {
    if (!orgName.trim() || !orgType) {
      toast.error("Please fill in all required fields")
      return
    }
    startTransition(async () => {
      try {
        // Create org
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .insert({
            name: orgName.trim(),
            slug: orgSlug || slugify(orgName),
            type: orgType,     // schema NOT NULL column
            org_type: orgType, // migration 003 alias
            plan_tier: "free",
            max_members: 5,
          })
          .select("id")
          .single()

        if (orgError) throw orgError

        // Create membership (display_name is NOT NULL in schema)
        const { error: memberError } = await supabase
          .from("organization_members")
          .insert({
            org_id: org.id,
            user_id: userId,
            role: myRole,
            display_name: displayName,
            is_active: true,
            joined_at: new Date().toISOString(),
          })

        if (memberError) throw memberError

        setCreatedOrgId(org.id)
        setStep("doctrine")
      } catch (err) {
        toast.error("Failed to create organization", {
          description: err instanceof Error ? err.message : "Unknown error",
        })
      }
    })
  }

  const handleFinish = () => {
    startTransition(async () => {
      // Send any invite emails (non-empty ones)
      const emails = inviteEmails.filter((e) => e.trim())
      if (emails.length > 0 && createdOrgId) {
        for (const email of emails) {
          await supabase.from("organization_invites").insert({
            org_id: createdOrgId,
            email: email.trim(),
            role: "proctor",
            token: generateId(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            invited_by: userId,
          })
        }
        toast.success(`${emails.length} invite${emails.length > 1 ? "s" : ""} sent`)
      }
      router.push(ROUTES.dashboard)
    })
  }

  const slideVariants = {
    enter: { opacity: 0, x: 24 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  }

  return (
    <div className="min-h-screen bg-[#070809] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-[#1a2444] border border-blue-800/40 flex items-center justify-center mx-auto mb-3">
            <Shield className="h-6 w-6 text-blue-400" />
          </div>
          <p className="text-[11px] text-[#4a5370] uppercase tracking-widest font-semibold">Aegis Medic Proctor</p>
        </div>

        {/* Step indicator */}
        {step !== "welcome" && step !== "done" && (
          <div className="flex justify-center mb-6">
            <StepIndicator currentStep={step} />
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Welcome */}
          {step === "welcome" && (
            <motion.div
              key="welcome"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <h1 className="text-2xl font-bold text-[#f0f4ff] mb-2">
                Welcome, {displayName || userEmail.split("@")[0]}
              </h1>
              <p className="text-sm text-[#6b7594] mb-8 max-w-sm mx-auto">
                You're setting up Aegis Medic Proctor for your organization. This takes about 2 minutes.
              </p>
              <div className="grid grid-cols-1 gap-2 mb-8 text-left max-w-sm mx-auto">
                {[
                  { icon: Building2, text: "Create your organization" },
                  { icon: BookOpen, text: "Add your first doctrine pack (optional)" },
                  { icon: UserPlus, text: "Invite your team" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm text-[#9daabf]">
                    <div className="h-7 w-7 rounded-lg bg-[#1e2330] border border-[#2d3347] flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                    {text}
                  </div>
                ))}
              </div>
              <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={() => setStep("org")} className="w-full max-w-sm">
                Get Started
              </Button>
            </motion.div>
          )}

          {/* Org setup */}
          {step === "org" && (
            <motion.div
              key="org"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-[#f0f4ff] mb-1">Create your organization</h2>
                <p className="text-sm text-[#6b7594]">This is the workspace your team will share.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="org-name" required>Organization Name</Label>
                  <Input
                    id="org-name"
                    placeholder="1st Battalion Medical Platoon"
                    value={orgName}
                    onChange={(e) => handleOrgNameChange(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                {orgSlug && (
                  <p className="text-[11px] text-[#4a5370]">
                    Slug: <span className="font-mono text-blue-400">{orgSlug}</span>
                  </p>
                )}
                <div>
                  <Label required>Organization Type</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {ORG_TYPE_OPTIONS.map((opt) => {
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setOrgType(opt.value)}
                          className={cn(
                            "rounded-lg border p-3 text-left transition-all",
                            orgType === opt.value
                              ? "border-blue-500 bg-blue-950/20 ring-1 ring-blue-500/30"
                              : "border-[#2d3347] hover:border-[#4a5370] bg-[#0d0f14]"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 mb-1.5", orgType === opt.value ? "text-blue-400" : "text-[#4a5370]")} />
                          <p className="text-xs font-semibold text-[#d3dce8]">{opt.label}</p>
                          <p className="text-[10px] text-[#4a5370] mt-0.5">{opt.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div>
                <Label required>Your Role</Label>
                <div className="space-y-2 mt-1.5">
                  {ROLE_OPTIONS.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => setMyRole(role.value)}
                      className={cn(
                        "w-full rounded-lg border p-3 text-left transition-all",
                        myRole === role.value
                          ? "border-blue-500 bg-blue-950/20"
                          : "border-[#2d3347] hover:border-[#4a5370] bg-[#0d0f14]"
                      )}
                    >
                      <p className="text-sm font-medium text-[#d3dce8]">{role.label}</p>
                      <p className="text-xs text-[#4a5370]">{role.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" size="sm" onClick={() => setStep("welcome")} leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}>
                  Back
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleCreateOrg}
                  loading={isPending}
                  disabled={!orgName.trim() || !orgType}
                  rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                >
                  Create Organization
                </Button>
              </div>
            </motion.div>
          )}

          {/* Doctrine (optional) */}
          {step === "doctrine" && (
            <motion.div
              key="doctrine"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-[#f0f4ff] mb-1">Add doctrine (optional)</h2>
                <p className="text-sm text-[#6b7594]">
                  Doctrine packs ground AI generation in approved guidance. You can upload documents now or add them later.
                </p>
              </div>

              <div className="rounded-xl border-2 border-dashed border-[#2d3347] p-8 text-center hover:border-[#4a5370] transition-colors">
                <Upload className="h-8 w-8 text-[#4a5370] mx-auto mb-3" />
                <p className="text-sm font-medium text-[#9daabf] mb-1">Drop doctrine documents here</p>
                <p className="text-xs text-[#4a5370] mb-4">PDF, DOCX, TXT, MD — AI extracts rules for SME review</p>
                <Button variant="secondary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
                  Browse Files
                </Button>
              </div>

              <div className="rounded-lg border border-blue-800/30 bg-blue-950/10 px-4 py-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-300">
                    <strong>Tip:</strong> You can always add doctrine packs later from the Doctrine section. Scenarios can be generated without doctrine — the AI uses validated archetypes instead.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setStep("invite")}
                >
                  Skip for now
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setStep("invite")}
                  rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* Invite */}
          {step === "invite" && (
            <motion.div
              key="invite"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-[#f0f4ff] mb-1">Invite your team</h2>
                <p className="text-sm text-[#6b7594]">Add team members who will use the platform. You can always invite more later.</p>
              </div>

              <div className="space-y-2">
                {inviteEmails.map((email, i) => (
                  <Input
                    key={i}
                    type="email"
                    placeholder={`teammate${i + 1}@unit.mil`}
                    value={email}
                    onChange={(e) => {
                      const next = [...inviteEmails]
                      next[i] = e.target.value
                      setInviteEmails(next)
                    }}
                  />
                ))}
                {inviteEmails.length < 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => setInviteEmails([...inviteEmails, ""])}
                  >
                    Add another
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setStep("done")}
                >
                  Skip
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleFinish}
                  loading={isPending}
                  rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                >
                  {inviteEmails.filter((e) => e.trim()).length > 0 ? "Send Invites & Finish" : "Finish Setup"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Done */}
          {step === "done" && (
            <motion.div
              key="done"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <div className="h-16 w-16 rounded-full bg-green-950/40 border border-green-700/40 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-[#f0f4ff] mb-2">You're all set!</h2>
              <p className="text-sm text-[#6b7594] mb-8 max-w-sm mx-auto">
                Your organization is ready. Start by generating your first training scenario.
              </p>
              <Button
                size="lg"
                className="w-full max-w-sm"
                onClick={() => router.push(ROUTES.dashboard)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Go to Dashboard
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
