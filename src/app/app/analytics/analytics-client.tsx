"use client"

import React, { useMemo } from "react"
import { motion } from "framer-motion"
import {
  BarChart3, TrendingUp, Target, Users, Clock, Award,
  Activity, ChevronRight, Calendar, AlertTriangle
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, PieChart, Pie
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Header } from "@/components/layout/header"
import { formatDuration, formatRelativeTime } from "@/lib/utils"

interface AnalyticsDashboardProps {
  runs: Array<{
    id: string
    status: string
    clock_seconds: number
    created_at: string
    scenarios?: { title: string; complexity: string; audience: string } | null
  }>
  scores: Array<{ percentage: number; dimension_scores: unknown; created_at: string }>
  scenarios: Array<{ id: string; audience: string; complexity: string; scenario_type: string }>
  totalRuns: number
}

const CHART_COLORS = {
  primary: "#2563eb",
  critical: "#e53e3e",
  stable: "#22c55e",
  alert: "#f59e0b",
  intel: "#06b6d4",
  muted: "#4a5370",
}

export function AnalyticsDashboard({ runs, scores, scenarios, totalRuns }: AnalyticsDashboardProps) {
  const avgScore = useMemo(() => {
    if (!scores.length) return 0
    return Math.round(scores.reduce((s, r) => s + r.percentage, 0) / scores.length)
  }, [scores])

  const avgDuration = useMemo(() => {
    const completed = runs.filter((r) => r.status === "completed" && r.clock_seconds > 0)
    if (!completed.length) return 0
    return Math.round(completed.reduce((s, r) => s + r.clock_seconds, 0) / completed.length)
  }, [runs])

  // Score trend over time
  const scoreTrend = useMemo(() => {
    return scores.slice(0, 12).reverse().map((s, i) => ({
      run: `#${i + 1}`,
      score: Math.round(s.percentage),
    }))
  }, [scores])

  // Complexity distribution
  const complexityDist = useMemo(() => {
    const counts: Record<string, number> = {}
    scenarios.forEach((s) => {
      counts[s.complexity] = (counts[s.complexity] ?? 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [scenarios])

  // Audience distribution
  const audienceDist = useMemo(() => {
    const counts: Record<string, number> = {}
    scenarios.forEach((s) => {
      counts[s.audience] = (counts[s.audience] ?? 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [scenarios])

  // Dimension scores radar
  const dimensionRadar = useMemo(() => {
    if (!scores.length) return []
    const totals: Record<string, { sum: number; count: number }> = {}
    scores.forEach((s) => {
      const dims = s.dimension_scores as Record<string, number> | null
      if (!dims) return
      Object.entries(dims).forEach(([k, v]) => {
        if (!totals[k]) totals[k] = { sum: 0, count: 0 }
        totals[k].sum += v
        totals[k].count += 1
      })
    })
    return Object.entries(totals).map(([key, { sum, count }]) => ({
      subject: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      avg: Math.round(sum / count),
    }))
  }, [scores])

  const statsCards = [
    {
      label: "Total Runs",
      value: totalRuns,
      icon: Activity,
      color: "text-blue-400",
      change: "+12%",
      positive: true,
    },
    {
      label: "Avg. Score",
      value: `${avgScore}%`,
      icon: Award,
      color: avgScore >= 80 ? "text-green-400" : avgScore >= 60 ? "text-amber-400" : "text-red-400",
      change: "+5%",
      positive: true,
    },
    {
      label: "Total Scenarios",
      value: scenarios.length,
      icon: Target,
      color: "text-cyan-400",
      change: "+3 this week",
      positive: true,
    },
    {
      label: "Avg. Duration",
      value: avgDuration > 0 ? formatDuration(avgDuration) : "—",
      icon: Clock,
      color: "text-amber-400",
      change: "—",
      positive: null,
    },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Analytics" subtitle="Training performance and trends" />

      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {statsCards.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] text-[#4a5370] uppercase tracking-wider font-semibold mb-1">{s.label}</p>
                        <p className="text-2xl font-bold text-[#f0f4ff] leading-none">{s.value}</p>
                        <p className={`text-xs mt-1 ${s.positive === true ? "text-green-400" : s.positive === false ? "text-red-400" : "text-[#4a5370]"}`}>
                          {s.change}
                        </p>
                      </div>
                      <Icon className={`h-5 w-5 ${s.color} opacity-70`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <Tabs defaultValue="performance">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Score trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Score Trend</CardTitle>
                  <CardDescription className="text-xs">Average score per run — most recent {scoreTrend.length}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={scoreTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="scoreArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.stable} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={CHART_COLORS.stable} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" />
                        <XAxis dataKey="run" tick={{ fill: "#4a5370", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: "#4a5370", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "#1e2330", border: "1px solid #2d3347", borderRadius: "8px", color: "#f0f4ff", fontSize: "12px" }}
                          formatter={(v) => [`${v}%`, "Score"]}
                        />
                        <Area type="monotone" dataKey="score" stroke={CHART_COLORS.stable} strokeWidth={2} fill="url(#scoreArea)" dot={{ fill: CHART_COLORS.stable, r: 3 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  {avgScore > 0 && (
                    <div className={`mt-3 flex items-center gap-2 text-xs font-medium ${avgScore >= 80 ? "text-green-400" : avgScore >= 60 ? "text-amber-400" : "text-red-400"}`}>
                      <TrendingUp className="h-3.5 w-3.5" />
                      Overall average: {avgScore}% — {avgScore >= 80 ? "Above standard" : avgScore >= 60 ? "Below standard" : "Needs improvement"}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent runs table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recent Runs</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {runs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#4a5370]">No runs yet</div>
                  ) : (
                    <div className="divide-y divide-[#1e2330]">
                      {runs.slice(0, 8).map((run) => (
                        <div key={run.id} className="flex items-center gap-3 px-5 py-2.5">
                          <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                            run.status === "completed" ? "bg-green-500" :
                            run.status === "active" ? "bg-red-500 animate-pulse" :
                            "bg-[#4a5370]"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#d3dce8] truncate">
                              {(run.scenarios as { title: string } | null)?.title ?? "Unnamed Run"}
                            </p>
                            <p className="text-[10px] text-[#3e465e]">{formatRelativeTime(run.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-[11px]">
                            {run.clock_seconds > 0 && (
                              <span className="text-[#6b7594] font-mono">{formatDuration(run.clock_seconds)}</span>
                            )}
                            <Badge
                              variant={run.status === "completed" ? "stable" : run.status === "active" ? "critical" : "secondary"}
                              size="sm"
                            >
                              {run.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="mt-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Complexity bar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Scenarios by Complexity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={complexityDist} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" />
                        <XAxis dataKey="name" tick={{ fill: "#4a5370", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#4a5370", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#1e2330", border: "1px solid #2d3347", borderRadius: "8px", color: "#f0f4ff", fontSize: "12px" }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {complexityDist.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={entry.name === "expert" ? CHART_COLORS.critical :
                                    entry.name === "advanced" ? "#f97316" :
                                    entry.name === "intermediate" ? CHART_COLORS.alert :
                                    CHART_COLORS.stable}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Audience pie */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Scenarios by Audience</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={audienceDist}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {audienceDist.map((entry, i) => (
                            <Cell
                              key={entry.name}
                              fill={[CHART_COLORS.primary, CHART_COLORS.alert, CHART_COLORS.stable][i % 3]}
                            />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#1e2330", border: "1px solid #2d3347", borderRadius: "8px", color: "#f0f4ff", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center mt-2">
                    {audienceDist.map((entry, i) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ background: [CHART_COLORS.primary, CHART_COLORS.alert, CHART_COLORS.stable][i % 3] }} />
                        <span className="text-[11px] text-[#9daabf] capitalize">{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dimensions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Average Score by Dimension</CardTitle>
                <CardDescription className="text-xs">Across all scored runs — identifies training gaps</CardDescription>
              </CardHeader>
              <CardContent>
                {dimensionRadar.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={dimensionRadar}>
                        <PolarGrid stroke="#1e2330" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7594", fontSize: 11 }} />
                        <Radar dataKey="avg" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.15} />
                        <Tooltip contentStyle={{ background: "#1e2330", border: "1px solid #2d3347", borderRadius: "8px", color: "#f0f4ff", fontSize: "12px" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#4a5370]">
                    No scored runs yet — run and grade a scenario to see dimension analysis
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
