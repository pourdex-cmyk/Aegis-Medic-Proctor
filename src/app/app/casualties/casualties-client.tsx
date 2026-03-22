"use client"

import React, { useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  Search, User, Activity, Wind, Heart, Brain,
  Zap, Shield, AlertTriangle, CheckCircle, XCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { formatRelativeTime } from "@/lib/utils"

interface CasualtyProfile {
  id: string
  callsign: string
  display_label: string
  mechanism_of_injury: string
  triage_category: string
  airway_status: string
  breathing_status: string
  circulation_state: string
  neurologic_status: string
  pain_level: number
  visible_injuries: unknown
  ai_generated: boolean
  created_at: string
  scenario_id: string
}

interface ScenarioRef {
  id: string
  title: string
}

interface CasualtiesClientProps {
  casualties: CasualtyProfile[]
  scenarios: ScenarioRef[]
}

const triageConfig: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
  T1: {
    label: "T1 — Immediate",
    bg: "bg-red-950/40",
    border: "border-red-700/50",
    text: "text-red-400",
    dot: "bg-red-500",
  },
  T2: {
    label: "T2 — Delayed",
    bg: "bg-amber-950/40",
    border: "border-amber-700/50",
    text: "text-amber-400",
    dot: "bg-amber-500",
  },
  T3: {
    label: "T3 — Minimal",
    bg: "bg-green-950/40",
    border: "border-green-700/50",
    text: "text-green-400",
    dot: "bg-green-500",
  },
  T4: {
    label: "T4 — Expectant",
    bg: "bg-zinc-900/60",
    border: "border-zinc-700/50",
    text: "text-zinc-400",
    dot: "bg-zinc-600",
  },
}

const TRIAGE_FILTERS = ["All", "T1", "T2", "T3", "T4"] as const
const ORIGIN_FILTERS = ["All", "AI", "Manual"] as const

function PainBar({ level }: { level: number }) {
  const color =
    level >= 8 ? "bg-red-500" : level >= 5 ? "bg-amber-500" : "bg-green-500"
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-sm transition-colors ${i < level ? color : "bg-[#1e2330]"}`}
          />
        ))}
      </div>
      <span className="text-[10px] font-mono text-[#6b7594]">{level}/10</span>
    </div>
  )
}

function StatusPill({ label, value }: { label: string; value: string }) {
  const critical =
    value === "compromised" ||
    value === "absent" ||
    value === "hemorrhagic" ||
    value === "unresponsive" ||
    value === "unconscious"
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-[#4a5370] uppercase tracking-wider font-semibold">{label}</span>
      <span
        className={`text-[10px] font-medium ${critical ? "text-red-400" : "text-[#9daabf]"}`}
      >
        {value}
      </span>
    </div>
  )
}

function CasualtyCard({
  casualty,
  scenarioTitle,
  index,
}: {
  casualty: CasualtyProfile
  scenarioTitle: string | undefined
  index: number
}) {
  const triage = triageConfig[casualty.triage_category] ?? triageConfig.T4
  const injuries = Array.isArray(casualty.visible_injuries)
    ? (casualty.visible_injuries as string[])
    : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04, ease: [0.25, 1, 0.5, 1] }}
    >
      <Card hoverable className="group overflow-hidden">
        {/* Triage stripe */}
        <div className={`h-0.5 w-full ${triage.dot.replace("bg-", "bg-")}`} />

        <CardContent className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold border ${triage.bg} ${triage.border} ${triage.text}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${triage.dot}`} />
                {casualty.triage_category}
              </span>
              {casualty.ai_generated && (
                <Badge variant="intel" size="sm">AI</Badge>
              )}
            </div>
            <span className="text-[10px] text-[#3e465e] shrink-0">
              {formatRelativeTime(casualty.created_at)}
            </span>
          </div>

          {/* Callsign */}
          <p className="font-mono font-bold text-[#f0f4ff] text-base tracking-wider uppercase leading-tight">
            {casualty.callsign}
          </p>
          <p className="text-xs text-[#6b7594] mt-0.5 mb-3">{casualty.display_label}</p>

          {/* MOI */}
          <div className="flex items-start gap-1.5 mb-3">
            <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#9daabf] leading-snug line-clamp-2">
              {casualty.mechanism_of_injury}
            </p>
          </div>

          {/* Status grid */}
          <div className="grid grid-cols-2 gap-y-1.5 mb-3">
            <StatusPill label="Airway" value={casualty.airway_status} />
            <StatusPill label="Breathing" value={casualty.breathing_status} />
            <StatusPill label="Circulation" value={casualty.circulation_state} />
            <StatusPill label="Neuro" value={casualty.neurologic_status} />
          </div>

          {/* Pain level */}
          <div className="mb-3">
            <PainBar level={casualty.pain_level} />
          </div>

          {/* Injuries */}
          {injuries.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {injuries.slice(0, 3).map((inj, i) => (
                <span
                  key={i}
                  className="text-[10px] text-[#6b7594] bg-[#1e2330] border border-[#2d3347] rounded px-1.5 py-0.5"
                >
                  {String(inj)}
                </span>
              ))}
              {injuries.length > 3 && (
                <span className="text-[10px] text-[#4a5370]">
                  +{injuries.length - 3} more
                </span>
              )}
            </div>
          )}
        </CardContent>

        {/* Footer */}
        {scenarioTitle && (
          <div className="border-t border-[#1e2330] px-5 py-2.5 flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-[#4a5370] shrink-0" />
            <span className="text-[11px] text-[#4a5370] truncate">{scenarioTitle}</span>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

export function CasualtiesClient({ casualties, scenarios }: CasualtiesClientProps) {
  const [search, setSearch] = useState("")
  const [triageFilter, setTriageFilter] = useState<string>("All")
  const [originFilter, setOriginFilter] = useState<string>("All")

  const scenarioMap = useMemo(() => {
    const map: Record<string, string> = {}
    scenarios.forEach((s) => { map[s.id] = s.title })
    return map
  }, [scenarios])

  const filtered = useMemo(() => {
    return casualties.filter((c) => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !c.callsign.toLowerCase().includes(q) &&
          !c.display_label.toLowerCase().includes(q) &&
          !c.mechanism_of_injury.toLowerCase().includes(q)
        ) return false
      }
      if (triageFilter !== "All" && c.triage_category !== triageFilter) return false
      if (originFilter === "AI" && !c.ai_generated) return false
      if (originFilter === "Manual" && c.ai_generated) return false
      return true
    })
  }, [casualties, search, triageFilter, originFilter])

  // Stats
  const stats = useMemo(() => {
    const counts: Record<string, number> = { T1: 0, T2: 0, T3: 0, T4: 0 }
    casualties.forEach((c) => {
      if (counts[c.triage_category] !== undefined) counts[c.triage_category]++
    })
    return counts
  }, [casualties])

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Casualty Profiles"
        subtitle="Pre-built patient profiles for training scenarios"
      />

      <div className="flex-1 p-6 space-y-5">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="col-span-2 sm:col-span-1 rounded-xl border border-[#2d3347] bg-[#0f1117] px-4 py-3">
            <p className="text-[10px] text-[#4a5370] uppercase tracking-wider font-semibold mb-1">Total</p>
            <p className="text-2xl font-bold text-[#f0f4ff] leading-none">{casualties.length}</p>
          </div>
          {(["T1", "T2", "T3", "T4"] as const).map((t) => {
            const cfg = triageConfig[t]
            return (
              <div key={t} className={`rounded-xl border px-4 py-3 ${cfg.bg} ${cfg.border}`}>
                <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${cfg.text}`}>{t}</p>
                <p className={`text-2xl font-bold leading-none ${cfg.text}`}>{stats[t]}</p>
              </div>
            )
          })}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <Input
              placeholder="Search callsign, label, MOI..."
              leftElement={<Search className="h-3.5 w-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Triage chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {TRIAGE_FILTERS.map((t) => {
              const active = triageFilter === t
              const cfg = t !== "All" ? triageConfig[t] : null
              return (
                <button
                  key={t}
                  onClick={() => setTriageFilter(t)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium border transition-all ${
                    active
                      ? cfg
                        ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                        : "bg-[#252b3b] border-[#353c52] text-[#f0f4ff]"
                      : "bg-transparent border-[#2d3347] text-[#4a5370] hover:border-[#353c52] hover:text-[#6b7594]"
                  }`}
                >
                  {t}
                </button>
              )
            })}
          </div>

          {/* Origin chips */}
          <div className="flex items-center gap-1.5">
            {ORIGIN_FILTERS.map((o) => (
              <button
                key={o}
                onClick={() => setOriginFilter(o)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium border transition-all ${
                  originFilter === o
                    ? "bg-[#252b3b] border-[#353c52] text-[#f0f4ff]"
                    : "bg-transparent border-[#2d3347] text-[#4a5370] hover:border-[#353c52] hover:text-[#6b7594]"
                }`}
              >
                {o === "AI" ? "AI Generated" : o === "Manual" ? "Manual" : "All Origins"}
              </button>
            ))}
          </div>

          <p className="ml-auto text-xs text-[#6b7594]">
            {filtered.length} profile{filtered.length !== 1 ? "s" : ""}
            {search || triageFilter !== "All" || originFilter !== "All" ? " (filtered)" : ""}
          </p>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-14 w-14 rounded-2xl bg-[#1e2330] border border-[#2d3347] flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-[#4a5370]" />
            </div>
            {search || triageFilter !== "All" || originFilter !== "All" ? (
              <>
                <h3 className="text-base font-semibold text-[#6b7594] mb-2">No matching profiles</h3>
                <p className="text-sm text-[#3e465e] max-w-xs">
                  Try adjusting your search or filters.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-[#f0f4ff] mb-2">No casualty profiles yet</h3>
                <p className="text-sm text-[#6b7594] max-w-xs">
                  Generate casualties when creating a scenario. They will appear here automatically.
                </p>
              </>
            )}
          </div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {filtered.map((c, i) => (
              <CasualtyCard
                key={c.id}
                casualty={c}
                scenarioTitle={scenarioMap[c.scenario_id]}
                index={i}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
