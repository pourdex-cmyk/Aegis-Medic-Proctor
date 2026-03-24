"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Volume2, VolumeX, Wifi, WifiOff, Mic, AlertTriangle, RefreshCw, Radio } from "lucide-react"
import { cn, formatDuration } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface VitalSigns {
  hr: number; rr: number; sbp: number; spo2: number; avpu: string; temp?: number
}

interface VisibleInjury {
  type: string; location: string; severity: string; laterality?: string | null
}

interface Casualty {
  id: string
  callsign: string
  display_label: string
  mechanism_of_injury: string
  visible_injuries: VisibleInjury[]
  airway_status: string
  breathing_status: string
  triage_category: string
  baseline_vitals: VitalSigns
  pain_level: number
  audio_profile?: { primary_complaint?: string } | null
}

interface Run {
  id: string | null
  status: string
  clock_seconds: number
  target_duration_minutes?: number | null
}

interface ActorSession {
  current_vitals: VitalSigns | null
  proctor_note: string | null
  last_cue: string | null
}

type RunStatus = "standby" | "active" | "paused" | "endex" | "loading" | "error"

const TRIAGE_CONFIG: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  T1: { border: "border-red-700", bg: "bg-red-950/40", text: "text-red-300", badge: "bg-red-700 text-white" },
  T2: { border: "border-amber-700", bg: "bg-amber-950/40", text: "text-amber-300", badge: "bg-amber-600 text-white" },
  T3: { border: "border-green-700", bg: "bg-green-950/40", text: "text-green-300", badge: "bg-green-700 text-white" },
  T4: { border: "border-purple-700", bg: "bg-purple-950/40", text: "text-purple-300", badge: "bg-purple-700 text-white" },
}

const TRIAGE_LABELS: Record<string, string> = {
  T1: "IMMEDIATE", T2: "DELAYED", T3: "MINIMAL", T4: "EXPECTANT",
}

function getRunStatus(status: string): RunStatus {
  if (status === "active") return "active"
  if (status === "paused") return "paused"
  if (status === "completed") return "endex"
  return "standby"
}

// ── Script builders ──────────────────────────────────────────────────────────

function buildStartBrief(c: Casualty): string {
  const inj = c.visible_injuries
    .map((i) => `${i.severity} ${i.type} to the ${i.location}`)
    .join(", ")
  const complaint = c.audio_profile?.primary_complaint ?? ""
  const painGuide =
    c.pain_level >= 8 ? "You are in severe distress. Writhe, moan, and struggle to speak in full sentences." :
    c.pain_level >= 5 ? "You are in moderate pain. Grimace, speak in short sentences, and guard your injury." :
    "You are in mild discomfort. You can speak normally but acknowledge the pain."
  return [
    `${c.callsign}. ${c.display_label}. Scenario is now active. Get into character now.`,
    `Your mechanism of injury: ${c.mechanism_of_injury}.`,
    inj ? `Visible wounds: ${inj}.` : "",
    complaint ? `When a medic approaches you, say: ${complaint}.` : "",
    painGuide,
    c.airway_status !== "patent"
      ? `Your airway is ${c.airway_status.replace(/_/g, " ")}. Breathe accordingly.`
      : "",
    "Respond to medic questions with short answers. React physically when they touch your injuries.",
    "Do not break character until you hear ENDEX.",
  ].filter(Boolean).join(" ")
}

function buildStandbyBrief(c: Casualty): string {
  const complaint = c.audio_profile?.primary_complaint ?? ""
  return [
    `Connected. You are playing ${c.callsign}: ${c.display_label}.`,
    `Your character was injured by: ${c.mechanism_of_injury}.`,
    complaint ? `Your complaint to tell medics: ${complaint}.` : "",
    "Standby. Waiting for the proctor to start the scenario. Review your profile on screen.",
  ].filter(Boolean).join(" ")
}

function buildVitalsScript(v: VitalSigns): string {
  const avpuFull: Record<string, string> = { A: "Alert", V: "Voice", P: "Pain", U: "Unresponsive" }
  return [
    "Vitals update from proctor.",
    `Heart rate: ${v.hr}.`,
    `Blood pressure: ${v.sbp}.`,
    `Respiratory rate: ${v.rr}.`,
    `Oxygen saturation: ${v.spo2} percent.`,
    `Level of consciousness: ${avpuFull[v.avpu] ?? v.avpu}.`,
    "Adjust your acting to reflect these values.",
  ].join(" ")
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ActorView({ token }: { token: string }) {
  const [run, setRun] = useState<Run | null>(null)
  const [casualty, setCasualty] = useState<Casualty | null>(null)
  const [liveVitals, setLiveVitals] = useState<VitalSigns | null>(null)
  const [proctorNote, setProctorNote] = useState<string | null>(null)
  const [viewStatus, setViewStatus] = useState<RunStatus>("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const [muted, setMuted] = useState(false)
  const [clockSeconds, setClockSeconds] = useState(0)
  const [connected, setConnected] = useState(true)
  const [ttsPlaying, setTtsPlaying] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  const prevRunStatus = useRef<string | null>(null)
  const clockRef = useRef<NodeJS.Timeout | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const fiveMinWarnedRef = useRef(false)
  const mutedRef = useRef(false)
  const audioUnlockedRef = useRef(false)
  const audioQueueRef = useRef<Array<{ text: string; interrupt: boolean }>>([])
  const hasAutoPlayedRef = useRef(false)

  useEffect(() => { mutedRef.current = muted }, [muted])

  // ── TTS core ─────────────────────────────────────────────────────────────
  const speakRaw = useCallback((text: string, interrupt: boolean) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return
    if (interrupt) window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.82
    utt.pitch = 0.95
    utt.volume = 1
    utt.onstart = () => setTtsPlaying(true)
    utt.onend = () => setTtsPlaying(false)
    utt.onerror = () => setTtsPlaying(false)
    window.speechSynthesis.speak(utt)
  }, [])

  // speak() queues if audio isn't unlocked yet (iOS Safari requires gesture)
  const speak = useCallback((text: string, interrupt = false) => {
    if (mutedRef.current) return
    if (!audioUnlockedRef.current) {
      if (interrupt) audioQueueRef.current = [{ text, interrupt }]
      else audioQueueRef.current.push({ text, interrupt })
      return
    }
    speakRaw(text, interrupt)
  }, [speakRaw])

  // Called on first user tap — drains queued speech
  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current) return
    audioUnlockedRef.current = true
    setAudioUnlocked(true)
    // iOS: must call speak() inside gesture handler
    window.speechSynthesis?.cancel()
    const queue = audioQueueRef.current.splice(0)
    queue.forEach(({ text, interrupt }, i) => {
      setTimeout(() => speakRaw(text, interrupt && i === 0), i * 50)
    })
  }, [speakRaw])

  const speakComplaint = useCallback(() => {
    if (!casualty?.audio_profile?.primary_complaint) return
    unlockAudio()
    speak(casualty.audio_profile.primary_complaint, true)
  }, [casualty, speak, unlockAudio])

  const speakInjuries = useCallback(() => {
    if (!casualty) return
    unlockAudio()
    const text = casualty.visible_injuries
      .map((i) => `${i.severity} ${i.type} to the ${i.location}`)
      .join(". ")
    speak(text || "No visible injuries", true)
  }, [casualty, speak, unlockAudio])

  // ── Fetch / Poll ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/actor/${token}`, { cache: "no-store" })
      setConnected(true)

      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data.error ?? "Invalid code")
        setViewStatus("error")
        return
      }

      const data: { run: Run; casualty: Casualty; session: ActorSession } = await res.json()
      const newStatus = data.run.status
      const prev = prevRunStatus.current

      // ── Initial load auto-brief ─────────────────────────────────────────
      if (prev === null && !hasAutoPlayedRef.current) {
        hasAutoPlayedRef.current = true
        if (newStatus === "standby") {
          setTimeout(() => speak(buildStandbyBrief(data.casualty), true), 400)
        } else if (newStatus === "active") {
          // Joined mid-scenario — give the full brief
          setTimeout(() => speak(buildStartBrief(data.casualty), true), 400)
          // If there's a recent treatment cue, follow up with it
          if (data.session.last_cue) {
            setTimeout(() => speak(data.session.last_cue!, false), 800)
          }
        } else if (newStatus === "paused") {
          setTimeout(() => speak(`Connected as ${data.casualty.callsign}. The scenario is currently paused. Hold your position.`, true), 400)
        }
      }

      // ── Phase transition briefs ─────────────────────────────────────────
      if (prev !== null && prev !== newStatus) {
        if (newStatus === "active") {
          setTimeout(() => speak(buildStartBrief(data.casualty), true), 300)
        } else if (newStatus === "paused") {
          speak("Scenario paused. Hold your position.", true)
        } else if (newStatus === "completed") {
          setTimeout(() => speak("ENDEX. ENDEX. The scenario is complete. Say ENDEX to the medics now.", true), 300)
        }
      }

      prevRunStatus.current = newStatus
      setRun(data.run)
      setCasualty(data.casualty)
      setViewStatus(getRunStatus(newStatus))
      if (data.session?.current_vitals) setLiveVitals(data.session.current_vitals)
      else setLiveVitals(null)
      setProctorNote(data.session?.proctor_note ?? null)
    } catch {
      setConnected(false)
    }
  }, [token, speak])

  useEffect(() => {
    fetchData()
    pollRef.current = setInterval(fetchData, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchData])

  // ── Supabase Realtime — instant vitals, notes, cues ──────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`actor-session-${token}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "casualty_actor_sessions",
          filter: `token=eq.${token}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const row = payload.new as {
            current_vitals?: VitalSigns | null
            proctor_note?: string | null
            last_cue?: string | null
          }
          if (row.current_vitals) {
            setLiveVitals(row.current_vitals)
            speak(buildVitalsScript(row.current_vitals), false)
          }
          if (row.proctor_note !== undefined) setProctorNote(row.proctor_note ?? null)
          if (row.last_cue) {
            setTimeout(() => speak(row.last_cue!, false), 400)
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [token, speak])

  // ── Clock ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (clockRef.current) clearInterval(clockRef.current)
    if (run?.status === "active") {
      setClockSeconds(run.clock_seconds)
      clockRef.current = setInterval(() => setClockSeconds((s) => s + 1), 1000)
    }
    return () => { if (clockRef.current) clearInterval(clockRef.current) }
  }, [run?.status, run?.clock_seconds])

  // ── 5-minute warning ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!run?.target_duration_minutes || viewStatus !== "active") return
    const targetSec = run.target_duration_minutes * 60
    const remaining = targetSec - clockSeconds
    if (remaining <= 300 && remaining > 295 && !fiveMinWarnedRef.current) {
      fiveMinWarnedRef.current = true
      speak("Warning. Five minutes remaining in this scenario.", false)
    }
    if (remaining > 300) fiveMinWarnedRef.current = false
  }, [clockSeconds, run?.target_duration_minutes, viewStatus, speak])

  // ── Wake Lock ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const acquire = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await (navigator as Navigator & { wakeLock: { request: (t: string) => Promise<WakeLockSentinel> } }).wakeLock.request("screen")
        }
      } catch { /* not supported */ }
    }
    acquire()
    return () => { wakeLockRef.current?.release().catch(() => {}) }
  }, [])

  const triage = casualty ? (TRIAGE_CONFIG[casualty.triage_category] ?? TRIAGE_CONFIG.T3) : null
  const vitals = liveVitals ?? casualty?.baseline_vitals ?? null
  const vitalsLive = !!liveVitals

  // ── ENDEX ─────────────────────────────────────────────────────────────────
  if (viewStatus === "endex") {
    return (
      <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.3 }}
          className="space-y-6"
        >
          <div className="text-[96px] font-black tracking-[0.15em] text-white leading-none">ENDEX</div>
          <div className="h-1 w-48 bg-red-400/50 mx-auto rounded-full" />
          <p className="text-2xl font-bold text-red-200">The scenario is over.</p>
          <p className="text-xl text-red-300">
            Tell the medics: <span className="font-black text-white">"ENDEX"</span>
          </p>
          <button
            onClick={() => { unlockAudio(); speak("ENDEX. ENDEX. The scenario is complete. Tell the medics ENDEX.", true) }}
            className="mt-4 px-8 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-lg"
          >
            🔊 Repeat Audio
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (viewStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#050607] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#4a5370]">Connecting to scenario…</p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (viewStatus === "error") {
    return (
      <div className="min-h-screen bg-[#050607] flex flex-col items-center justify-center p-8 text-center gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-xl font-bold text-[#f0f4ff]">Code not found</p>
        <p className="text-sm text-[#6b7594] max-w-xs">{errorMsg}</p>
        <a href="/role-player" className="mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm">
          Try Another Code
        </a>
      </div>
    )
  }

  if (!casualty || !vitals) return null

  const painColor = casualty.pain_level >= 8 ? "text-red-400" : casualty.pain_level >= 5 ? "text-amber-400" : "text-green-400"

  return (
    <div className="min-h-screen bg-[#050607] text-[#f0f4ff] flex flex-col select-none">

      {/* ── Audio unlock overlay (iOS Safari requires first gesture) ──────── */}
      <AnimatePresence>
        {!audioUnlocked && casualty && (
          <motion.div
            key="audio-unlock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050607]/95 backdrop-blur-sm p-8 text-center"
            onClick={unlockAudio}
          >
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="h-24 w-24 rounded-full bg-blue-600/20 border-2 border-blue-500/60 flex items-center justify-center mb-6"
            >
              <Radio className="h-12 w-12 text-blue-400" />
            </motion.div>
            <p className="text-3xl font-black text-[#f0f4ff] mb-2">Tap to Connect</p>
            <p className="text-base text-[#6b7594] max-w-xs">
              Enable audio for auto-briefing and real-time cues
            </p>
            <div className="mt-6 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-base">
              Enable Audio & Begin
            </div>
            <p className="mt-4 text-[11px] text-[#3e465e]">
              {casualty.callsign} · {casualty.display_label}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Status bar ───────────────────────────────────────────────────── */}
      <div className={cn(
        "flex items-center justify-between px-5 py-3 border-b border-[#1e2330] transition-colors",
        viewStatus === "active" ? "bg-red-950/30" : "bg-[#070809]"
      )}>
        <div className="flex items-center gap-2.5">
          {connected
            ? <Wifi className="h-3.5 w-3.5 text-green-400" />
            : <WifiOff className="h-3.5 w-3.5 text-red-400 animate-pulse" />
          }
          <span className="text-[11px] text-[#4a5370]">Aegis Medic — Role Player</span>
        </div>

        <div className="flex items-center gap-4">
          {viewStatus === "active" && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-sm font-bold text-red-400">
                {formatDuration(clockSeconds)}
              </span>
              {run?.target_duration_minutes && (
                <span className="text-[10px] text-[#4a5370]">
                  / {run.target_duration_minutes}m
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => {
              const next = !muted
              setMuted(next)
              mutedRef.current = next
              if (next) window.speechSynthesis?.cancel()
            }}
            className="p-1.5"
          >
            {muted
              ? <VolumeX className="h-4 w-4 text-[#4a5370]" />
              : <Volume2 className={cn("h-4 w-4", audioUnlocked ? "text-[#9daabf]" : "text-[#3e465e]")} />
            }
          </button>
        </div>
      </div>

      {/* ── Phase banner ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {viewStatus === "standby" && (
          <motion.div key="standby" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-3 py-3 bg-[#0f1117] border-b border-[#1e2330]"
          >
            <div className="h-2 w-2 rounded-full bg-[#4a5370]" />
            <span className="text-sm font-bold text-[#6b7594] tracking-widest uppercase">Standby — Waiting for scenario</span>
          </motion.div>
        )}
        {viewStatus === "active" && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-3 py-3 bg-red-950/40 border-b border-red-900/50"
          >
            <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-black text-red-400 tracking-widest uppercase">Scenario Active — Stay in character</span>
          </motion.div>
        )}
        {viewStatus === "paused" && (
          <motion.div key="paused" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-3 py-3 bg-amber-950/40 border-b border-amber-900/50"
          >
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-sm font-bold text-amber-400 tracking-widest uppercase">Paused — Hold position</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Proctor note ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {proctorNote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 py-3 bg-amber-950/40 border-b border-amber-800/40"
          >
            <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">Proctor Note</p>
            <p className="text-sm text-amber-200">{proctorNote}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-5 space-y-5 max-w-lg mx-auto w-full pb-10">

        {/* Identity card */}
        <div className={cn("rounded-2xl border-2 p-5", triage!.border, triage!.bg)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-4xl font-black font-mono tracking-tight leading-none text-[#f0f4ff]">
                {casualty.callsign}
              </p>
              <p className="text-sm text-[#9daabf] mt-1">{casualty.display_label}</p>
            </div>
            <div className={cn("rounded-xl px-3 py-2 text-center shrink-0", triage!.badge)}>
              <p className="text-[10px] font-black tracking-widest uppercase opacity-80">
                {TRIAGE_LABELS[casualty.triage_category] ?? "UNKNOWN"}
              </p>
              <p className="text-2xl font-black font-mono leading-none">
                {casualty.triage_category}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-black/30 border border-white/5 px-4 py-3">
            <p className="text-[10px] font-semibold text-[#4a5370] uppercase tracking-wider mb-1">How you were injured</p>
            <p className="text-sm text-[#d3dce8] leading-snug">{casualty.mechanism_of_injury}</p>
          </div>

          {/* Replay brief button */}
          <button
            onClick={() => { unlockAudio(); speak(viewStatus === "active" ? buildStartBrief(casualty) : buildStandbyBrief(casualty), true) }}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-black/20 border border-white/10 py-2.5 text-xs font-semibold text-[#9daabf] hover:bg-black/30 transition-colors"
          >
            <Volume2 className="h-3.5 w-3.5" />
            Replay Brief
          </button>
        </div>

        {/* Say This */}
        {casualty.audio_profile?.primary_complaint && (
          <div className="rounded-2xl border border-blue-800/40 bg-blue-950/20 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-blue-400" />
                <p className="text-xs font-black text-blue-300 uppercase tracking-wider">Say This</p>
              </div>
              <button
                onClick={speakComplaint}
                disabled={ttsPlaying}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/30 border border-blue-600/40 text-blue-300 text-xs font-semibold disabled:opacity-50"
              >
                <Volume2 className="h-3.5 w-3.5" />
                {ttsPlaying ? "Playing…" : "Play"}
              </button>
            </div>
            <p className="text-xl font-semibold text-[#f0f4ff] leading-relaxed">
              "{casualty.audio_profile.primary_complaint}"
            </p>
          </div>
        )}

        {/* How to act */}
        <div className="rounded-2xl border border-[#1e2330] bg-[#0a0c10] p-5 space-y-3">
          <p className="text-xs font-black text-[#6b7594] uppercase tracking-wider">How to Act</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Pain", value: `${casualty.pain_level} / 10`, color: painColor },
              { label: "AVPU", value: vitals.avpu, color: "text-[#f0f4ff]" },
              { label: "Airway", value: casualty.airway_status.replace(/_/g, " "), color: casualty.airway_status === "patent" ? "text-green-400" : "text-red-400" },
              { label: "Breathing", value: casualty.breathing_status.replace(/_/g, " "), color: "text-[#9daabf]" },
            ].map((row) => (
              <div key={row.label} className="rounded-xl border border-[#1e2330] bg-[#060708] px-3 py-2.5">
                <p className="text-[10px] text-[#3e465e] uppercase tracking-wider">{row.label}</p>
                <p className={cn("text-sm font-bold capitalize", row.color)}>{row.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-[#1e2330] bg-[#060708] px-4 py-3">
            <p className="text-[10px] text-[#3e465e] uppercase tracking-wider mb-1">Act like</p>
            <p className="text-sm text-[#9daabf]">
              {casualty.pain_level >= 8
                ? "Severe distress — writhing, moaning, unable to focus"
                : casualty.pain_level >= 5
                  ? "Moderate pain — grimacing, short sentences, guarding injury"
                  : "Mild discomfort — can speak, aware of surroundings"}
            </p>
          </div>
        </div>

        {/* Visible injuries */}
        <div className="rounded-2xl border border-[#1e2330] bg-[#0a0c10] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black text-[#6b7594] uppercase tracking-wider">Visible Injuries</p>
            <button
              onClick={speakInjuries}
              disabled={ttsPlaying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2330] border border-[#2d3347] text-[#6b7594] text-xs font-semibold disabled:opacity-50"
            >
              <Volume2 className="h-3 w-3" />
              Read
            </button>
          </div>
          <div className="space-y-2">
            {casualty.visible_injuries.length === 0 ? (
              <p className="text-xs text-[#4a5370]">No visible injuries</p>
            ) : casualty.visible_injuries.map((inj, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-[#1e2330] bg-[#060708] px-3 py-2.5">
                <div className={cn(
                  "h-2.5 w-2.5 rounded-full shrink-0",
                  inj.severity === "critical" || inj.severity === "severe" ? "bg-red-500" :
                  inj.severity === "moderate" ? "bg-amber-500" : "bg-green-500"
                )} />
                <div>
                  <span className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider mr-2",
                    inj.severity === "critical" || inj.severity === "severe" ? "text-red-400" :
                    inj.severity === "moderate" ? "text-amber-400" : "text-green-400"
                  )}>
                    {inj.severity}
                  </span>
                  <span className="text-sm text-[#d3dce8] capitalize">
                    {inj.type} — {inj.location}{inj.laterality ? ` (${inj.laterality})` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Vitals */}
        <div className="rounded-2xl border border-[#1e2330] bg-[#0a0c10] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-black text-[#6b7594] uppercase tracking-wider">
                {vitalsLive ? "Live Vitals" : "Baseline Vitals"}
              </p>
              {vitalsLive && viewStatus === "active" && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9px] text-green-400 font-semibold uppercase tracking-wider">Live</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-[#4a5370]">Show to treater</p>
              <button
                onClick={() => { unlockAudio(); speak(buildVitalsScript(vitals), true) }}
                disabled={ttsPlaying}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1e2330] border border-[#2d3347] text-[#6b7594] text-[10px] font-semibold disabled:opacity-50"
              >
                <Volume2 className="h-3 w-3" />
                Read
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "HR", value: vitals.hr, unit: "bpm", crit: vitals.hr > 130 || vitals.hr < 50 },
              { label: "RR", value: vitals.rr, unit: "/min", crit: vitals.rr > 30 || vitals.rr < 8 },
              { label: "SBP", value: vitals.sbp, unit: "mmHg", crit: vitals.sbp < 80 },
              { label: "SpO₂", value: `${vitals.spo2}%`, unit: "", crit: vitals.spo2 < 90 },
            ].map((v) => (
              <div key={v.label} className={cn(
                "rounded-xl border p-3 text-center",
                v.crit ? "border-red-800/50 bg-red-950/20" : "border-[#1e2330] bg-[#060708]"
              )}>
                <p className="text-[9px] text-[#3e465e] uppercase mb-0.5">{v.label}</p>
                <p className={cn("text-lg font-black font-mono", v.crit ? "text-red-400" : "text-[#f0f4ff]")}>
                  {v.value}
                </p>
                {v.unit && <p className="text-[9px] text-[#3e465e]">{v.unit}</p>}
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[#1e2330] bg-[#060708] px-3 py-2">
              <p className="text-[9px] text-[#3e465e] uppercase mb-0.5">AVPU</p>
              <p className="text-base font-black font-mono text-[#f0f4ff]">{vitals.avpu}</p>
            </div>
            {vitals.temp && (
              <div className="rounded-xl border border-[#1e2330] bg-[#060708] px-3 py-2">
                <p className="text-[9px] text-[#3e465e] uppercase mb-0.5">Temp</p>
                <p className="text-base font-black font-mono text-[#f0f4ff]">{vitals.temp}°F</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-[#1e2330] bg-[#070809] px-5 py-3 flex items-center justify-between">
        <p className="text-[10px] text-[#3e465e]">
          Proctor controls scenario · Code: <span className="font-mono text-[#4a5370]">{token}</span>
        </p>
        <button
          onClick={fetchData}
          className="text-[10px] text-[#3e465e] flex items-center gap-1 hover:text-[#6b7594]"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>
    </div>
  )
}
