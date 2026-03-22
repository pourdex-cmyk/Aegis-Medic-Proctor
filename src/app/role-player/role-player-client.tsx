"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mic, Volume2, VolumeX, Activity, AlertTriangle,
  Heart, Wind, Eye, Radio, Clock, ChevronDown, ChevronUp,
  Wifi, WifiOff, Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn, formatDuration } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface VitalSigns {
  hr: number; rr: number; sbp: number; spo2: number; avpu: string; temp?: number
}

interface AudioCue {
  id: string
  category: string
  title: string
  script_text: string
  voice_style?: string | null
  intensity: string
  tags: string[]
}

interface Casualty {
  id: string
  callsign: string
  display_label: string
  mechanism_of_injury: string
  visible_injuries: Array<{ type: string; location: string; severity: string }>
  airway_status: string
  triage_category: string
  baseline_vitals: VitalSigns
  pain_level: number
  audio_profile?: { primary_complaint?: string } | null
}

interface Run {
  id: string
  status: string
  clock_seconds: number
  scenarios?: { title: string; environment: string } | null
}

interface RolePlayerClientProps {
  run: Run | null
  casualty: Casualty | null
  audioCues: AudioCue[]
}

const TRIAGE_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  T1: { bg: "bg-red-950", border: "border-red-700", text: "text-red-300", label: "IMMEDIATE" },
  T2: { bg: "bg-amber-950", border: "border-amber-700", text: "text-amber-300", label: "DELAYED" },
  T3: { bg: "bg-green-950", border: "border-green-700", text: "text-green-300", label: "MINIMAL" },
  T4: { bg: "bg-purple-950", border: "border-purple-700", text: "text-purple-300", label: "EXPECTANT" },
  deceased: { bg: "bg-[#0a0c10]", border: "border-[#2d3347]", text: "text-[#6b7594]", label: "DECEASED" },
}

function NoCasualtyPrompt({ run }: { run: Run | null }) {
  const [runIdInput, setRunIdInput] = useState("")

  return (
    <div className="min-h-screen bg-[#050607] flex flex-col items-center justify-center p-8 text-center">
      <div className="h-16 w-16 rounded-2xl bg-[#1a2444] border border-blue-800/40 flex items-center justify-center mb-6">
        <Shield className="h-8 w-8 text-blue-400" />
      </div>
      <h1 className="text-2xl font-bold text-[#f0f4ff] mb-2">Role Player Screen</h1>
      <p className="text-sm text-[#6b7594] max-w-xs mb-8">
        {run
          ? "Select a casualty from the run command center to load your script."
          : "Waiting for proctor to assign your role. Keep this screen open."}
      </p>
      {run?.status === "active" && (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-red-400 font-medium">RUN ACTIVE</span>
        </div>
      )}
    </div>
  )
}

export function RolePlayerClient({ run, casualty, audioCues }: RolePlayerClientProps) {
  const supabase = createClient()
  const [muted, setMuted] = useState(false)
  const [clockSeconds, setClockSeconds] = useState(run?.clock_seconds ?? 0)
  const [isConnected, setIsConnected] = useState(true)
  const [activeCue, setActiveCue] = useState<AudioCue | null>(null)
  const [showAllCues, setShowAllCues] = useState(false)
  const [showHiddenVitals, setShowHiddenVitals] = useState(false)
  const clockRef = useRef<NodeJS.Timeout | null>(null)
  const triage = casualty ? (TRIAGE_STYLES[casualty.triage_category] ?? TRIAGE_STYLES.T3) : null

  // Clock sync
  useEffect(() => {
    if (run?.status === "active") {
      setClockSeconds(run.clock_seconds)
      clockRef.current = setInterval(() => setClockSeconds((s) => s + 1), 1000)
    }
    return () => { if (clockRef.current) clearInterval(clockRef.current) }
  }, [run?.status, run?.clock_seconds])

  // Realtime: listen for cue triggers
  useEffect(() => {
    if (!run?.id) return
    const channel = supabase
      .channel(`role-player:${run.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "audio_events",
        filter: `run_id=eq.${run.id}`,
      }, (payload) => {
        const cue = audioCues.find((c) => c.id === (payload.new as { cue_id: string }).cue_id)
        if (cue) setActiveCue(cue)
      })
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    return () => { supabase.removeChannel(channel) }
  }, [run?.id, audioCues, supabase])

  if (!casualty) return <NoCasualtyPrompt run={run} />

  const vitals = casualty.baseline_vitals
  const painColor = casualty.pain_level >= 8 ? "text-red-400" : casualty.pain_level >= 5 ? "text-amber-400" : "text-green-400"

  return (
    <div className="min-h-screen bg-[#050607] flex flex-col text-[#f0f4ff]">
      {/* Top status bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2330] bg-[#070809]">
        <div className="flex items-center gap-3">
          {isConnected
            ? <Wifi className="h-3.5 w-3.5 text-green-400" />
            : <WifiOff className="h-3.5 w-3.5 text-red-400 animate-pulse" />
          }
          <span className="text-[11px] text-[#4a5370]">
            {run?.scenarios?.title ?? "Aegis Medic Proctor"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {run?.status === "active" && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono text-red-400 font-bold">
                {formatDuration(clockSeconds)}
              </span>
            </div>
          )}
          <button onClick={() => setMuted(!muted)}>
            {muted
              ? <VolumeX className="h-4 w-4 text-[#4a5370]" />
              : <Volume2 className="h-4 w-4 text-[#9daabf]" />
            }
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-5 max-w-lg mx-auto w-full">
        {/* Active cue banner */}
        <AnimatePresence>
          {activeCue && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-xl border border-blue-700/50 bg-blue-950/40 px-5 py-4"
            >
              <div className="flex items-start gap-3">
                <Radio className="h-4 w-4 text-blue-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold mb-1">
                    Incoming Cue — {activeCue.category}
                  </p>
                  <p className="text-base font-semibold text-[#f0f4ff] leading-snug">
                    "{activeCue.script_text}"
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <Button size="xs" variant="secondary" onClick={() => setActiveCue(null)}>
                  Acknowledge
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Casualty identity */}
        <div className={cn(
          "rounded-xl border p-5",
          triage!.border, triage!.bg
        )}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-3xl font-black font-mono tracking-tight text-[#f0f4ff]">
                {casualty.callsign}
              </p>
              <p className="text-sm text-[#9daabf] mt-0.5">{casualty.display_label}</p>
            </div>
            <div className={cn(
              "rounded-lg border px-3 py-1.5 text-center",
              triage!.border
            )}>
              <p className={cn("text-xs font-black tracking-widest uppercase", triage!.text)}>
                {triage!.label}
              </p>
              <p className={cn("text-lg font-black font-mono", triage!.text)}>
                {casualty.triage_category}
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-black/30 border border-white/5 px-4 py-3">
            <p className="text-[10px] text-[#4a5370] uppercase tracking-wider mb-1">Mechanism of Injury</p>
            <p className="text-sm text-[#d3dce8]">{casualty.mechanism_of_injury}</p>
          </div>
        </div>

        {/* Primary complaint script */}
        {casualty.audio_profile?.primary_complaint && (
          <div className="rounded-xl border border-[#2d3347] bg-[#0d0f14] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="h-4 w-4 text-blue-400" />
              <p className="text-xs font-semibold text-[#9daabf] uppercase tracking-wider">Say This</p>
            </div>
            <p className="text-xl font-semibold text-[#f0f4ff] leading-relaxed italic">
              "{casualty.audio_profile.primary_complaint}"
            </p>
          </div>
        )}

        {/* Vitals display */}
        <div className="rounded-xl border border-[#1e2330] bg-[#0a0c10] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[#6b7594] uppercase tracking-wider">Baseline Vitals</p>
            <button
              onClick={() => setShowHiddenVitals(!showHiddenVitals)}
              className="text-[10px] text-[#4a5370] hover:text-[#9daabf] flex items-center gap-1"
            >
              {showHiddenVitals ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showHiddenVitals ? "Hide" : "Show all"}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: "HR", value: vitals.hr, unit: "bpm", crit: vitals.hr > 130 || vitals.hr < 50 },
              { label: "RR", value: vitals.rr, unit: "/min", crit: vitals.rr > 30 || vitals.rr < 8 },
              { label: "SBP", value: vitals.sbp, unit: "mmHg", crit: vitals.sbp < 80 },
              { label: "SpO₂", value: `${vitals.spo2}%`, unit: "", crit: vitals.spo2 < 90 },
            ].map((v) => (
              <div key={v.label} className={cn(
                "rounded-lg border p-3 text-center",
                v.crit ? "border-red-800/50 bg-red-950/20" : "border-[#1e2330] bg-[#060708]"
              )}>
                <p className="text-[9px] text-[#3e465e] mb-0.5">{v.label}</p>
                <p className={cn("text-base font-black font-mono", v.crit ? "text-red-400" : "text-[#f0f4ff]")}>
                  {v.value}
                </p>
                {v.unit && <p className="text-[9px] text-[#3e465e]">{v.unit}</p>}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#1e2330] bg-[#060708] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-[#4a5370]" />
              <span className="text-xs text-[#6b7594]">AVPU</span>
            </div>
            <span className="text-sm font-bold text-[#f0f4ff]">{vitals.avpu}</span>
          </div>

          {showHiddenVitals && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 space-y-2"
            >
              <div className="flex items-center justify-between rounded-lg border border-[#1e2330] bg-[#060708] px-4 py-2.5">
                <span className="text-xs text-[#6b7594]">Pain Level</span>
                <span className={cn("text-sm font-bold", painColor)}>
                  {casualty.pain_level} / 10
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#1e2330] bg-[#060708] px-4 py-2.5">
                <span className="text-xs text-[#6b7594]">Airway</span>
                <span className="text-sm font-semibold text-[#f0f4ff] capitalize">
                  {casualty.airway_status.replace(/_/g, " ")}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Visible injuries */}
        <div className="rounded-xl border border-[#1e2330] bg-[#0a0c10] p-5">
          <p className="text-xs font-semibold text-[#6b7594] uppercase tracking-wider mb-3">Visible Injuries</p>
          <div className="space-y-2">
            {casualty.visible_injuries.map((inj, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-[#1e2330] bg-[#060708] px-3 py-2">
                <div className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  inj.severity === "critical" ? "bg-red-500" :
                  inj.severity === "moderate" ? "bg-amber-500" : "bg-green-500"
                )} />
                <p className="text-sm text-[#d3dce8] capitalize">
                  {inj.severity} {inj.type} — {inj.location}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Audio cues */}
        {audioCues.length > 0 && (
          <div className="rounded-xl border border-[#1e2330] bg-[#0a0c10] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#6b7594] uppercase tracking-wider">Audio Cues</p>
              <button
                onClick={() => setShowAllCues(!showAllCues)}
                className="text-[10px] text-[#4a5370] hover:text-[#9daabf] flex items-center gap-1"
              >
                {showAllCues ? "Show fewer" : `Show all (${audioCues.length})`}
              </button>
            </div>
            <div className="space-y-2">
              {(showAllCues ? audioCues : audioCues.slice(0, 3)).map((cue) => (
                <div key={cue.id} className="rounded-lg border border-[#1e2330] bg-[#060708] px-3 py-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" size="sm">{cue.category}</Badge>
                    <Badge variant="secondary" size="sm">{cue.intensity}</Badge>
                  </div>
                  <p className="text-xs font-medium text-[#d3dce8] mb-0.5">{cue.title}</p>
                  <p className="text-xs text-[#9daabf] italic">"{cue.script_text}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom: role-player actions */}
      <div className="shrink-0 border-t border-[#1e2330] bg-[#070809] px-5 py-4">
        <p className="text-[10px] text-[#3e465e] text-center">
          Role Player Mode — Proctor controls scenario progression
        </p>
      </div>
    </div>
  )
}
