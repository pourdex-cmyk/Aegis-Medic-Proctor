"use client"

import React, { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, AlertTriangle, Clock, Activity, Shield,
  ChevronLeft, RotateCcw, Maximize2, Heart, Wind, Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface VitalSigns {
  hr: number; rr: number; sbp: number; spo2: number; avpu: string
}

interface Casualty {
  id: string
  callsign: string
  display_label: string
  triage_category: string
  mechanism_of_injury: string
  visible_injuries: Array<{ type: string; location: string; severity: string }>
  baseline_vitals: VitalSigns
  airway_status: string
}

interface LiveState {
  casualty_id: string
  current_vitals: unknown
  triage_override?: string | null
}

interface MascalBoardProps {
  scenario: { id: string; title: string; casualty_count: number }
  casualties: Casualty[]
  run: { id: string; status: string; clock_seconds: number } | null
  liveStates: LiveState[]
}

type TriageCategory = "T1" | "T2" | "T3" | "T4" | "deceased" | "unassigned"

const TRIAGE_COLUMNS: { id: TriageCategory; label: string; subtitle: string; color: string; bg: string; border: string; headerBg: string }[] = [
  { id: "T1", label: "T1 — Immediate", subtitle: "Life threat, treat now", color: "text-red-300", bg: "bg-red-950/20", border: "border-red-800/40", headerBg: "bg-red-900/30" },
  { id: "T2", label: "T2 — Delayed", subtitle: "Serious, stable for now", color: "text-amber-300", bg: "bg-amber-950/20", border: "border-amber-800/40", headerBg: "bg-amber-900/30" },
  { id: "T3", label: "T3 — Minimal", subtitle: "Minor, walk-wounded", color: "text-green-300", bg: "bg-green-950/20", border: "border-green-800/40", headerBg: "bg-green-900/30" },
  { id: "T4", label: "T4 — Expectant", subtitle: "Unsurvivable injuries", color: "text-purple-300", bg: "bg-purple-950/20", border: "border-purple-800/40", headerBg: "bg-purple-900/30" },
  { id: "deceased", label: "Deceased", subtitle: "KIA / DOW", color: "text-[#6b7594]", bg: "bg-[#0d0f14]", border: "border-[#2d3347]", headerBg: "bg-[#1e2330]" },
  { id: "unassigned", label: "Unassigned", subtitle: "Not yet triaged", color: "text-[#9daabf]", bg: "bg-[#0d0f14]", border: "border-[#2d3347]", headerBg: "bg-[#1e2330]" },
]

function getVitals(casualty: Casualty, liveStates: LiveState[]): VitalSigns {
  const live = liveStates.find((s) => s.casualty_id === casualty.id)
  if (live?.current_vitals) return live.current_vitals as VitalSigns
  return casualty.baseline_vitals
}

function isVitalCritical(vitals: VitalSigns): boolean {
  return vitals.hr > 130 || vitals.hr < 50 || vitals.sbp < 80 || vitals.spo2 < 90 || vitals.avpu === "U"
}

function CasualtyCard({
  casualty,
  vitals,
  isDragging,
  onMove,
}: {
  casualty: Casualty
  vitals: VitalSigns
  isDragging?: boolean
  onMove: (casualtyId: string, category: TriageCategory) => void
}) {
  const critical = isVitalCritical(vitals)

  return (
    <div
      className={cn(
        "rounded-lg border bg-[#0a0c10] p-3 cursor-grab active:cursor-grabbing transition-all select-none",
        critical ? "border-red-700/60 shadow-[0_0_8px_rgba(220,38,38,0.15)]" : "border-[#1e2330] hover:border-[#353c52]",
        isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"
      )}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("casualtyId", casualty.id)
        e.dataTransfer.effectAllowed = "move"
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-bold font-mono text-[#f0f4ff]">{casualty.callsign}</p>
          <p className="text-[10px] text-[#4a5370] truncate max-w-[120px]">{casualty.display_label}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {critical && (
            <AlertTriangle className="h-3.5 w-3.5 text-red-400 animate-pulse" />
          )}
        </div>
      </div>

      <p className="text-[10px] text-[#6b7594] line-clamp-1 mb-2">
        {casualty.mechanism_of_injury}
      </p>

      <div className="grid grid-cols-4 gap-1">
        {[
          { label: "HR", value: vitals.hr, crit: vitals.hr > 130 || vitals.hr < 50 },
          { label: "SBP", value: vitals.sbp, crit: vitals.sbp < 80 },
          { label: "SpO₂", value: `${vitals.spo2}%`, crit: vitals.spo2 < 90 },
          { label: "AVPU", value: vitals.avpu, crit: vitals.avpu === "U" || vitals.avpu === "P" },
        ].map((v) => (
          <div key={v.label} className={cn(
            "rounded bg-[#060708] border px-1 py-1 text-center",
            v.crit ? "border-red-800/50" : "border-[#1e2330]"
          )}>
            <p className="text-[8px] text-[#3e465e]">{v.label}</p>
            <p className={cn("text-[10px] font-mono font-bold", v.crit ? "text-red-400" : "text-[#d3dce8]")}>
              {v.value}
            </p>
          </div>
        ))}
      </div>

      {/* Injuries summary */}
      {casualty.visible_injuries.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {casualty.visible_injuries.slice(0, 2).map((inj, i) => (
            <span key={i} className={cn(
              "text-[9px] px-1.5 py-0.5 rounded",
              inj.severity === "critical" ? "bg-red-950/50 text-red-400" :
              inj.severity === "moderate" ? "bg-amber-950/50 text-amber-400" :
              "bg-[#1e2330] text-[#6b7594]"
            )}>
              {inj.type}
            </span>
          ))}
          {casualty.visible_injuries.length > 2 && (
            <span className="text-[9px] text-[#3e465e]">+{casualty.visible_injuries.length - 2}</span>
          )}
        </div>
      )}

      {/* Quick reassign buttons */}
      <div className="mt-2 flex gap-1 flex-wrap">
        {(["T1", "T2", "T3", "T4"] as TriageCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={(e) => { e.stopPropagation(); onMove(casualty.id, cat) }}
            className={cn(
              "text-[9px] px-1.5 py-0.5 rounded border font-semibold transition-colors",
              cat === "T1" ? "border-red-800/50 text-red-400 hover:bg-red-950/30" :
              cat === "T2" ? "border-amber-800/50 text-amber-400 hover:bg-amber-950/30" :
              cat === "T3" ? "border-green-800/50 text-green-400 hover:bg-green-950/30" :
              "border-purple-800/50 text-purple-400 hover:bg-purple-950/30"
            )}
          >
            {cat}
          </button>
        ))}
        <button
          onClick={(e) => { e.stopPropagation(); onMove(casualty.id, "deceased") }}
          className="text-[9px] px-1.5 py-0.5 rounded border border-[#2d3347] text-[#4a5370] hover:bg-[#1e2330] font-semibold transition-colors"
        >
          KIA
        </button>
      </div>
    </div>
  )
}

export function MascalBoard({ scenario, casualties, run, liveStates }: MascalBoardProps) {
  const router = useRouter()
  const supabase = createClient()

  // Local triage state (can override from baseline)
  const [triageState, setTriageState] = useState<Record<string, TriageCategory>>(() =>
    Object.fromEntries(casualties.map((c) => {
      const live = liveStates.find((s) => s.casualty_id === c.id)
      return [c.id, (live?.triage_override ?? c.triage_category) as TriageCategory]
    }))
  )
  const [dragOverColumn, setDragOverColumn] = useState<TriageCategory | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const moveCasualty = useCallback(async (casualtyId: string, category: TriageCategory) => {
    setTriageState((prev) => ({ ...prev, [casualtyId]: category }))
    // Persist if live run
    if (run?.id) {
      await supabase
        .from("casualty_states")
        .update({ triage_override: category })
        .eq("run_id", run.id)
        .eq("casualty_id", casualtyId)
    }
    toast.success(`${casualties.find((c) => c.id === casualtyId)?.callsign} → ${category}`)
  }, [run?.id, casualties, supabase])

  const getColumnCasualties = (category: TriageCategory) =>
    casualties.filter((c) => triageState[c.id] === category)

  const counts = {
    T1: getColumnCasualties("T1").length,
    T2: getColumnCasualties("T2").length,
    T3: getColumnCasualties("T3").length,
    T4: getColumnCasualties("T4").length,
    deceased: getColumnCasualties("deceased").length,
  }

  const handleDrop = (e: React.DragEvent, category: TriageCategory) => {
    e.preventDefault()
    const casualtyId = e.dataTransfer.getData("casualtyId")
    if (casualtyId) moveCasualty(casualtyId, category)
    setDragOverColumn(null)
  }

  return (
    <div className={cn(
      "flex flex-col bg-[#070809]",
      isFullscreen ? "fixed inset-0 z-50" : "min-h-screen"
    )}>
      {/* Compact header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2330] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-[#4a5370] hover:text-[#9daabf] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs font-bold text-[#f0f4ff] uppercase tracking-wide">MASCAL Board</p>
            <p className="text-[10px] text-[#4a5370]">{scenario.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Triage counts */}
          <div className="hidden sm:flex items-center gap-2">
            {[
              { cat: "T1", count: counts.T1, color: "text-red-400" },
              { cat: "T2", count: counts.T2, color: "text-amber-400" },
              { cat: "T3", count: counts.T3, color: "text-green-400" },
              { cat: "T4", count: counts.T4, color: "text-purple-400" },
              { cat: "KIA", count: counts.deceased, color: "text-[#6b7594]" },
            ].map(({ cat, count, color }) => (
              <div key={cat} className="flex items-center gap-1">
                <span className={cn("text-[10px] font-bold font-mono", color)}>{cat}</span>
                <span className="text-[10px] text-[#9daabf] font-mono">{count}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {run?.status === "active" && (
              <Badge variant="critical" dot size="sm">Live</Badge>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-3 min-w-max h-full pb-2">
          {TRIAGE_COLUMNS.map((col) => {
            const colCasualties = getColumnCasualties(col.id)
            const isDragTarget = dragOverColumn === col.id

            return (
              <div
                key={col.id}
                className={cn(
                  "w-52 flex flex-col rounded-xl border transition-all",
                  col.border,
                  isDragTarget ? `${col.bg} ring-1 ring-inset ${col.border}` : "bg-[#0a0c10]"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.id) }}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column header */}
                <div className={cn(
                  "px-3 py-2.5 rounded-t-xl border-b",
                  col.headerBg,
                  col.border
                )}>
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={cn("text-xs font-bold", col.color)}>{col.label}</p>
                    <span className={cn(
                      "text-xs font-mono font-bold h-5 w-5 rounded-full flex items-center justify-center",
                      colCasualties.length > 0 ? col.bg : "bg-[#1e2330]",
                      col.color
                    )}>
                      {colCasualties.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#4a5370]">{col.subtitle}</p>
                </div>

                {/* Cards */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]">
                  <AnimatePresence>
                    {colCasualties.map((casualty) => {
                      const vitals = getVitals(casualty, liveStates)
                      return (
                        <motion.div
                          key={casualty.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.15 }}
                        >
                          <CasualtyCard
                            casualty={casualty}
                            vitals={vitals}
                            onMove={moveCasualty}
                          />
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>

                  {colCasualties.length === 0 && (
                    <div className={cn(
                      "h-20 rounded-lg border-2 border-dashed flex items-center justify-center",
                      isDragTarget ? col.border : "border-[#1e2330]"
                    )}>
                      <p className="text-[10px] text-[#3e465e]">Drop here</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer: legend */}
      <div className="shrink-0 border-t border-[#1e2330] px-5 py-2 flex items-center gap-4">
        <p className="text-[10px] text-[#3e465e]">Drag cards between columns or click T1/T2/T3/T4 buttons to reassign</p>
        <div className="ml-auto flex items-center gap-3">
          {[
            { color: "bg-red-500", label: "Critical vital" },
            { color: "bg-red-800/50", label: "Critical injury" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={cn("h-2 w-2 rounded-full", color)} />
              <span className="text-[10px] text-[#3e465e]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
