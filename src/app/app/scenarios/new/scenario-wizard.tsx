"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft, ChevronRight, Target, Wand2, Check, Users, MapPin,
  Clock, Layers, AlertTriangle, BookOpen, Wind, Droplets, Activity,
  MessageSquare, Shield, Zap, Brain, Loader2, Plus, Minus,
  Info, ArrowRight, CheckCircle2, Edit2
} from "lucide-react"
import { useForm, type UseFormSetValue } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { cn, formatDuration } from "@/lib/utils"
import {
  TRAINING_ENVIRONMENTS, SCENARIO_TYPES, COMPLEXITY_LEVELS,
} from "@/lib/constants"
import { toast } from "sonner"

// ---- STEP DEFINITIONS ----
const STEPS = [
  { id: "audience", label: "Audience & Type", icon: Target },
  { id: "environment", label: "Environment", icon: MapPin },
  { id: "parameters", label: "Parameters", icon: Layers },
  { id: "emphasis", label: "Clinical Emphasis", icon: Activity },
  { id: "doctrine", label: "Doctrine Pack", icon: BookOpen },
  { id: "review", label: "Review & Generate", icon: Wand2 },
]

const wizardSchema = z.object({
  audience: z.enum(["military", "law_enforcement", "ems"]),
  scenario_type: z.string().min(1),
  environment: z.string().min(1),
  complexity: z.enum(["basic", "intermediate", "advanced", "expert"]),
  casualty_count: z.number().min(1).max(20),
  evac_delay_minutes: z.number().min(0).max(480),
  doctrine_pack_id: z.string().optional(),
  hidden_complications: z.boolean(),
  airway_emphasis: z.number().min(0).max(10),
  hemorrhage_emphasis: z.number().min(0).max(10),
  triage_emphasis: z.number().min(0).max(10),
  multisystem_emphasis: z.number().min(0).max(10),
  leadership_emphasis: z.number().min(0).max(10),
  audio_intensity: z.enum(["minimal", "moderate", "high"]),
  grading_strictness: z.enum(["lenient", "standard", "strict"]),
  equipment_limitations: z.array(z.string()),
  weather_stressors: z.array(z.string()),
  custom_notes: z.string().optional(),
})

type WizardForm = z.infer<typeof wizardSchema>

interface ScenarioWizardProps {
  doctrinePacks: Array<{ id: string; name: string; audience: string; version: string }>
  userId: string
}

const audienceOptions = [
  {
    value: "military",
    label: "Military / DOD",
    description: "Combat medic, corpsman, special operations medical",
    color: "border-blue-700/60 bg-blue-950/20",
    activeColor: "border-blue-500 bg-blue-950/40",
    icon: "⚔️",
  },
  {
    value: "law_enforcement",
    label: "Law Enforcement",
    description: "TEMS, SWAT medic, tactical emergency medical support",
    color: "border-[#353c52] bg-[#0f1117]",
    activeColor: "border-amber-600/60 bg-amber-950/20",
    icon: "🛡️",
  },
  {
    value: "ems",
    label: "Emergency Medical Services",
    description: "Paramedic, ALS/BLS field training, field supervisor",
    color: "border-[#353c52] bg-[#0f1117]",
    activeColor: "border-green-700/60 bg-green-950/20",
    icon: "🚑",
  },
]

export function ScenarioWizard({ doctrinePacks, userId }: ScenarioWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationComplete, setGenerationComplete] = useState(false)
  const [generatedScenarioId, setGeneratedScenarioId] = useState<string | null>(null)
  const [generationProgress, setGenerationProgress] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  const form = useForm<WizardForm>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      audience: "military",
      scenario_type: "tccc",
      environment: "Urban / City",
      complexity: "intermediate",
      casualty_count: 2,
      evac_delay_minutes: 30,
      hidden_complications: true,
      airway_emphasis: 5,
      hemorrhage_emphasis: 7,
      triage_emphasis: 5,
      multisystem_emphasis: 5,
      leadership_emphasis: 4,
      audio_intensity: "moderate",
      grading_strictness: "standard",
      equipment_limitations: [],
      weather_stressors: [],
      custom_notes: "",
    },
  })

  const { watch, setValue, getValues } = form
  const values = watch()

  const canAdvance = () => {
    const v = getValues()
    switch (currentStep) {
      case 0: return !!v.audience && !!v.scenario_type
      case 1: return !!v.environment
      case 2: return v.casualty_count >= 1
      case 3: return true
      case 4: return true
      default: return true
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerationProgress(["Initializing AI generation engine..."])

    try {
      const data = getValues()

      // Simulate progress updates
      const progressSteps = [
        "Analyzing scenario parameters...",
        "Retrieving relevant doctrine sections...",
        "Generating scenario narrative...",
        "Building casualty profiles...",
        "Constructing event injects...",
        "Applying scoring rubric...",
        "Finalizing scenario package...",
      ]

      for (const step of progressSteps) {
        await new Promise((r) => setTimeout(r, 600))
        setGenerationProgress((prev) => [...prev, step])
      }

      // Call AI generation API
      const response = await fetch("/api/ai/generate-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error ?? "Generation failed")
      }

      const result = await response.json()
      setGeneratedScenarioId(result.scenarioId)
      setGenerationComplete(true)
      setGenerationProgress((prev) => [...prev, "✓ Scenario generated successfully"])
      toast.success("Scenario generated successfully")
    } catch (err) {
      toast.error("Generation failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
      setGenerationProgress((prev) => [...prev, "✗ Generation failed — please try again"])
    } finally {
      setIsGenerating(false)
    }
  }

  if (generationComplete && generatedScenarioId) {
    return (
      <div className="flex flex-col min-h-full">
        <Header title="Scenario Generated" />
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg w-full text-center"
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-900/40">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#f0f4ff] mb-3 tracking-tight">
              Scenario Ready
            </h2>
            <p className="text-sm text-[#6b7594] mb-8">
              Your scenario has been generated, casualties built, and rubric applied.
              Review and edit before launching.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                leftIcon={<Edit2 className="h-4 w-4" />}
                variant="secondary"
                onClick={() => router.push(`/app/scenarios/${generatedScenarioId}`)}
              >
                Review Scenario
              </Button>
              <Button
                leftIcon={<Zap className="h-4 w-4 text-green-400" />}
                onClick={() => router.push(`/app/scenarios/${generatedScenarioId}/run`)}
              >
                Launch Run
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="New Scenario"
        subtitle="AI Generation Wizard"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6b7594]">Step {currentStep + 1} of {STEPS.length}</span>
          </div>
        }
      />

      <div className="flex-1 flex">
        {/* Step sidebar */}
        <div className="hidden lg:flex flex-col w-56 border-r border-[#1e2330] bg-[#0a0c10] p-4 gap-1">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const done = i < currentStep
            const active = i === currentStep
            return (
              <button
                key={step.id}
                onClick={() => i <= currentStep && setCurrentStep(i)}
                disabled={i > currentStep}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all w-full",
                  active && "bg-[#1a2444] border border-blue-800/40",
                  done && "text-[#6b7594] cursor-pointer hover:bg-[#0f1117]",
                  !done && !active && "text-[#3e465e] cursor-not-allowed opacity-60",
                )}
              >
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-bold",
                  active && "border-blue-500 bg-blue-600 text-white",
                  done && "border-green-700 bg-green-900/40 text-green-400",
                  !done && !active && "border-[#2d3347] bg-[#0f1117] text-[#3e465e]",
                )}>
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span className={cn("text-xs font-medium", active && "text-[#f0f4ff]", done && "text-[#6b7594]")}>
                  {step.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <StepAudience key="audience" values={values} setValue={setValue} />
              )}
              {currentStep === 1 && (
                <StepEnvironment key="environment" values={values} setValue={setValue} />
              )}
              {currentStep === 2 && (
                <StepParameters key="parameters" values={values} setValue={setValue} />
              )}
              {currentStep === 3 && (
                <StepEmphasis key="emphasis" values={values} setValue={setValue} />
              )}
              {currentStep === 4 && (
                <StepDoctrine key="doctrine" values={values} setValue={setValue} doctrinePacks={doctrinePacks} />
              )}
              {currentStep === 5 && (
                <StepReview
                  key="review"
                  values={values}
                  doctrinePacks={doctrinePacks}
                  isGenerating={isGenerating}
                  generationProgress={generationProgress}
                  onGenerate={handleGenerate}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          {!isGenerating && (
            <div className="sticky bottom-0 border-t border-[#1e2330] bg-[#0a0c10]/90 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ChevronLeft className="h-4 w-4" />}
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Back
              </Button>

              {/* Mobile step indicator */}
              <div className="flex items-center gap-1.5 lg:hidden">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === currentStep ? "w-6 bg-blue-500" : i < currentStep ? "w-1.5 bg-[#353c52]" : "w-1.5 bg-[#1e2330]"
                    )}
                  />
                ))}
              </div>

              {currentStep < STEPS.length - 1 ? (
                <Button
                  size="sm"
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                  onClick={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
                  disabled={!canAdvance()}
                >
                  Continue
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- STEP COMPONENTS ----

function StepSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  )
}

function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-[#f0f4ff] tracking-tight mb-1">{title}</h2>
      <p className="text-sm text-[#6b7594]">{description}</p>
    </div>
  )
}

function StepAudience({ values, setValue }: { values: WizardForm; setValue: UseFormSetValue<WizardForm> }) {
  return (
    <StepSection>
      <StepHeader
        title="Audience & Scenario Type"
        description="Select who this training scenario is designed for and what type of exercise you're building."
      />

      <div>
        <Label className="mb-3 block">Training Audience</Label>
        <div className="grid grid-cols-1 gap-3">
          {audienceOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue("audience", opt.value as "military" | "law_enforcement" | "ems")}
              className={cn(
                "flex items-center gap-4 rounded-xl border p-4 text-left transition-all w-full",
                values.audience === opt.value ? opt.activeColor : opt.color,
                "hover:border-[#4a5370]"
              )}
            >
              <span className="text-2xl">{opt.icon}</span>
              <div>
                <p className="font-semibold text-sm text-[#f0f4ff]">{opt.label}</p>
                <p className="text-xs text-[#6b7594] mt-0.5">{opt.description}</p>
              </div>
              {values.audience === opt.value && (
                <div className="ml-auto shrink-0">
                  <Check className="h-4 w-4 text-blue-400" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Scenario Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {SCENARIO_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setValue("scenario_type", type.value)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-all",
                values.scenario_type === type.value
                  ? "border-blue-600/60 bg-blue-950/30 text-blue-300"
                  : "border-[#2d3347] bg-[#0f1117] text-[#9daabf] hover:border-[#353c52] hover:text-[#f0f4ff]"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
    </StepSection>
  )
}

function StepEnvironment({ values, setValue }: { values: WizardForm; setValue: UseFormSetValue<WizardForm> }) {
  return (
    <StepSection>
      <StepHeader
        title="Training Environment"
        description="Where does this scenario take place? Environment affects casualty presentation, stressors, and audio cues."
      />

      <div>
        <Label className="mb-3 block">Environment</Label>
        <div className="grid grid-cols-2 gap-2">
          {TRAINING_ENVIRONMENTS.map((env) => (
            <button
              key={env}
              type="button"
              onClick={() => setValue("environment", env)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-all",
                values.environment === env
                  ? "border-blue-600/60 bg-blue-950/30 text-blue-300"
                  : "border-[#2d3347] bg-[#0f1117] text-[#9daabf] hover:border-[#353c52] hover:text-[#f0f4ff]"
              )}
            >
              {env}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Weather / Environmental Stressors</Label>
        <div className="grid grid-cols-2 gap-2">
          {["Extreme heat", "Cold / hypothermia risk", "Limited visibility", "High altitude", "Rain / wet conditions", "Night operations"].map((s) => {
            const active = values.weather_stressors.includes(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  const curr = values.weather_stressors
                  setValue("weather_stressors", active ? curr.filter((x) => x !== s) : [...curr, s])
                }}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs font-medium transition-all flex items-center gap-2",
                  active
                    ? "border-amber-600/60 bg-amber-950/20 text-amber-300"
                    : "border-[#2d3347] bg-[#0f1117] text-[#9daabf] hover:border-[#353c52]"
                )}
              >
                {active && <Check className="h-3 w-3" />}
                {s}
              </button>
            )
          })}
        </div>
      </div>
    </StepSection>
  )
}

function StepParameters({ values, setValue }: { values: WizardForm; setValue: UseFormSetValue<WizardForm> }) {
  return (
    <StepSection>
      <StepHeader
        title="Scenario Parameters"
        description="Configure complexity, casualty count, and timing constraints."
      />

      <div>
        <Label className="mb-3 block">Complexity Level</Label>
        <div className="grid grid-cols-2 gap-3">
          {COMPLEXITY_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setValue("complexity", level.value)}
              className={cn(
                "rounded-xl border p-4 text-left transition-all",
                values.complexity === level.value
                  ? "border-blue-600/60 bg-blue-950/30"
                  : "border-[#2d3347] bg-[#0f1117] hover:border-[#353c52]"
              )}
            >
              <p className={cn("text-sm font-semibold mb-1", values.complexity === level.value ? "text-blue-300" : "text-[#d3dce8]")}>
                {level.label}
              </p>
              <p className="text-xs text-[#6b7594] leading-relaxed">{level.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label className="mb-3 block">Casualty Count</Label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setValue("casualty_count", Math.max(1, values.casualty_count - 1))}
              className="h-8 w-8 rounded-lg border border-[#2d3347] bg-[#0f1117] flex items-center justify-center hover:bg-[#1e2330] transition-colors"
            >
              <Minus className="h-3 w-3 text-[#9daabf]" />
            </button>
            <span className="text-2xl font-bold text-[#f0f4ff] w-8 text-center">{values.casualty_count}</span>
            <button
              type="button"
              onClick={() => setValue("casualty_count", Math.min(20, values.casualty_count + 1))}
              className="h-8 w-8 rounded-lg border border-[#2d3347] bg-[#0f1117] flex items-center justify-center hover:bg-[#1e2330] transition-colors"
            >
              <Plus className="h-3 w-3 text-[#9daabf]" />
            </button>
          </div>
          <p className="text-[11px] text-[#4a5370] mt-2">
            {values.casualty_count === 1 ? "Single casualty scenario" :
             values.casualty_count <= 3 ? "Small team exercise" :
             values.casualty_count <= 8 ? "MASCAL scenario" :
             "Mass casualty — high complexity"}
          </p>
        </div>

        <div>
          <Label className="mb-3 block">Evacuation Delay</Label>
          <div className="space-y-3">
            <Slider
              value={[values.evac_delay_minutes]}
              onValueChange={([v]) => setValue("evac_delay_minutes", v)}
              min={0}
              max={120}
              step={5}
            />
            <div className="flex justify-between text-xs text-[#4a5370]">
              <span>0 min</span>
              <span className="text-[#f0f4ff] font-medium">{values.evac_delay_minutes} min</span>
              <span>120 min</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[#2d3347] bg-[#0f1117] px-4 py-3.5">
        <div>
          <p className="text-sm font-medium text-[#d3dce8]">Hidden Complications</p>
          <p className="text-xs text-[#6b7594] mt-0.5">Include undisclosed injuries that reveal through assessment</p>
        </div>
        <Switch
          checked={values.hidden_complications}
          onCheckedChange={(v) => setValue("hidden_complications", v)}
        />
      </div>

      <div>
        <Label className="mb-3 block">Equipment Limitations</Label>
        <div className="grid grid-cols-2 gap-2">
          {["No tourniquet available", "No airway adjuncts", "Limited IV access", "No blood products", "No hemostatic gauze", "Field expedient only"].map((lim) => {
            const active = values.equipment_limitations.includes(lim)
            return (
              <button
                key={lim}
                type="button"
                onClick={() => {
                  const curr = values.equipment_limitations
                  setValue("equipment_limitations", active ? curr.filter((x) => x !== lim) : [...curr, lim])
                }}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs font-medium transition-all flex items-center gap-2",
                  active ? "border-red-700/50 bg-red-950/20 text-red-300" : "border-[#2d3347] bg-[#0f1117] text-[#9daabf] hover:border-[#353c52]"
                )}
              >
                {active && <Check className="h-3 w-3" />}
                {lim}
              </button>
            )
          })}
        </div>
      </div>
    </StepSection>
  )
}

function StepEmphasis({ values, setValue }: { values: WizardForm; setValue: UseFormSetValue<WizardForm> }) {
  const emphasisFields = [
    { key: "hemorrhage_emphasis" as const, label: "Hemorrhage Control", icon: Droplets, color: "text-red-400" },
    { key: "airway_emphasis" as const, label: "Airway Management", icon: Wind, color: "text-blue-400" },
    { key: "triage_emphasis" as const, label: "Triage Decisions", icon: Activity, color: "text-amber-400" },
    { key: "multisystem_emphasis" as const, label: "Multi-System Trauma", icon: AlertTriangle, color: "text-orange-400" },
    { key: "leadership_emphasis" as const, label: "Leadership & CUF", icon: Shield, color: "text-cyan-400" },
  ]

  return (
    <StepSection>
      <StepHeader
        title="Clinical Emphasis"
        description="Adjust the weight given to each clinical domain in scenario generation and grading."
      />

      <div className="space-y-5">
        {emphasisFields.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} />
                <Label className="text-sm">{label}</Label>
              </div>
              <Badge variant="secondary" size="sm">{values[key]}/10</Badge>
            </div>
            <Slider
              value={[values[key]]}
              onValueChange={([v]) => setValue(key, v)}
              min={0}
              max={10}
              step={1}
              variant={key === "hemorrhage_emphasis" ? "critical" : key === "airway_emphasis" ? "default" : "alert"}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 pt-2">
        <div>
          <Label className="mb-2 block text-xs">Audio Intensity</Label>
          <div className="space-y-2">
            {(["minimal", "moderate", "high"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setValue("audio_intensity", v)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-all",
                  values.audio_intensity === v
                    ? "border-blue-600/60 bg-blue-950/30 text-blue-300"
                    : "border-[#2d3347] bg-[#0f1117] text-[#9daabf] hover:border-[#353c52]"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-2">
          <Label className="mb-2 block text-xs">Grading Strictness</Label>
          <div className="space-y-2">
            {[
              { v: "lenient", desc: "Forgiving on timing and minor deviations" },
              { v: "standard", desc: "Balanced — doctrine-aligned expectations" },
              { v: "strict", desc: "Precise timing, full sequence compliance required" },
            ].map(({ v, desc }) => (
              <button
                key={v}
                type="button"
                onClick={() => setValue("grading_strictness", v as "lenient" | "standard" | "strict")}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left transition-all",
                  values.grading_strictness === v
                    ? "border-blue-600/60 bg-blue-950/30"
                    : "border-[#2d3347] bg-[#0f1117] hover:border-[#353c52]"
                )}
              >
                <p className={cn("text-xs font-semibold capitalize", values.grading_strictness === v ? "text-blue-300" : "text-[#d3dce8]")}>{v}</p>
                <p className="text-[10px] text-[#4a5370] mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </StepSection>
  )
}

function StepDoctrine({
  values, setValue, doctrinePacks,
}: {
  values: WizardForm
  setValue: UseFormSetValue<WizardForm>
  doctrinePacks: Array<{ id: string; name: string; audience: string; version: string }>
}) {
  return (
    <StepSection>
      <StepHeader
        title="Doctrine Pack"
        description="Select a doctrine pack to ground casualty generation and grading in approved guidance. Optional but strongly recommended."
      />

      <div>
        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => setValue("doctrine_pack_id", undefined)}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
              !values.doctrine_pack_id ? "border-blue-600/60 bg-blue-950/20" : "border-[#2d3347] bg-[#0f1117] hover:border-[#353c52]"
            )}
          >
            <div className="h-8 w-8 rounded-lg bg-[#1e2330] flex items-center justify-center">
              <Brain className="h-4 w-4 text-[#6b7594]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#d3dce8]">No doctrine pack</p>
              <p className="text-xs text-[#4a5370] mt-0.5">AI generates freely — not recommended for formal training</p>
            </div>
            {!values.doctrine_pack_id && <Check className="h-4 w-4 text-blue-400 ml-auto" />}
          </button>

          {doctrinePacks.filter((dp) => dp.audience === values.audience || dp.audience === "universal").map((dp) => (
            <button
              key={dp.id}
              type="button"
              onClick={() => setValue("doctrine_pack_id", dp.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                values.doctrine_pack_id === dp.id ? "border-blue-600/60 bg-blue-950/20" : "border-[#2d3347] bg-[#0f1117] hover:border-[#353c52]"
              )}
            >
              <div className="h-8 w-8 rounded-lg bg-[#1a2444] border border-blue-800/40 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#d3dce8]">{dp.name}</p>
                <p className="text-xs text-[#4a5370] mt-0.5">v{dp.version} · {dp.audience}</p>
              </div>
              {values.doctrine_pack_id === dp.id && <Check className="h-4 w-4 text-blue-400 shrink-0" />}
            </button>
          ))}

          {doctrinePacks.length === 0 && (
            <div className="rounded-xl border border-[#2d3347] p-6 text-center">
              <BookOpen className="h-6 w-6 text-[#353c52] mx-auto mb-2" />
              <p className="text-sm text-[#6b7594]">No approved doctrine packs</p>
              <p className="text-xs text-[#3e465e] mt-1">Upload and approve a doctrine pack to enable AI-grounded generation</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Additional Notes for AI</Label>
        <Textarea
          placeholder="Optional: describe any specific training objectives, unique conditions, or scenario context you want the AI to incorporate..."
          rows={4}
          className="resize-none"
          value={values.custom_notes ?? ""}
          onChange={(e) => setValue("custom_notes", e.target.value)}
        />
        <p className="text-[11px] text-[#3e465e] mt-1.5">This will be included in the generation prompt as contextual guidance.</p>
      </div>
    </StepSection>
  )
}

function StepReview({
  values, doctrinePacks, isGenerating, generationProgress, onGenerate,
}: {
  values: WizardForm
  doctrinePacks: Array<{ id: string; name: string; audience: string; version: string }>
  isGenerating: boolean
  generationProgress: string[]
  onGenerate: () => void
}) {
  const selectedPack = doctrinePacks.find((dp) => dp.id === values.doctrine_pack_id)

  if (isGenerating) {
    return (
      <StepSection>
        <StepHeader title="Generating Scenario" description="AI is building your scenario package..." />
        <div className="space-y-3">
          {generationProgress.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="flex items-center gap-3 text-sm"
            >
              {step.startsWith("✓") ? (
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              ) : step.startsWith("✗") ? (
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              ) : i === generationProgress.length - 1 ? (
                <Loader2 className="h-4 w-4 text-blue-400 animate-spin shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-[#353c52] shrink-0" />
              )}
              <span className={step.startsWith("✓") ? "text-green-300" : step.startsWith("✗") ? "text-red-300" : i === generationProgress.length - 1 ? "text-[#f0f4ff]" : "text-[#4a5370]"}>
                {step}
              </span>
            </motion.div>
          ))}
        </div>
      </StepSection>
    )
  }

  return (
    <StepSection>
      <StepHeader
        title="Review & Generate"
        description="Confirm your scenario configuration. AI will generate the full scenario package including casualty profiles and rubric."
      />

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Audience", value: values.audience },
          { label: "Scenario Type", value: values.scenario_type },
          { label: "Environment", value: values.environment },
          { label: "Complexity", value: values.complexity },
          { label: "Casualties", value: `${values.casualty_count} casualty${values.casualty_count !== 1 ? "s" : ""}` },
          { label: "Evac Delay", value: `${values.evac_delay_minutes} min` },
          { label: "Doctrine Pack", value: selectedPack?.name ?? "None" },
          { label: "Hidden Complications", value: values.hidden_complications ? "Enabled" : "Disabled" },
          { label: "Audio Intensity", value: values.audio_intensity },
          { label: "Grading", value: values.grading_strictness },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-[#2d3347] bg-[#0f1117] px-3 py-2.5">
            <p className="text-[10px] text-[#4a5370] font-medium uppercase tracking-wider">{label}</p>
            <p className="text-sm font-medium text-[#d3dce8] mt-0.5 capitalize">{value}</p>
          </div>
        ))}
      </div>

      {(values.weather_stressors.length > 0 || values.equipment_limitations.length > 0) && (
        <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <p className="text-xs font-semibold text-amber-300">Active Modifiers</p>
          </div>
          {values.weather_stressors.length > 0 && (
            <p className="text-xs text-amber-200/70">Weather: {values.weather_stressors.join(", ")}</p>
          )}
          {values.equipment_limitations.length > 0 && (
            <p className="text-xs text-amber-200/70 mt-1">Limitations: {values.equipment_limitations.join(", ")}</p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-blue-800/40 bg-blue-950/20 p-5">
        <div className="flex items-start gap-3">
          <Wand2 className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-200 mb-1">AI Generation Package</p>
            <p className="text-xs text-blue-200/70 leading-relaxed">
              The AI will generate: scenario narrative, instructor notes, {values.casualty_count} casualty profile{values.casualty_count !== 1 ? "s" : ""} with vitals and deterioration paths, event injects, scoring rubric, and expected milestones.
              {selectedPack && ` All outputs will be grounded against ${selectedPack.name}.`}
            </p>
          </div>
        </div>
      </div>

      <Button
        size="xl"
        className="w-full"
        leftIcon={<Wand2 className="h-5 w-5" />}
        onClick={onGenerate}
      >
        Generate Scenario
      </Button>
    </StepSection>
  )
}
