"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText, Clock, Award, CheckCircle2, AlertTriangle, ChevronRight,
  Search, Download, Printer, BarChart2, Users, Calendar, Target,
  TrendingUp, TrendingDown, Minus, RefreshCw, Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Header } from "@/components/layout/header"
import { cn, formatRelativeTime, formatDuration } from "@/lib/utils"
import { toast } from "sonner"

interface Report {
  id: string
  status: string
  title: string
  summary: string | null
  ai_narrative: string | null
  strengths: string[] | null
  failures: string[] | null
  remediation_plan: Record<string, unknown> | null
  created_at: string
  scenario_runs?: {
    id: string
    status: string
    clock_seconds: number
    created_at: string
    scenarios?: {
      title: string
      complexity: string
      audience: string
      environment: string
    } | null
  } | null
}

interface Score {
  run_id: string
  percentage: number
  dimension_scores: unknown
  created_at: string
}

interface ReportsClientProps {
  reports: Report[]
  scores: Score[]
}

const SCORE_THRESHOLDS = {
  excellent: 90,
  pass: 75,
  marginal: 60,
}

function getScoreVariant(pct: number): "stable" | "warning" | "critical" | "secondary" {
  if (pct >= SCORE_THRESHOLDS.pass) return "stable"
  if (pct >= SCORE_THRESHOLDS.marginal) return "warning"
  if (pct > 0) return "critical"
  return "secondary"
}

function ScoreTrend({ current, previous }: { current: number; previous?: number }) {
  if (!previous) return <Minus className="h-3.5 w-3.5 text-[#4a5370]" />
  const delta = current - previous
  if (delta > 3) return <TrendingUp className="h-3.5 w-3.5 text-green-400" />
  if (delta < -3) return <TrendingDown className="h-3.5 w-3.5 text-red-400" />
  return <Minus className="h-3.5 w-3.5 text-[#4a5370]" />
}

export function ReportsClient({ reports, scores }: ReportsClientProps) {
  const [search, setSearch] = useState("")
  const [selectedReport, setSelectedReport] = useState<Report | null>(reports[0] ?? null)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const scoresByRun = useMemo(() => {
    const map: Record<string, Score> = {}
    scores.forEach((s) => { map[s.run_id] = s })
    return map
  }, [scores])

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const title = r.scenario_runs?.scenarios?.title?.toLowerCase() ?? ""
      const matchesSearch = !search || title.includes(search.toLowerCase())
      const matchesFilter = filterStatus === "all" || r.status === filterStatus
      return matchesSearch && matchesFilter
    })
  }, [reports, search, filterStatus])

  const selectedScore = selectedReport?.scenario_runs?.id
    ? scoresByRun[selectedReport.scenario_runs.id]
    : undefined

  const dimensionScores = useMemo(() => {
    if (!selectedScore) return []
    const dims = selectedScore.dimension_scores as Record<string, number> | null
    if (!dims) return []
    return Object.entries(dims)
      .map(([key, value]) => ({
        key,
        label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value,
      }))
      .sort((a, b) => b.value - a.value)
  }, [selectedScore])

  const handleExport = (format: "pdf" | "json") => {
    if (!selectedReport) return
    if (format === "json") {
      const blob = new Blob([JSON.stringify(selectedReport, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const title = selectedReport.scenario_runs?.scenarios?.title ?? "report"
      a.href = url
      a.download = `aar-${title.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Report exported as JSON")
    } else {
      window.print()
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="After Action Reports"
        subtitle="Debrief, scoring, and performance review"
        actions={
          selectedReport && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Download className="h-3.5 w-3.5" />}
                onClick={() => handleExport("json")}
              >
                Export JSON
              </Button>
              <Button
                size="sm"
                leftIcon={<Printer className="h-3.5 w-3.5" />}
                onClick={() => handleExport("pdf")}
              >
                Print / PDF
              </Button>
            </div>
          )
        }
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Report list */}
        <div className="w-full md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-[#1e2330] flex flex-col max-h-[40vh] md:max-h-none">
          <div className="p-4 border-b border-[#1e2330] space-y-3">
            <Input
              placeholder="Search reports..."
              leftElement={<Search className="h-3.5 w-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex gap-1.5">
              {["all", "draft", "final"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors",
                    filterStatus === f
                      ? "bg-blue-600 text-white"
                      : "text-[#6b7594] hover:text-[#9daabf] hover:bg-[#1e2330]"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#4a5370]">
                No reports found
              </div>
            ) : (
              <div className="divide-y divide-[#1e2330]">
                {filtered.map((report) => {
                  const score = report.scenario_runs?.id ? scoresByRun[report.scenario_runs.id] : undefined
                  const scenario = report.scenario_runs?.scenarios
                  const isSelected = selectedReport?.id === report.id
                  return (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={cn(
                        "w-full text-left px-4 py-3.5 transition-colors",
                        isSelected ? "bg-[#131720] border-l-2 border-l-blue-500" : "hover:bg-[#0d0f14]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold text-[#d3dce8] truncate">
                          {scenario?.title ?? "Untitled Run"}
                        </p>
                        {score && (
                          <Badge variant={getScoreVariant(score.percentage)} size="sm">
                            {Math.round(score.percentage)}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-[#4a5370] capitalize">
                        {scenario?.audience} · {scenario?.complexity} · {formatRelativeTime(report.created_at)}
                      </p>
                      {report.scenario_runs?.clock_seconds != null && report.scenario_runs.clock_seconds > 0 && (
                        <p className="text-[10px] text-[#3e465e] font-mono mt-0.5">
                          {formatDuration(report.scenario_runs.clock_seconds)}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right: Report detail */}
        <div className="flex-1 overflow-auto">
          {!selectedReport ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-14 w-14 rounded-2xl bg-[#1e2330] border border-[#2d3347] flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-[#4a5370]" />
              </div>
              <h3 className="text-base font-semibold text-[#f0f4ff] mb-2">No report selected</h3>
              <p className="text-sm text-[#6b7594] max-w-xs">
                Select a report from the list to view the after action review.
              </p>
            </div>
          ) : (
            <AARReportDetail
              report={selectedReport}
              score={selectedScore}
              dimensionScores={dimensionScores}
            />
          )}
        </div>
      </div>
    </div>
  )
}

interface DimensionScore { key: string; label: string; value: number }

function AARReportDetail({
  report,
  score,
  dimensionScores,
}: {
  report: Report
  score?: Score
  dimensionScores: DimensionScore[]
}) {
  const scenario = report.scenario_runs?.scenarios
  const run = report.scenario_runs

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Report header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-[10px] text-[#4a5370] uppercase tracking-wider font-semibold mb-1">
              After Action Report
            </p>
            <h1 className="text-2xl font-bold text-[#f0f4ff]">
              {scenario?.title ?? "Untitled Scenario"}
            </h1>
            <p className="text-sm text-[#6b7594] mt-1 capitalize">
              {scenario?.audience} · {scenario?.environment} · {scenario?.complexity}
            </p>
          </div>
          <Badge
            variant={report.status === "final" ? "stable" : "secondary"}
            size="sm"
          >
            {report.status}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[#4a5370] mt-3">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatRelativeTime(report.created_at)}
          </span>
          {run?.clock_seconds != null && run.clock_seconds > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Duration: {formatDuration(run.clock_seconds)}
            </span>
          )}
          {score && (
            <span className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              Score: {Math.round(score.percentage)}%
            </span>
          )}
        </div>
      </motion.div>

      <Separator />

      {/* Score summary */}
      {score && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h2 className="text-sm font-semibold text-[#d3dce8] mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-400" />
            Performance Score
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Card variant={score.percentage >= 75 ? "stable" : score.percentage >= 60 ? "alert" : "critical"}>
              <CardContent className="p-5 text-center">
                <p className="text-4xl font-black text-[#f0f4ff] mb-1">{Math.round(score.percentage)}%</p>
                <p className="text-xs text-[#9daabf]">Overall Score</p>
                <Badge
                  variant={getScoreVariant(score.percentage)}
                  className="mt-2"
                >
                  {score.percentage >= SCORE_THRESHOLDS.excellent ? "Excellent" :
                   score.percentage >= SCORE_THRESHOLDS.pass ? "Pass" :
                   score.percentage >= SCORE_THRESHOLDS.marginal ? "Marginal" : "Fail"}
                </Badge>
              </CardContent>
            </Card>

            <div className="sm:col-span-2 space-y-2">
              {dimensionScores.map((d) => (
                <div key={d.key} className="flex items-center gap-3">
                  <span className="text-[11px] text-[#6b7594] w-32 shrink-0 truncate">{d.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#1e2330] overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        d.value >= 80 ? "bg-green-500" : d.value >= 60 ? "bg-amber-500" : "bg-red-500"
                      )}
                      style={{ width: `${d.value}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-[#9daabf] w-8 text-right">{Math.round(d.value)}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {score && <Separator />}

      {/* Narrative */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-sm font-semibold text-[#d3dce8] mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-400" />
          Executive Summary
        </h2>

        {report.status === "generating" ? (
          <div className="rounded-xl border border-dashed border-[#2d3347] bg-[#0d0f14] p-8 text-center">
            <RefreshCw className="h-8 w-8 text-[#4a5370] mx-auto mb-3 animate-spin" />
            <p className="text-sm font-medium text-[#9daabf] mb-1">Generating AAR narrative…</p>
            <p className="text-xs text-[#4a5370] max-w-sm mx-auto">
              The AI is writing a doctrine-grounded debrief. This usually takes under 30 seconds.
            </p>
          </div>
        ) : !report.ai_narrative && !report.summary ? (
          <div className="rounded-xl border border-dashed border-[#2d3347] bg-[#0d0f14] p-8 text-center">
            <RefreshCw className="h-8 w-8 text-[#4a5370] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#9daabf] mb-1">AAR narrative not yet generated</p>
            <p className="text-xs text-[#4a5370] mb-4 max-w-sm mx-auto">
              Complete grading for this run, then generate a doctrine-grounded AAR narrative.
            </p>
            <GenerateNarrativeButton reportId={report.id} />
          </div>
        ) : (
          <div className="space-y-4">
            {report.summary && (
              <div className="rounded-xl border border-[#1e2330] bg-[#0d0f14] p-5">
                <p className="text-xs text-[#9daabf] leading-relaxed">{report.summary}</p>
              </div>
            )}

            {(report.strengths?.length ?? 0) > 0 && (
              <NarrativeSection
                title="Strengths Observed"
                icon={<CheckCircle2 className="h-4 w-4 text-green-400" />}
                items={report.strengths ?? []}
                variant="stable"
              />
            )}

            {(report.failures?.length ?? 0) > 0 && (
              <NarrativeSection
                title="Areas for Improvement"
                icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
                items={report.failures ?? []}
                variant="alert"
              />
            )}

            {report.ai_narrative && (
              <div className="rounded-xl border border-[#1e2330] bg-[#0d0f14] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-[#d3dce8]">Detailed Narrative</h3>
                </div>
                <p className="text-xs text-[#6b7594] leading-relaxed whitespace-pre-line">
                  {report.ai_narrative}
                </p>
              </div>
            )}

            {report.remediation_plan && Object.keys(report.remediation_plan).length > 0 && (
              <div className="rounded-xl border border-[#1e2330] bg-[#0d0f14] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-[#d3dce8]">Remediation Plan</h3>
                </div>
                {Object.entries(report.remediation_plan).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <p className="text-[11px] font-semibold text-[#9daabf] capitalize mb-0.5">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-[#6b7594]">{String(value)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}

function NarrativeSection({
  title,
  icon,
  items,
  variant,
}: {
  title: string
  icon: React.ReactNode
  items: string[]
  variant: "stable" | "alert" | "default"
}) {
  const styles = {
    stable: "border-green-800/30 bg-green-950/10",
    alert: "border-amber-800/30 bg-amber-950/10",
    default: "border-[#1e2330] bg-[#0d0f14]",
  }

  return (
    <div className={cn("rounded-xl border p-5", styles[variant])}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-[#d3dce8]">{title}</h3>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-[#6b7594] leading-relaxed flex items-start gap-2">
            <span className="text-[#2d3347] mt-0.5 shrink-0">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function GenerateNarrativeButton({ reportId }: { reportId: string }) {
  const [loading, setLoading] = React.useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/generate-aar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to generate AAR")
        return
      }
      toast.success("AAR narrative generated — refresh to view")
    } catch {
      toast.error("Failed to generate AAR narrative")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      loading={loading}
      leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
      onClick={handleGenerate}
    >
      Generate AAR Narrative
    </Button>
  )
}
