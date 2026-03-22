"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Play, Clock, Users, Target, MapPin, Shield, BookOpen, Tag,
  ChevronRight, AlertTriangle, CheckCircle2, Eye, EyeOff,
  Activity, Zap, Radio, BarChart2, CalendarDays, RotateCcw,
  Heart, Wind, Droplets
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Header } from "@/components/layout/header"
import { cn, formatRelativeTime, formatDuration } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"

interface VitalSigns {
  hr: number; rr: number; sbp: number; dbp: number; spo2: number; temp: number; avpu: string
}

interface Casualty {
  id: string
  callsign: string
  display_label: string
  triage_category: string
  mechanism_of_injury: string
  visible_injuries: Array<{ type: string; location: string; severity: string; laterality?: string | null }>
  airway_status: string
  breathing_status: string
  circulation_state: string
  neurologic_status: string
  pain_level: number
  baseline_vitals: VitalSigns
}

interface Inject {
  id: string
  trigger_type: string
  trigger_time_seconds?: number | null
  title: string
  description?: string | null
}

interface ScenarioDetailProps {
  scenario: {
    id: string
    title: string
    description?: string | null
    environment: string
    complexity: string
    audience: string
    scenario_type: string
    casualty_count: number
    evac_delay_minutes?: number | null
    objectives?: string[] | null
    status: string
    created_at: string
    doctrine_pack_id?: string | null
  }
  casualties: Casualty[]
  injects: Inject[]
  recentRuns: Array<{ id: string; status: string; clock_seconds: number; created_at: string }>
}

const TRIAGE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  T1: { label: "T1 — Immediate", color: "text-red-300", bg: "bg-red-950/30", border: "border-red-700/50" },
  T2: { label: "T2 — Delayed", color: "text-amber-300", bg: "bg-amber-950/30", border: "border-amber-700/50" },
  T3: { label: "T3 — Minimal", color: "text-green-300", bg: "bg-green-950/30", border: "border-green-700/50" },
  T4: { label: "T4 — Expectant", color: "text-purple-300", bg: "bg-purple-950/30", border: "border-purple-700/50" },
  deceased: { label: "Deceased", color: "text-[#6b7594]", bg: "bg-[#1e2330]", border: "border-[#353c52]" },
}

const COMPLEXITY_COLORS: Record<string, string> = {
  beginner: "text-green-400",
  intermediate: "text-amber-400",
  advanced: "text-orange-400",
  expert: "text-red-400",
}

const INJECT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  intel: Radio,
  environmental: MapPin,
  medical: Activity,
  command: Shield,
  complication: AlertTriangle,
}

export function ScenarioDetail({ scenario, casualties, injects, recentRuns }: ScenarioDetailProps) {
  const router = useRouter()
  const [showAllInjects, setShowAllInjects] = useState(false)
  const [selectedCasualty, setSelectedCasualty] = useState<Casualty | null>(casualties[0] ?? null)

  const t1Count = casualties.filter((c) => c.triage_category === "T1").length
  const t2Count = casualties.filter((c) => c.triage_category === "T2").length
  const t3Count = casualties.filter((c) => c.triage_category === "T3").length
  const t4Count = casualties.filter((c) => c.triage_category === "T4").length

  const visibleInjects = showAllInjects ? injects : injects.slice(0, 4)

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title={scenario.title}
        subtitle={`${scenario.audience} · ${scenario.environment} · ${scenario.complexity}`}
        actions={
          <div className="flex items-center gap-2">
            {recentRuns.some((r) => r.status === "active") ? (
              <Button
                leftIcon={<Activity className="h-3.5 w-3.5 animate-pulse" />}
                variant="critical"
                size="sm"
                onClick={() => {
                  const activeRun = recentRuns.find((r) => r.status === "active")
                  if (activeRun) router.push(`${ROUTES.scenarios}/${scenario.id}/run`)
                }}
              >
                Rejoin Active Run
              </Button>
            ) : (
              <Button
                leftIcon={<Play className="h-3.5 w-3.5" />}
                size="sm"
                onClick={() => router.push(`${ROUTES.scenarios}/${scenario.id}/run`)}
              >
                Start Run
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Casualties", value: scenario.casualty_count, icon: Users, color: "text-blue-400" },
            { label: "Complexity", value: scenario.complexity, icon: BarChart2, color: COMPLEXITY_COLORS[scenario.complexity] ?? "text-[#9daabf]" },
            { label: "Environment", value: scenario.environment, icon: MapPin, color: "text-cyan-400" },
            { label: "Evac Delay", value: scenario.evac_delay_minutes ? `${scenario.evac_delay_minutes}m` : "Immediate", icon: Clock, color: "text-amber-400" },
            { label: "Injects", value: injects.length, icon: Zap, color: "text-purple-400" },
            { label: "Past Runs", value: recentRuns.length, icon: CalendarDays, color: "text-[#9daabf]" },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <p className="text-[10px] text-[#4a5370] uppercase tracking-wider mb-1">{stat.label}</p>
                  <div className="flex items-center justify-between">
                    <p className={cn("text-base font-bold capitalize", stat.color)}>{stat.value}</p>
                    <Icon className={cn("h-4 w-4 opacity-50", stat.color)} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* MASCAL triage summary */}
        {casualties.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {t1Count > 0 && <Badge variant="T1" dot>{t1Count} T1</Badge>}
            {t2Count > 0 && <Badge variant="T2" dot>{t2Count} T2</Badge>}
            {t3Count > 0 && <Badge variant="T3" dot>{t3Count} T3</Badge>}
            {t4Count > 0 && <Badge variant="T4" dot>{t4Count} T4</Badge>}
            {scenario.doctrine_pack_id && (
              <Badge variant="secondary">
                <BookOpen className="h-3 w-3 mr-1" />
                Doctrine Pack
              </Badge>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Casualties + Injects */}
          <div className="xl:col-span-2 space-y-5">
            <Tabs defaultValue="casualties">
              <TabsList>
                <TabsTrigger value="casualties">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Casualties ({casualties.length})
                </TabsTrigger>
                <TabsTrigger value="injects">
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Injects ({injects.length})
                </TabsTrigger>
                {scenario.objectives && scenario.objectives.length > 0 && (
                  <TabsTrigger value="objectives">
                    <Target className="h-3.5 w-3.5 mr-1.5" />
                    Objectives
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="casualties" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {casualties.map((casualty, i) => {
                    const triage = TRIAGE_CONFIG[casualty.triage_category] ?? TRIAGE_CONFIG.T3
                    return (
                      <motion.div
                        key={casualty.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => setSelectedCasualty(casualty)}
                        className="cursor-pointer"
                      >
                        <Card
                          className={cn(
                            "transition-all",
                            triage.border,
                            selectedCasualty?.id === casualty.id ? `${triage.bg} ring-1 ring-inset ${triage.border}` : "hover:border-[#353c52]"
                          )}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className={cn("text-sm font-bold font-mono", triage.color)}>{casualty.callsign}</p>
                                <p className="text-[11px] text-[#6b7594] mt-0.5 truncate">{casualty.display_label}</p>
                              </div>
                              <Badge
                                variant={casualty.triage_category as "T1" | "T2" | "T3" | "T4"}
                                size="sm"
                              >
                                {casualty.triage_category}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-[#9daabf] mb-2 line-clamp-2">{casualty.mechanism_of_injury}</p>
                            <div className="grid grid-cols-4 gap-1">
                              {[
                                { label: "HR", value: casualty.baseline_vitals.hr },
                                { label: "RR", value: casualty.baseline_vitals.rr },
                                { label: "SBP", value: casualty.baseline_vitals.sbp },
                                { label: "SpO₂", value: `${casualty.baseline_vitals.spo2}%` },
                              ].map((v) => (
                                <div key={v.label} className="rounded bg-[#0a0c10] border border-[#1e2330] px-1.5 py-1 text-center">
                                  <p className="text-[9px] text-[#4a5370]">{v.label}</p>
                                  <p className="text-xs font-mono font-semibold text-[#d3dce8]">{v.value}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="injects" className="mt-4 space-y-2">
                {injects.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#4a5370]">No injects configured</div>
                ) : (
                  <>
                    {visibleInjects.map((inject, i) => {
                      const Icon = Radio
                      return (
                        <motion.div
                          key={inject.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <div className="flex items-start gap-3 rounded-lg border border-[#1e2330] bg-[#0d0f14] px-4 py-3">
                            <div className="h-7 w-7 rounded-md bg-[#1a2444] border border-blue-800/30 flex items-center justify-center shrink-0 mt-0.5">
                              <Icon className="h-3.5 w-3.5 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-xs font-semibold text-[#d3dce8] truncate">{inject.title}</p>
                                <Badge variant="secondary" size="sm">{inject.trigger_type}</Badge>
                                {inject.trigger_time_seconds != null && (
                                  <span className="text-[10px] text-[#4a5370] font-mono ml-auto shrink-0">
                                    T+{Math.floor(inject.trigger_time_seconds / 60)}:{String(inject.trigger_time_seconds % 60).padStart(2, "0")}
                                  </span>
                                )}
                              </div>
                              {inject.description && (
                                <p className="text-[11px] text-[#6b7594] line-clamp-2">{inject.description}</p>
                              )}
                              <p className="text-[10px] text-[#3e465e] mt-1">
                                Trigger: {inject.trigger_type}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                    {injects.length > 4 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowAllInjects(!showAllInjects)}
                      >
                        {showAllInjects ? "Show less" : `Show ${injects.length - 4} more injects`}
                      </Button>
                    )}
                  </>
                )}
              </TabsContent>

              {scenario.objectives && scenario.objectives.length > 0 && (
                <TabsContent value="objectives" className="mt-4 space-y-2">
                  {scenario.objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-[#1e2330] px-4 py-3">
                      <Target className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-[#9daabf]">{obj}</p>
                    </div>
                  ))}
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Right: Selected casualty detail + recent runs */}
          <div className="space-y-5">
            {selectedCasualty && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-mono">{selectedCasualty.callsign}</CardTitle>
                    <Badge variant={selectedCasualty.triage_category as "T1" | "T2" | "T3" | "T4"}>
                      {selectedCasualty.triage_category}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{selectedCasualty.display_label}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-[10px] text-[#4a5370] uppercase tracking-wider mb-1">Mechanism</p>
                    <p className="text-xs text-[#9daabf]">{selectedCasualty.mechanism_of_injury}</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-[10px] text-[#4a5370] uppercase tracking-wider mb-1.5">Baseline Vitals</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: "HR", value: `${selectedCasualty.baseline_vitals.hr} bpm`, icon: Heart },
                        { label: "RR", value: `${selectedCasualty.baseline_vitals.rr}/min`, icon: Wind },
                        { label: "SBP", value: `${selectedCasualty.baseline_vitals.sbp}`, icon: Activity },
                        { label: "DBP", value: `${selectedCasualty.baseline_vitals.dbp}`, icon: Activity },
                        { label: "SpO₂", value: `${selectedCasualty.baseline_vitals.spo2}%`, icon: Droplets },
                        { label: "AVPU", value: selectedCasualty.baseline_vitals.avpu, icon: Eye },
                      ].map((v) => (
                        <div key={v.label} className="rounded bg-[#0a0c10] border border-[#1e2330] p-2 text-center">
                          <p className="text-[9px] text-[#4a5370]">{v.label}</p>
                          <p className="text-xs font-mono font-semibold text-[#d3dce8]">{v.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-[10px] text-[#4a5370] uppercase tracking-wider mb-1.5">Visible Injuries</p>
                    <div className="space-y-1">
                      {selectedCasualty.visible_injuries.slice(0, 5).map((inj, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            inj.severity === "critical" ? "bg-red-500" :
                            inj.severity === "moderate" ? "bg-amber-500" : "bg-green-500"
                          )} />
                          <p className="text-xs text-[#9daabf]">
                            {inj.severity} {inj.type}
                            {inj.laterality ? ` (${inj.laterality})` : ""} — {inj.location}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[
                      { label: "Airway", value: selectedCasualty.airway_status },
                      { label: "Breathing", value: selectedCasualty.breathing_status },
                      { label: "Circulation", value: selectedCasualty.circulation_state },
                    ].map((s) => (
                      <div key={s.label} className="rounded bg-[#0a0c10] border border-[#1e2330] p-2 text-center">
                        <p className="text-[9px] text-[#4a5370]">{s.label}</p>
                        <p className="text-[10px] font-semibold text-[#d3dce8] capitalize truncate">{s.value.replace(/_/g, " ")}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent runs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Runs</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {recentRuns.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#4a5370]">No runs yet</div>
                ) : (
                  <div className="divide-y divide-[#1e2330]">
                    {recentRuns.map((run) => (
                      <div key={run.id} className="flex items-center gap-3 px-5 py-2.5">
                        <div className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          run.status === "completed" ? "bg-green-500" :
                          run.status === "active" ? "bg-red-500 animate-pulse" : "bg-[#4a5370]"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#d3dce8] capitalize">{run.status}</p>
                          <p className="text-[10px] text-[#3e465e]">{formatRelativeTime(run.created_at)}</p>
                        </div>
                        {run.clock_seconds > 0 && (
                          <span className="text-[11px] font-mono text-[#6b7594]">{formatDuration(run.clock_seconds)}</span>
                        )}
                        <Badge
                          variant={run.status === "completed" ? "stable" : run.status === "active" ? "critical" : "secondary"}
                          size="sm"
                        >
                          {run.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                {recentRuns.length > 0 && (
                  <div className="px-5 py-3 border-t border-[#1e2330]">
                    <Button
                      variant="ghost"
                      size="xs"
                      rightIcon={<ChevronRight className="h-3 w-3" />}
                      onClick={() => router.push(ROUTES.analytics)}
                      className="w-full justify-center"
                    >
                      View in Analytics
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
