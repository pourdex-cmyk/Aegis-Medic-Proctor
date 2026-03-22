"use client"

import React, { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Award, CheckCircle2, AlertTriangle, Clock, Target, ChevronRight,
  Save, Send, RotateCcw, Star, Minus, Plus, FileText, Brain,
  Activity, TrendingUp, TrendingDown, Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Header } from "@/components/layout/header"
import { cn, formatDuration, formatRelativeTime } from "@/lib/utils"
import { SCORING_DIMENSIONS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface RubricItem {
  id: string
  dimension: string
  criterion: string
  max_points: number
  is_critical: boolean
  order_index: number
}

interface Rubric {
  id: string
  rubric_items: RubricItem[]
}

interface Intervention {
  id: string
  action_type: string
  elapsed_seconds: number
  raw_text?: string | null
  confidence_score: number
  created_at: string
  casualty_id: string
}

interface GradeClientProps {
  run: {
    id: string
    status: string
    clock_seconds: number
    started_at?: string | null
    completed_at?: string | null
    lead_proctor_id: string
  }
  scenario: {
    id: string
    title: string
    complexity: string
    audience: string
    casualty_count: number
    objectives?: unknown
  }
  rubric: Rubric | null
  interventions: Intervention[]
  existingScore: {
    id: string
    percentage: number
    dimension_scores: unknown
    evaluator_notes?: string | null
    created_at: string
  } | null
}

// Build default items if no rubric exists
const DEFAULT_RUBRIC_ITEMS: RubricItem[] = [
  { id: "d1", dimension: "hemorrhage_control", criterion: "Correctly identified and controlled all life-threatening hemorrhage within 3 minutes", max_points: 25, is_critical: true, order_index: 1 },
  { id: "d2", dimension: "airway_management", criterion: "Assessed and managed airway for all unconscious or compromised casualties", max_points: 20, is_critical: true, order_index: 2 },
  { id: "d3", dimension: "triage_accuracy", criterion: "Correctly triaged all casualties using appropriate methodology (START/SALT/TCCC)", max_points: 20, is_critical: false, order_index: 3 },
  { id: "d4", dimension: "treatment_sequence", criterion: "Prioritized treatment by triage category and treated in correct order", max_points: 15, is_critical: false, order_index: 4 },
  { id: "d5", dimension: "communication", criterion: "Transmitted accurate MIST/SMEAC report and CASEVAC/MEDEVAC request", max_points: 10, is_critical: false, order_index: 5 },
  { id: "d6", dimension: "documentation", criterion: "Documented or verbalized all interventions accurately", max_points: 10, is_critical: false, order_index: 6 },
]

const DIMENSION_LABELS: Record<string, string> = {
  hemorrhage_control: "Hemorrhage Control",
  airway_management: "Airway Management",
  triage_accuracy: "Triage Accuracy",
  treatment_sequence: "Treatment Sequence",
  communication: "Communication",
  documentation: "Documentation",
  leadership: "Leadership",
  situational_awareness: "Situational Awareness",
}

type ScoreEntry = { points: number; note: string }

function getScoreColor(pct: number) {
  if (pct >= 90) return "text-green-400"
  if (pct >= 75) return "text-blue-400"
  if (pct >= 60) return "text-amber-400"
  return "text-red-400"
}

function getScoreVariant(pct: number): "stable" | "warning" | "critical" | "secondary" {
  if (pct >= 75) return "stable"
  if (pct >= 60) return "warning"
  if (pct > 0) return "critical"
  return "secondary"
}

export function GradeClient({ run, scenario, rubric, interventions, existingScore }: GradeClientProps) {
  const objectives = scenario.objectives as string[] | null | undefined
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false)

  const items = rubric?.rubric_items.sort((a, b) => a.order_index - b.order_index) ?? DEFAULT_RUBRIC_ITEMS
  const isLocked = !!existingScore

  // Score state: itemId → { points, note }
  const [scores, setScores] = useState<Record<string, ScoreEntry>>(() => {
    if (existingScore) {
      const raw = existingScore.dimension_scores as Record<string, { points: number; note: string }> | null
      return raw ?? {}
    }
    return Object.fromEntries(items.map((item) => [item.id, { points: 0, note: "" }]))
  })

  const [globalNotes, setGlobalNotes] = useState(existingScore?.evaluator_notes ?? "")
  const [activeTab, setActiveTab] = useState("rubric")

  // Calculated totals
  const totalMaxPoints = useMemo(() => items.reduce((s, i) => s + i.max_points, 0), [items])
  const totalEarned = useMemo(() => items.reduce((s, i) => s + (scores[i.id]?.points ?? 0), 0), [items, scores])
  const overallPct = totalMaxPoints > 0 ? Math.round((totalEarned / totalMaxPoints) * 100) : 0

  const dimensionScores = useMemo(() => {
    const byDimension: Record<string, { earned: number; max: number }> = {}
    items.forEach((item) => {
      if (!byDimension[item.dimension]) byDimension[item.dimension] = { earned: 0, max: 0 }
      byDimension[item.dimension].earned += scores[item.id]?.points ?? 0
      byDimension[item.dimension].max += item.max_points
    })
    return Object.entries(byDimension).map(([dim, { earned, max }]) => ({
      dimension: dim,
      label: DIMENSION_LABELS[dim] ?? dim,
      pct: max > 0 ? Math.round((earned / max) * 100) : 0,
      earned,
      max,
    }))
  }, [items, scores])

  const criticalItemsFailed = items.filter(
    (i) => i.is_critical && (scores[i.id]?.points ?? 0) < i.max_points * 0.5
  )

  const setItemPoints = (itemId: string, points: number) => {
    if (isLocked) return
    setScores((prev) => ({ ...prev, [itemId]: { ...prev[itemId], points } }))
  }

  const setItemNote = (itemId: string, note: string) => {
    if (isLocked) return
    setScores((prev) => ({ ...prev, [itemId]: { ...prev[itemId], note } }))
  }

  const handleSubmit = (finalize: boolean) => {
    startTransition(async () => {
      const dimScores = Object.fromEntries(
        dimensionScores.map(({ dimension, pct }) => [dimension, pct])
      )

      const { error } = await supabase.from("scores").upsert({
        run_id: run.id,
        rubric_id: rubric?.id ?? "default",
        evaluator_id: run.lead_proctor_id,
        total_score: totalEarned,
        max_possible: totalMaxPoints,
        percentage: overallPct,
        dimension_scores: dimScores,
        passed: overallPct >= 75,
        evaluator_notes: globalNotes.trim() || null,
      })

      if (error) {
        toast.error("Failed to save score", { description: error.message })
        return
      }

      // Update run status if finalizing
      if (finalize) {
        await supabase
          .from("scenario_runs")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", run.id)
      }

      toast.success(finalize ? "Score finalized" : "Draft saved", {
        description: finalize ? `${overallPct}% — ${overallPct >= 75 ? "Pass" : "Fail"}` : "You can continue editing",
      })

      if (finalize) {
        router.push(`/app/scenarios/${scenario.id}`)
      }
    })
  }

  const handleGenerateNarrative = async () => {
    setIsGeneratingNarrative(true)
    try {
      const res = await fetch("/api/ai/generate-aar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: run.id, scores: dimensionScores }),
      })
      if (!res.ok) throw new Error("Failed to generate narrative")
      toast.success("AAR narrative generated", { description: "View it in Reports" })
    } catch {
      toast.error("Failed to generate AAR narrative")
    } finally {
      setIsGeneratingNarrative(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Grade Run"
        subtitle={scenario.title}
        actions={
          <div className="flex items-center gap-2">
            {!isLocked && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Save className="h-3.5 w-3.5" />}
                  onClick={() => handleSubmit(false)}
                  loading={isPending}
                >
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  leftIcon={<Send className="h-3.5 w-3.5" />}
                  onClick={() => handleSubmit(true)}
                  loading={isPending}
                  disabled={overallPct === 0}
                >
                  Finalize Score
                </Button>
              </>
            )}
            {isLocked && (
              <>
                <Badge variant="stable">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Finalized
                </Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Brain className="h-3.5 w-3.5" />}
                  onClick={handleGenerateNarrative}
                  loading={isGeneratingNarrative}
                >
                  Generate AAR
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="flex-1 p-4 md:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Score summary sidebar */}
          <div className="xl:col-span-1 space-y-4">
            {/* Overall score */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card variant={overallPct >= 75 ? "stable" : overallPct >= 60 ? "alert" : overallPct > 0 ? "critical" : "default"}>
                <CardContent className="p-5 text-center">
                  <p className="text-[10px] text-[#4a5370] uppercase tracking-wider mb-2">Overall Score</p>
                  <p className={cn("text-5xl font-black leading-none mb-1", getScoreColor(overallPct))}>
                    {overallPct}%
                  </p>
                  <p className="text-xs text-[#6b7594] mb-2">{totalEarned} / {totalMaxPoints} pts</p>
                  <Badge variant={getScoreVariant(overallPct)}>
                    {overallPct >= 90 ? "Excellent" : overallPct >= 75 ? "Pass" : overallPct >= 60 ? "Marginal" : "Fail"}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>

            {/* Dimension breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xs">By Dimension</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {dimensionScores.map((d) => (
                  <div key={d.dimension}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-[#6b7594] truncate">{d.label}</span>
                      <span className={cn("text-[11px] font-mono font-semibold", getScoreColor(d.pct))}>
                        {d.pct}%
                      </span>
                    </div>
                    <Progress
                      value={d.pct}
                      size="sm"
                      variant={d.pct >= 75 ? "stable" : d.pct >= 60 ? "default" : "critical"}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Critical failures */}
            {criticalItemsFailed.length > 0 && (
              <Card variant="critical">
                <CardHeader>
                  <CardTitle className="text-xs text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Critical Failures ({criticalItemsFailed.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {criticalItemsFailed.map((item) => (
                    <p key={item.id} className="text-[11px] text-red-300 leading-snug">
                      · {DIMENSION_LABELS[item.dimension] ?? item.dimension}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Run metadata */}
            <Card>
              <CardContent className="p-4 space-y-2">
                {[
                  { label: "Duration", value: run.clock_seconds > 0 ? formatDuration(run.clock_seconds) : "—", icon: Clock },
                  { label: "Audience", value: scenario.audience, icon: Target },
                  { label: "Complexity", value: scenario.complexity, icon: Activity },
                  { label: "Casualties", value: String(scenario.casualty_count), icon: Activity },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[10px] text-[#4a5370] uppercase tracking-wider">{label}</span>
                    <span className="text-xs text-[#9daabf] capitalize font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main grading area */}
          <div className="xl:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="rubric">
                  <Star className="h-3.5 w-3.5 mr-1.5" />
                  Rubric
                </TabsTrigger>
                <TabsTrigger value="interventions">
                  <Activity className="h-3.5 w-3.5 mr-1.5" />
                  Interventions ({interventions.length})
                </TabsTrigger>
                {objectives && objectives.length > 0 && (
                  <TabsTrigger value="objectives">
                    <Target className="h-3.5 w-3.5 mr-1.5" />
                    Objectives
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Rubric tab */}
              <TabsContent value="rubric" className="mt-4 space-y-3">
                {isLocked && (
                  <div className="flex items-center gap-2 rounded-lg border border-blue-800/30 bg-blue-950/10 px-4 py-2.5">
                    <Lock className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <p className="text-xs text-blue-300">
                      This score has been finalized. Scores are read-only.
                    </p>
                  </div>
                )}

                {items.map((item, index) => {
                  const entry = scores[item.id] ?? { points: 0, note: "" }
                  const pct = item.max_points > 0 ? Math.round((entry.points / item.max_points) * 100) : 0

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className={cn(
                        item.is_critical && entry.points < item.max_points * 0.5 && !isLocked
                          ? "border-red-800/50"
                          : ""
                      )}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" size="sm">
                                  {DIMENSION_LABELS[item.dimension] ?? item.dimension}
                                </Badge>
                                {item.is_critical && (
                                  <Badge variant="critical" size="sm">
                                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                    Critical
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-[#d3dce8] leading-snug">{item.criterion}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className={cn("text-lg font-bold", getScoreColor(pct))}>
                                {entry.points}
                                <span className="text-xs text-[#4a5370] font-normal">/{item.max_points}</span>
                              </p>
                              <p className="text-[10px] text-[#4a5370]">{pct}%</p>
                            </div>
                          </div>

                          {/* Points selector */}
                          {!isLocked && (
                            <div className="flex items-center gap-2 flex-wrap mb-3">
                              {Array.from({ length: item.max_points + 1 }, (_, i) => i).map((pts) => (
                                <button
                                  key={pts}
                                  onClick={() => setItemPoints(item.id, pts)}
                                  className={cn(
                                    "h-8 min-w-8 px-2 rounded-md text-xs font-semibold border transition-all",
                                    entry.points === pts
                                      ? pts === item.max_points
                                        ? "bg-green-600 border-green-500 text-white"
                                        : pts === 0
                                          ? "bg-red-700 border-red-600 text-white"
                                          : "bg-amber-600 border-amber-500 text-white"
                                      : "border-[#2d3347] text-[#4a5370] hover:border-[#4a5370] hover:text-[#9daabf]"
                                  )}
                                >
                                  {pts}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Quick shortcuts for large max_points */}
                          {!isLocked && item.max_points > 10 && (
                            <div className="flex items-center gap-2 mb-3">
                              {[0, Math.round(item.max_points * 0.5), Math.round(item.max_points * 0.75), item.max_points].map((pts) => (
                                <button
                                  key={pts}
                                  onClick={() => setItemPoints(item.id, pts)}
                                  className={cn(
                                    "px-3 py-1 rounded text-xs border transition-all",
                                    entry.points === pts
                                      ? "bg-blue-600 border-blue-500 text-white"
                                      : "border-[#2d3347] text-[#4a5370] hover:border-[#4a5370]"
                                  )}
                                >
                                  {pts === 0 ? "0 (Fail)" :
                                   pts === item.max_points ? "Full" :
                                   `${pts} pts`}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Proctor note */}
                          {!isLocked ? (
                            <Textarea
                              placeholder="Proctor note (optional)..."
                              value={entry.note}
                              onChange={(e) => setItemNote(item.id, e.target.value)}
                              className="text-xs min-h-[52px] resize-none"
                            />
                          ) : entry.note ? (
                            <p className="text-xs text-[#6b7594] italic border-l-2 border-[#2d3347] pl-3">
                              {entry.note}
                            </p>
                          ) : null}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}

                {/* Global notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-400" />
                      Overall Proctor Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Overall observations, context, and recommendations for this run..."
                      value={globalNotes}
                      onChange={(e) => setGlobalNotes(e.target.value)}
                      disabled={isLocked}
                      className="min-h-[100px]"
                    />
                  </CardContent>
                </Card>

                {!isLocked && (
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="secondary"
                      leftIcon={<Save className="h-3.5 w-3.5" />}
                      onClick={() => handleSubmit(false)}
                      loading={isPending}
                    >
                      Save Draft
                    </Button>
                    <Button
                      leftIcon={<Send className="h-3.5 w-3.5" />}
                      onClick={() => handleSubmit(true)}
                      loading={isPending}
                      disabled={overallPct === 0}
                    >
                      Finalize Score
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Interventions tab */}
              <TabsContent value="interventions" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    {interventions.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#4a5370]">No interventions logged</div>
                    ) : (
                      <div className="divide-y divide-[#1e2330]">
                        {interventions.map((iv) => {
                          const mins = Math.floor(iv.elapsed_seconds / 60)
                          const secs = iv.elapsed_seconds % 60
                          return (
                            <div key={iv.id} className="flex items-start gap-4 px-5 py-3">
                              <span className="text-xs font-mono text-[#4a5370] w-12 shrink-0 mt-0.5">
                                T+{mins}:{String(secs).padStart(2, "0")}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[#d3dce8]">
                                  {iv.action_type.replace(/_/g, " ")}
                                </p>
                                {iv.raw_text && (
                                  <p className="text-[11px] text-[#4a5370] italic mt-0.5">"{iv.raw_text}"</p>
                                )}
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                {iv.confidence_score < 0.7 && (
                                  <Badge variant="warning" size="sm">Low confidence</Badge>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Objectives tab */}
              {objectives && objectives.length > 0 && (
                <TabsContent value="objectives" className="mt-4 space-y-2">
                  {objectives!.map((obj, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-[#1e2330] px-4 py-3">
                      <Target className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-[#9daabf]">{obj}</p>
                    </div>
                  ))}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
