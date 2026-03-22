"use client"

import React, { useState, useEffect, useRef, useCallback, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play, Pause, Square, Clock, Activity, Users, Volume2,
  VolumeX, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
  Radio, Zap, Plus, Send, Brain, MessageSquare, Target,
  Eye, EyeOff, Droplets, Wind, Shield, RotateCcw, FastForward,
  User, ArrowUpRight, X, Stethoscope, Mic, Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, formatDuration, formatRelativeTime } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { TRIAGE_CATEGORIES, VITAL_RANGES } from "@/lib/constants"
import { toast } from "sonner"
import type { Json } from "@/lib/supabase/database.types"

interface VitalSigns {
  hr: number; rr: number; sbp: number; dbp: number; spo2: number; temp: number; avpu: string
}

interface CasualtyProfile {
  id: string; callsign: string; display_label: string; mechanism_of_injury: string
  visible_injuries: Array<{ type: string; location: string; severity: string; laterality?: string | null }>
  hidden_complications: Array<{ type: string; location: string; severity: string }>
  airway_status: string; breathing_status: string; circulation_state: string
  neurologic_status: string; triage_category: string; baseline_vitals: VitalSigns
  pain_level: number; audio_profile: { primary_complaint?: string }
}

interface ScenarioRun {
  id: string; status: string; clock_seconds: number; started_at?: string | null
}

interface Intervention {
  id: string; action_type: string; elapsed_seconds: number
  created_at: string; casualty_id: string; raw_text?: string | null; confidence_score: number
}

interface RunCommandCenterProps {
  scenario: { id: string; title: string; environment: string; complexity: string; doctrine_packs?: { name: string } | null }
  casualties: CasualtyProfile[]
  activeRun: ScenarioRun | null
  userId: string
  userName: string
  orgId: string
}

const TRIAGE_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  T1: { border: "border-red-700/60", bg: "bg-red-950/30", text: "text-red-300" },
  T2: { border: "border-amber-700/60", bg: "bg-amber-950/30", text: "text-amber-300" },
  T3: { border: "border-green-700/60", bg: "bg-green-950/30", text: "text-green-300" },
  T4: { border: "border-purple-700/60", bg: "bg-purple-950/30", text: "text-purple-300" },
  deceased: { border: "border-[#353c52]", bg: "bg-[#1e2330]", text: "text-[#6b7594]" },
}

export function RunCommandCenter({
  scenario, casualties, activeRun, userId, userName, orgId,
}: RunCommandCenterProps) {
  const supabase = createClient()

  // Run state
  const [run, setRun] = useState<ScenarioRun | null>(activeRun)
  const [clockSeconds, setClockSeconds] = useState(activeRun?.clock_seconds ?? 0)
  const [isRunning, setIsRunning] = useState(activeRun?.status === "active")
  const [isPending, startTransition] = useTransition()
  const clockRef = useRef<NodeJS.Timeout | null>(null)

  // UI state
  const [selectedCasualtyId, setSelectedCasualtyId] = useState<string | null>(
    casualties[0]?.id ?? null
  )
  const [treatmentInput, setTreatmentInput] = useState("")
  const [isInterpreting, setIsInterpreting] = useState(false)
  const [interventionLog, setInterventionLog] = useState<Intervention[]>([])
  const [copilotQuery, setCopilotQuery] = useState("")
  const [copilotResponse, setCopilotResponse] = useState<string | null>(null)
  const [isCopilotLoading, setIsCopilotLoading] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const [audioMuted, setAudioMuted] = useState(false)

  // Vitals state per casualty (starts from baseline, updated by simulation)
  const [casualtyVitals, setCasualtyVitals] = useState<Record<string, VitalSigns>>(() =>
    Object.fromEntries(casualties.map((c) => [c.id, c.baseline_vitals]))
  )
  const [casualtyStates, setCasualtyStates] = useState<Record<string, { triage: string; outcome: string }>>(() =>
    Object.fromEntries(casualties.map((c) => [c.id, { triage: c.triage_category, outcome: "unknown" }]))
  )

  const selectedCasualty = casualties.find((c) => c.id === selectedCasualtyId)
  const currentVitals = selectedCasualtyId ? casualtyVitals[selectedCasualtyId] : null

  // Clock
  useEffect(() => {
    if (isRunning) {
      clockRef.current = setInterval(() => {
        setClockSeconds((s) => s + 1)
      }, 1000)
    } else if (clockRef.current) {
      clearInterval(clockRef.current)
    }
    return () => { if (clockRef.current) clearInterval(clockRef.current) }
  }, [isRunning])

  // Realtime subscription for run updates
  useEffect(() => {
    if (!run?.id) return
    const channel = supabase
      .channel(`run:${run.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "interventions",
        filter: `run_id=eq.${run.id}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setInterventionLog((prev) => [payload.new as Intervention, ...prev])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [run?.id, supabase])

  // Fetch interventions on mount
  useEffect(() => {
    if (!run?.id) return
    supabase
      .from("interventions")
      .select("id, action_type, elapsed_seconds, created_at, casualty_id, raw_text, confidence_score")
      .eq("run_id", run.id)
      .order("elapsed_seconds", { ascending: false })
      .limit(50)
      .then(({ data }) => { if (data) setInterventionLog(data as unknown as Intervention[]) })
  }, [run?.id, supabase])

  const handleStartRun = async () => {
    startTransition(async () => {
      const { data: runData, error } = await supabase
        .from("scenario_runs")
        .insert({
          scenario_id: scenario.id,
          org_id: orgId,
          lead_proctor_id: userId,
          status: "active",
          started_at: new Date().toISOString(),
        })
        .select("id, status, clock_seconds, started_at")
        .single()

      if (error || !runData) {
        toast.error("Failed to start run", { description: error?.message })
        return
      }

      // Add self as participant
      await supabase.from("run_participants").insert({
        run_id: runData.id,
        user_id: userId,
        role: "lead_proctor",
      })

      // Initialize casualty states
      await supabase.from("casualty_states").insert(
        casualties.map((c) => ({
          run_id: runData.id,
          casualty_id: c.id,
          current_vitals: c.baseline_vitals as unknown as Json,
          airway_status: c.airway_status,
          breathing_status: c.breathing_status,
          circulation_state: c.circulation_state,
          neurologic_status: c.neurologic_status,
          triage_category: c.triage_category,
        }))
      )

      setRun(runData as unknown as ScenarioRun)
      setIsRunning(true)
      setClockSeconds(0)
      toast.success("Run started", { description: `${userName} — ${new Date().toLocaleTimeString()}` })
    })
  }

  const handlePauseResume = async () => {
    if (!run) return
    const newStatus = isRunning ? "paused" : "active"
    await supabase.from("scenario_runs").update({ status: newStatus }).eq("id", run.id)
    setIsRunning(!isRunning)
    toast.info(isRunning ? "Run paused" : "Run resumed")
  }

  const handleEndRun = async () => {
    if (!run) return
    await supabase.from("scenario_runs").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      clock_seconds: clockSeconds,
    }).eq("id", run.id)
    setIsRunning(false)
    toast.success("Run completed")
  }

  const handleLogTreatment = async () => {
    if (!treatmentInput.trim() || !run || !selectedCasualtyId) return

    setIsInterpreting(true)
    try {
      // Insert raw intervention
      const { data: intervention } = await supabase
        .from("interventions")
        .insert({
          run_id: run.id,
          casualty_id: selectedCasualtyId,
          proctor_id: userId,
          raw_text: treatmentInput,
          action_type: "unknown",
          confidence_score: 0.5,
          status: "pending_interpretation",
          elapsed_seconds: clockSeconds,
        })
        .select("id")
        .single()

      // Interpret with AI
      const res = await fetch("/api/ai/interpret-treatment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: treatmentInput,
          casualty_context: `${selectedCasualty?.callsign} — ${selectedCasualty?.mechanism_of_injury}`,
          elapsed_seconds: clockSeconds,
          intervention_id: intervention?.id,
        }),
      })

      if (res.ok) {
        const interpretation = await res.json()
        toast.success(`Logged: ${interpretation.action_type}`, {
          description: interpretation.confidence < 0.7 ? `⚠ Low confidence — review: ${interpretation.ambiguity_flags.join(", ")}` : undefined,
        })
      }

      setTreatmentInput("")
    } catch (err) {
      toast.error("Failed to log treatment")
    } finally {
      setIsInterpreting(false)
    }
  }

  const handleCopilotQuery = async () => {
    if (!copilotQuery.trim()) return
    setIsCopilotLoading(true)
    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: copilotQuery,
          scenario_context: `${scenario.title} — ${scenario.environment}`,
          elapsed_seconds: clockSeconds,
          casualty_statuses: casualties.map((c) => `${c.callsign}: ${casualtyStates[c.id]?.triage ?? c.triage_category}`).join(", "),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setCopilotResponse(data.response)
      }
    } catch {
      toast.error("Copilot unavailable")
    } finally {
      setIsCopilotLoading(false)
      setCopilotQuery("")
    }
  }

  const getVitalStatus = (key: string, value: number): "normal" | "abnormal" | "critical" => {
    const ranges: Record<string, { min: number; max: number; crit: number; critHigh: number }> = {
      hr: { min: 60, max: 100, crit: 40, critHigh: 150 },
      rr: { min: 12, max: 20, crit: 6, critHigh: 35 },
      sbp: { min: 90, max: 140, crit: 70, critHigh: 200 },
      spo2: { min: 95, max: 100, crit: 85, critHigh: 100 },
    }
    const r = ranges[key]
    if (!r) return "normal"
    if (value <= r.crit || value >= r.critHigh) return "critical"
    if (value < r.min || value > r.max) return "abnormal"
    return "normal"
  }

  const vitalStatusColor = (status: "normal" | "abnormal" | "critical") =>
    status === "critical" ? "text-red-400" : status === "abnormal" ? "text-amber-400" : "text-green-400"

  return (
    <div className="flex flex-col h-screen bg-[#0a0c10] overflow-hidden">
      {/* Top command bar */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-[#1e2330] bg-[#0a0c10] shrink-0">
        {/* Logo + Scenario */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "status-dot",
              isRunning ? "status-dot-critical" : run ? "status-dot-alert" : "status-dot-neutral"
            )} />
            {isRunning && <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider animate-blink">LIVE</span>}
          </div>
          <div className="divider h-4 w-px" />
          <div>
            <p className="text-xs font-semibold text-[#d3dce8] leading-none">{scenario.title}</p>
            <p className="text-[10px] text-[#4a5370] leading-none mt-0.5">{scenario.environment}</p>
          </div>
        </div>

        {/* Clock */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0f1117] border border-[#1e2330]">
          <Clock className={cn("h-3.5 w-3.5", isRunning ? "text-red-400" : "text-[#6b7594]")} />
          <span className={cn("font-mono text-sm font-bold tracking-wider", isRunning ? "text-[#f0f4ff]" : "text-[#9daabf]")}>
            {formatDuration(clockSeconds)}
          </span>
        </div>

        {/* Casualties summary */}
        <div className="flex items-center gap-1.5">
          {casualties.map((c) => {
            const state = casualtyStates[c.id]
            const colors = TRIAGE_COLORS[state?.triage ?? c.triage_category] ?? TRIAGE_COLORS.T2
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCasualtyId(c.id)}
                className={cn(
                  "h-7 px-2 rounded text-[10px] font-bold border transition-all",
                  colors.border, colors.bg, colors.text,
                  selectedCasualtyId === c.id && "ring-1 ring-blue-500 ring-offset-1 ring-offset-[#0a0c10]"
                )}
              >
                {c.callsign}
              </button>
            )
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setAudioMuted(!audioMuted)}
            className="text-[#6b7594]"
          >
            {audioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          {!run ? (
            <Button
              size="sm"
              leftIcon={<Play className="h-3.5 w-3.5" />}
              loading={isPending}
              onClick={handleStartRun}
              className="bg-green-700 hover:bg-green-600 border-green-600/30"
            >
              Start Run
            </Button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handlePauseResume}
                className="text-[#9daabf]"
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                leftIcon={<Square className="h-3.5 w-3.5" />}
                onClick={handleEndRun}
              >
                End Run
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main layout: 3-column */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Casualty roster */}
        <div className="w-52 border-r border-[#1e2330] flex flex-col shrink-0">
          <div className="px-3 py-2.5 border-b border-[#1e2330]">
            <p className="text-[10px] font-semibold text-[#4a5370] uppercase tracking-wider">
              Casualties ({casualties.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto scrollable">
            {casualties.map((c) => {
              const state = casualtyStates[c.id]
              const colors = TRIAGE_COLORS[state?.triage ?? c.triage_category] ?? TRIAGE_COLORS.T2
              const vitals = casualtyVitals[c.id]
              const isSelected = selectedCasualtyId === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCasualtyId(c.id)}
                  className={cn(
                    "w-full px-3 py-2.5 flex flex-col gap-1 border-b border-[#0f1117] transition-colors text-left",
                    isSelected ? "bg-[#1a2444]" : "hover:bg-[#0f1117]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#f0f4ff]">{c.callsign}</span>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", colors.border, colors.bg, colors.text)}>
                      {state?.triage ?? c.triage_category}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#4a5370] line-clamp-1">{c.mechanism_of_injury}</p>
                  {vitals && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-[10px] font-mono", vitalStatusColor(getVitalStatus("hr", vitals.hr)))}>
                        {Math.round(vitals.hr)} HR
                      </span>
                      <span className={cn("text-[10px] font-mono", vitalStatusColor(getVitalStatus("sbp", vitals.sbp)))}>
                        {Math.round(vitals.sbp)} SBP
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* CENTER: Casualty detail + treatment log */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {selectedCasualty ? (
            <>
              {/* Casualty header */}
              <div className="flex items-start justify-between px-5 py-3.5 border-b border-[#1e2330] bg-[#0a0c10] shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-[#f0f4ff] tracking-tight">{selectedCasualty.callsign}</h2>
                    <Badge
                      variant={
                        (casualtyStates[selectedCasualty.id]?.triage ?? selectedCasualty.triage_category) === "T1" ? "T1" :
                        (casualtyStates[selectedCasualty.id]?.triage ?? selectedCasualty.triage_category) === "T2" ? "T2" :
                        (casualtyStates[selectedCasualty.id]?.triage ?? selectedCasualty.triage_category) === "T3" ? "T3" : "T4"
                      }
                    >
                      {casualtyStates[selectedCasualty.id]?.triage ?? selectedCasualty.triage_category}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#6b7594]">{selectedCasualty.mechanism_of_injury}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHidden(!showHidden)}
                    className="flex items-center gap-1.5 text-xs text-[#6b7594] hover:text-[#9daabf] transition-colors"
                  >
                    {showHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showHidden ? "Hide" : "Show"} hidden
                  </button>
                </div>
              </div>

              {/* Vitals strip */}
              {currentVitals && (
                <div className="grid grid-cols-5 gap-px border-b border-[#1e2330] shrink-0 bg-[#1e2330]">
                  {[
                    { key: "hr", label: "HR", value: Math.round(currentVitals.hr), unit: "bpm" },
                    { key: "rr", label: "RR", value: Math.round(currentVitals.rr), unit: "/min" },
                    { key: "sbp", label: "SBP", value: Math.round(currentVitals.sbp), unit: "mmHg" },
                    { key: "spo2", label: "SpO₂", value: Math.round(currentVitals.spo2), unit: "%" },
                    { key: "avpu", label: "AVPU", value: currentVitals.avpu, unit: "" },
                  ].map((v) => {
                    const status = v.key !== "avpu" ? getVitalStatus(v.key, v.value as number) : "normal"
                    return (
                      <div key={v.key} className={cn(
                        "flex flex-col items-center py-2.5 bg-[#0f1117]",
                        status === "critical" && "bg-red-950/30"
                      )}>
                        <span className="text-[9px] font-semibold text-[#4a5370] uppercase tracking-wider">{v.label}</span>
                        <span className={cn("text-xl font-bold font-mono leading-tight mt-0.5", vitalStatusColor(status))}>
                          {v.value}
                        </span>
                        <span className="text-[9px] text-[#3e465e]">{v.unit}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Injuries + treatment log */}
              <div className="flex-1 overflow-y-auto scrollable p-4 space-y-4">
                {/* Visible injuries */}
                <div>
                  <p className="text-[10px] font-semibold text-[#4a5370] uppercase tracking-wider mb-2">Visible Injuries</p>
                  <div className="space-y-1.5">
                    {selectedCasualty.visible_injuries.map((inj, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className={cn(
                          "shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold",
                          inj.severity === "critical" ? "bg-red-900/60 text-red-300" :
                          inj.severity === "severe" ? "bg-orange-900/60 text-orange-300" :
                          inj.severity === "moderate" ? "bg-amber-900/60 text-amber-300" :
                          "bg-[#1e2330] text-[#6b7594]"
                        )}>
                          {inj.severity}
                        </span>
                        <span className="text-[#b8c4d6]">
                          {inj.type} — {inj.location}{inj.laterality ? ` (${inj.laterality})` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hidden complications */}
                <AnimatePresence>
                  {showHidden && selectedCasualty.hidden_complications.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Hidden Complications</p>
                          <Badge variant="warning" size="sm">Instructor Only</Badge>
                        </div>
                        <div className="space-y-1.5">
                          {selectedCasualty.hidden_complications.map((h, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                              <span className="text-amber-200/80">
                                {h.type} — {h.location}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Treatment log */}
                {interventionLog.filter((i) => i.casualty_id === selectedCasualtyId).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-[#4a5370] uppercase tracking-wider mb-2">Treatment Log</p>
                    <div className="space-y-1.5">
                      {interventionLog
                        .filter((i) => i.casualty_id === selectedCasualtyId)
                        .map((i) => (
                          <div key={i.id} className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-[#4a5370] text-[10px] shrink-0">
                              {formatDuration(i.elapsed_seconds)}
                            </span>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-950/40 border border-blue-800/40 text-blue-300",
                              i.confidence_score < 0.7 && "border-amber-700/40 bg-amber-950/30 text-amber-300"
                            )}>
                              {i.action_type.replace(/_/g, " ")}
                            </span>
                            {i.raw_text && (
                              <span className="text-[#6b7594] truncate">{i.raw_text}</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Treatment input */}
              <div className="border-t border-[#1e2330] p-3 shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Log treatment — e.g. 'tourniquet left thigh, 3 inches above wound'"
                    value={treatmentInput}
                    onChange={(e) => setTreatmentInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && run) handleLogTreatment() }}
                    className="text-xs"
                    disabled={!run || isInterpreting}
                  />
                  <Button
                    size="sm"
                    onClick={handleLogTreatment}
                    loading={isInterpreting}
                    disabled={!treatmentInput.trim() || !run}
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                  >
                    Log
                  </Button>
                </div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {["Tourniquet", "Wound pack", "NPA", "Needle D/C", "IV access", "Reassess", "TQ check"].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setTreatmentInput(q)}
                      className="text-[10px] px-2 py-0.5 rounded border border-[#2d3347] bg-[#0f1117] text-[#6b7594] hover:text-[#9daabf] hover:border-[#353c52] transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <Users className="h-8 w-8 text-[#353c52] mx-auto mb-3" />
                <p className="text-sm text-[#4a5370]">Select a casualty to manage</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: AI Copilot + Event queue */}
        <div className="w-64 border-l border-[#1e2330] flex flex-col shrink-0">
          <Tabs defaultValue="copilot" className="flex flex-col h-full">
            <TabsList variant="underline" className="w-full justify-start px-3 pt-2 border-b border-[#1e2330]">
              <TabsTrigger variant="underline" value="copilot" className="text-[11px]">
                <Brain className="h-3 w-3 mr-1" /> Copilot
              </TabsTrigger>
              <TabsTrigger variant="underline" value="events" className="text-[11px]">
                <Bell className="h-3 w-3 mr-1" /> Events
              </TabsTrigger>
            </TabsList>

            <TabsContent value="copilot" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
              <div className="flex-1 overflow-y-auto scrollable p-3">
                {!copilotResponse && !isCopilotLoading && (
                  <div className="text-center py-8">
                    <Brain className="h-6 w-6 text-[#353c52] mx-auto mb-2" />
                    <p className="text-xs text-[#4a5370]">Ask the AI copilot anything about this scenario</p>
                    <div className="mt-3 space-y-1.5 text-left">
                      {[
                        "What should I watch for with T1s?",
                        "What missed critical actions are likely?",
                        "How is this scenario progressing?",
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => setCopilotQuery(q)}
                          className="w-full text-left text-[10px] px-2 py-1.5 rounded border border-[#1e2330] bg-[#0f1117] text-[#6b7594] hover:text-[#9daabf] hover:border-[#2d3347] transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {isCopilotLoading && (
                  <div className="flex items-center gap-2 text-xs text-[#6b7594] py-4">
                    <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full" />
                    Analyzing scenario...
                  </div>
                )}
                {copilotResponse && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Brain className="h-3 w-3 text-blue-400" />
                      <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider">AI Copilot</p>
                      <Badge variant="intel" size="sm" className="text-[9px]">Training Use Only</Badge>
                    </div>
                    <p className="text-xs text-[#b8c4d6] leading-relaxed whitespace-pre-line">{copilotResponse}</p>
                    <button onClick={() => setCopilotResponse(null)} className="text-[10px] text-[#4a5370] hover:text-[#6b7594]">
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <div className="border-t border-[#1e2330] p-2">
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Ask the copilot..."
                    value={copilotQuery}
                    onChange={(e) => setCopilotQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCopilotQuery() }}
                    className="text-xs h-7"
                  />
                  <Button
                    size="icon-sm"
                    onClick={handleCopilotQuery}
                    loading={isCopilotLoading}
                    disabled={!copilotQuery.trim()}
                  >
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="events" className="flex-1 overflow-y-auto scrollable m-0 p-3">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-[#4a5370] uppercase tracking-wider">Event Queue</p>
                {interventionLog.slice(0, 20).map((i) => {
                  const c = casualties.find((c) => c.id === i.casualty_id)
                  return (
                    <div key={i.id} className="flex items-start gap-2 text-xs border-b border-[#0f1117] pb-2">
                      <span className="font-mono text-[#3e465e] text-[9px] pt-0.5 shrink-0">
                        {formatDuration(i.elapsed_seconds)}
                      </span>
                      <div>
                        <span className="text-[#d3dce8] font-medium">{i.action_type.replace(/_/g, " ")}</span>
                        <span className="text-[#4a5370] ml-1">→ {c?.callsign ?? "Unknown"}</span>
                      </div>
                    </div>
                  )
                })}
                {interventionLog.length === 0 && (
                  <p className="text-xs text-[#3e465e] text-center py-4">No events yet</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
