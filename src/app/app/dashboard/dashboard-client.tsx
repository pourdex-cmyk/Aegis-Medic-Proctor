"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Target, Users, BookOpen, FileText, BarChart3, Activity,
  Play, Plus, ArrowRight, Clock, Shield, Zap, TrendingUp,
  AlertTriangle, CheckCircle2, Calendar, ChevronRight, Layers,
  Radio, UserCheck, Award
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { formatRelativeTime, formatDate } from "@/lib/utils"
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

// Sample chart data — replace with real aggregated data
const activityData = [
  { day: "Mon", runs: 2, casualties: 6 },
  { day: "Tue", runs: 4, casualties: 12 },
  { day: "Wed", runs: 1, casualties: 3 },
  { day: "Thu", runs: 5, casualties: 18 },
  { day: "Fri", runs: 3, casualties: 9 },
  { day: "Sat", runs: 6, casualties: 22 },
  { day: "Sun", runs: 2, casualties: 7 },
]

const scoreData = [
  { week: "W1", avg: 72 },
  { week: "W2", avg: 75 },
  { week: "W3", avg: 68 },
  { week: "W4", avg: 81 },
  { week: "W5", avg: 79 },
  { week: "W6", avg: 84 },
]

interface DashboardClientProps {
  user: { display_name: string; email: string; avatar_url?: string | null } | null
  member: { role?: string; organizations?: { name: string; type: string } | unknown } | null
  recentRuns: Array<{
    id: string
    status: string
    created_at: string
    clock_seconds: number
    scenarios?: { title: string; environment: string; complexity: string }
  }>
  recentScenarios: Array<{
    id: string
    title: string
    environment: string
    complexity: string
    casualty_count: number
    created_at: string
    status: string
    audience: string
  }>
  totalScenarios: number
  activeRuns: number
  recentAudit: Array<{
    id: string
    action: string
    resource_type: string
    description: string
    created_at: string
    actor_display_name?: string | null
  }>
}

const complexityColors: Record<string, string> = {
  basic: "text-green-400",
  intermediate: "text-amber-400",
  advanced: "text-orange-400",
  expert: "text-red-400",
}

const statusBadge = (status: string) => {
  if (status === "active") return <Badge variant="stable" dot>Active</Badge>
  if (status === "completed") return <Badge variant="secondary" dot>Completed</Badge>
  if (status === "paused") return <Badge variant="warning" dot>Paused</Badge>
  if (status === "ready") return <Badge variant="default" dot>Ready</Badge>
  return <Badge variant="secondary">{status}</Badge>
}

export function DashboardClient({
  user, member, recentRuns, recentScenarios,
  totalScenarios, activeRuns, recentAudit,
}: DashboardClientProps) {
  const orgName = (member?.organizations as { name: string } | undefined)?.name

  const statsCards = [
    {
      label: "Total Scenarios",
      value: totalScenarios,
      icon: Target,
      color: "text-blue-400",
      bg: "bg-blue-950/30",
      border: "border-blue-800/40",
      href: "/app/scenarios",
    },
    {
      label: "Active Runs",
      value: activeRuns,
      icon: Activity,
      color: "text-red-400",
      bg: "bg-red-950/30",
      border: "border-red-800/40",
      href: "/app/scenarios",
      pulse: activeRuns > 0,
    },
    {
      label: "Doctrine Packs",
      value: 3,
      icon: BookOpen,
      color: "text-cyan-400",
      bg: "bg-cyan-950/30",
      border: "border-cyan-800/40",
      href: "/app/doctrine",
    },
    {
      label: "Reports Generated",
      value: 12,
      icon: FileText,
      color: "text-green-400",
      bg: "bg-green-950/30",
      border: "border-green-800/40",
      href: "/app/reports",
    },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Operations Center"
        subtitle={orgName ?? "Dashboard"}
        user={user ? {
          display_name: user.display_name,
          email: user.email,
          avatar_url: user.avatar_url ?? undefined,
          role: member?.role as string | undefined,
        } : undefined}
        orgName={orgName}
        activeRunId={activeRuns > 0 ? "active" : undefined}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Welcome bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-xl font-bold text-[#f0f4ff] tracking-tight">
              Welcome back, {user?.display_name?.split(" ")[0] ?? "Operator"}
            </h2>
            <p className="text-sm text-[#6b7594] mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              {orgName && ` · ${orgName}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/app/scenarios/new">
              <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
                New Scenario
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Play className="h-3.5 w-3.5 text-green-400" />}
            >
              Quick Launch
            </Button>
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06, ease: [0.25, 1, 0.5, 1] }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statsCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.label} href={stat.href}>
                <Card
                  variant="default"
                  hoverable
                  pressable
                  className={`border ${stat.border} ${stat.bg} transition-all duration-200`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-2xl font-bold text-[#f0f4ff] leading-none mb-1">
                          {stat.value}
                        </p>
                        <p className="text-xs text-[#6b7594]">{stat.label}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${stat.bg} border ${stat.border}`}>
                        <Icon className={`h-4 w-4 ${stat.color} ${stat.pulse ? "animate-pulse" : ""}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </motion.div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Activity chart + recent scenarios */}
          <div className="xl:col-span-2 space-y-6">
            {/* Activity chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12, ease: [0.25, 1, 0.5, 1] }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">Training Activity</CardTitle>
                      <CardDescription className="text-xs">Runs and casualties this week</CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">Last 7 days</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                        <defs>
                          <linearGradient id="runsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="casualtiesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#e53e3e" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="#e53e3e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="day"
                          tick={{ fill: "#4a5370", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#4a5370", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#1e2330",
                            border: "1px solid #2d3347",
                            borderRadius: "8px",
                            color: "#f0f4ff",
                            fontSize: "12px",
                          }}
                          cursor={{ stroke: "#2d3347", strokeWidth: 1 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="runs"
                          name="Runs"
                          stroke="#2563eb"
                          strokeWidth={2}
                          fill="url(#runsGrad)"
                          dot={false}
                        />
                        <Area
                          type="monotone"
                          dataKey="casualties"
                          name="Casualties"
                          stroke="#e53e3e"
                          strokeWidth={2}
                          fill="url(#casualtiesGrad)"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent scenarios */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18, ease: [0.25, 1, 0.5, 1] }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Recent Scenarios</CardTitle>
                    <Link href="/app/scenarios">
                      <Button variant="ghost" size="xs" rightIcon={<ChevronRight className="h-3 w-3" />}>
                        View all
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {recentScenarios.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                      <div className="h-10 w-10 rounded-full bg-[#1e2330] flex items-center justify-center mb-3">
                        <Target className="h-5 w-5 text-[#4a5370]" />
                      </div>
                      <p className="text-sm font-medium text-[#6b7594]">No scenarios yet</p>
                      <p className="text-xs text-[#3e465e] mt-1">Create your first training scenario to get started</p>
                      <Link href="/app/scenarios/new" className="mt-4">
                        <Button size="sm" variant="secondary">Create Scenario</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#1e2330]">
                      {recentScenarios.map((s) => (
                        <Link key={s.id} href={`/app/scenarios/${s.id}`}>
                          <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#0f1117] transition-colors cursor-pointer group">
                            <div className="h-8 w-8 rounded-lg bg-[#1a2444] border border-blue-800/40 flex items-center justify-center flex-shrink-0">
                              <Target className="h-3.5 w-3.5 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#d3dce8] truncate group-hover:text-[#f0f4ff] transition-colors">
                                {s.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-[#4a5370]">{s.environment}</span>
                                <span className="text-[#2d3347]">·</span>
                                <span className={`text-[11px] font-medium ${complexityColors[s.complexity]}`}>
                                  {s.complexity}
                                </span>
                                <span className="text-[#2d3347]">·</span>
                                <span className="text-[11px] text-[#4a5370]">{s.casualty_count} casualties</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {statusBadge(s.status)}
                              <ArrowRight className="h-3.5 w-3.5 text-[#353c52] group-hover:text-[#6b7594] transition-colors" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right: Recent runs, score trend, audit */}
          <div className="space-y-6">
            {/* Score trend */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.14, ease: [0.25, 1, 0.5, 1] }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Avg. Score Trend</CardTitle>
                  <CardDescription className="text-xs">6-week performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={scoreData} margin={{ top: 2, right: 0, left: -28, bottom: 0 }}>
                        <defs>
                          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="week" tick={{ fill: "#4a5370", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[50, 100]} tick={{ fill: "#4a5370", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "#1e2330", border: "1px solid #2d3347", borderRadius: "8px", color: "#f0f4ff", fontSize: "11px" }}
                          cursor={{ stroke: "#2d3347", strokeWidth: 1 }}
                          formatter={(v) => [`${v}%`, "Avg Score"]}
                        />
                        <Area type="monotone" dataKey="avg" stroke="#22c55e" strokeWidth={2} fill="url(#scoreGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1e2330]">
                    <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">+12% vs. previous period</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent runs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Recent Runs</CardTitle>
                    <Badge variant={activeRuns > 0 ? "critical" : "secondary"} dot={activeRuns > 0}>
                      {activeRuns > 0 ? `${activeRuns} Live` : "None active"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {recentRuns.length === 0 ? (
                    <div className="py-8 text-center px-4">
                      <Radio className="h-5 w-5 text-[#353c52] mx-auto mb-2" />
                      <p className="text-xs text-[#4a5370]">No runs yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#1e2330]">
                      {recentRuns.map((run) => (
                        <Link key={run.id} href={`/app/scenarios/${run.scenarios ? "unknown" : "unknown"}/run`}>
                          <div className="px-5 py-3 hover:bg-[#0f1117] transition-colors cursor-pointer">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-[#d3dce8] truncate">
                                  {run.scenarios?.title ?? "Unnamed Run"}
                                </p>
                                <p className="text-[10px] text-[#4a5370] mt-0.5">
                                  {formatRelativeTime(run.created_at)}
                                </p>
                              </div>
                              {statusBadge(run.status)}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent activity */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.26, ease: [0.25, 1, 0.5, 1] }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {recentAudit.length === 0 ? (
                    <div className="py-8 text-center px-4">
                      <p className="text-xs text-[#4a5370]">No recent activity</p>
                    </div>
                  ) : (
                    <div className="px-5 space-y-3 pb-4">
                      {recentAudit.slice(0, 6).map((log) => (
                        <div key={log.id} className="flex items-start gap-2.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#2563eb] mt-1.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-[#9daabf] line-clamp-2">{log.description}</p>
                            <p className="text-[10px] text-[#3e465e] mt-0.5">
                              {log.actor_display_name && `${log.actor_display_name} · `}
                              {formatRelativeTime(log.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                {recentAudit.length > 0 && (
                  <CardFooter className="pt-2">
                    <Link href="/app/admin/audit" className="w-full">
                      <Button variant="ghost" size="xs" className="w-full" rightIcon={<ChevronRight className="h-3 w-3" />}>
                        View full audit log
                      </Button>
                    </Link>
                  </CardFooter>
                )}
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.32, ease: [0.25, 1, 0.5, 1] }}
        >
          <Card variant="accent">
            <CardContent className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
                    <Zap className="h-4.5 w-4.5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#f0f4ff]">Ready to run a scenario?</p>
                    <p className="text-xs text-[#6b7594]">Launch the AI generation wizard or pick an existing scenario</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href="/app/scenarios/new">
                    <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
                      Generate Scenario
                    </Button>
                  </Link>
                  <Link href="/app/scenarios">
                    <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                      Scenario Library
                    </Button>
                  </Link>
                  <Link href="/app/doctrine">
                    <Button variant="outline" size="sm" leftIcon={<BookOpen className="h-3.5 w-3.5" />}>
                      Doctrine Packs
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
