// === AEGIS MEDIC PROCTOR — PHYSIOLOGY SIMULATION ENGINE ===
// This is a TRAINING SIMULATION ENGINE — not clinical decision support.
// All state changes are traceable to: initial profile, elapsed time,
// logged interventions, scenario triggers, and doctrine-linked expectations.
// No AI is used to determine physiologic truth. Rules are explicit and auditable.

import type { VitalSigns, CasualtyProfile, Intervention } from "@/lib/types"

export type SimulationEvent = {
  type: "vitals_update" | "status_change" | "deterioration" | "improvement" | "critical_threshold" | "intervention_applied"
  description: string
  data: Record<string, unknown>
  elapsed_seconds: number
}

export interface SimulationState {
  casualty_id: string
  elapsed_seconds: number
  current_vitals: VitalSigns
  airway_status: string
  breathing_status: string
  circulation_state: string
  neurologic_status: string
  triage_category: string
  estimated_blood_loss_ml: number
  shock_index: number
  outcome: "alive" | "deceased" | "evacuated" | "unknown"
  events: SimulationEvent[]
}

// ---- INTERVENTION EFFECT DEFINITIONS ----
// These are training simulation effects, not clinical outcomes.
// Effects are bounded, time-windowed, and reversible where appropriate.

interface InterventionEffect {
  action_type: string
  conditions: { circulation?: string; airway?: string; breathing?: string }
  effects: Partial<{
    hemorrhage_rate_modifier: number  // 0 = stopped, 0.5 = halved, 1 = unchanged
    hr_change: number
    sbp_change: number
    rr_change: number
    spo2_change: number
    blood_loss_rate_modifier: number
    airway_status_change: string
    breathing_status_change: string
    circulation_change: string
    effect_duration_seconds: number
    description: string
  }>
}

// Constrained intervention effects — trainers review these for their orgs
const INTERVENTION_EFFECTS: InterventionEffect[] = [
  {
    action_type: "tourniquet_application",
    conditions: { circulation: "active_hemorrhage" },
    effects: {
      hemorrhage_rate_modifier: 0.05,
      blood_loss_rate_modifier: 0.05,
      hr_change: -5,
      sbp_change: 5,
      effect_duration_seconds: 99999,
      description: "Tourniquet applied — simulating significantly reduced hemorrhage rate",
    },
  },
  {
    action_type: "wound_packing",
    conditions: { circulation: "active_hemorrhage" },
    effects: {
      hemorrhage_rate_modifier: 0.3,
      blood_loss_rate_modifier: 0.3,
      hr_change: -3,
      effect_duration_seconds: 99999,
      description: "Wound packing applied — simulating reduced hemorrhage rate",
    },
  },
  {
    action_type: "airway_npa",
    conditions: { airway: "partially_obstructed" },
    effects: {
      airway_status_change: "npa_placed",
      spo2_change: 4,
      rr_change: -3,
      effect_duration_seconds: 99999,
      description: "NPA placed — simulating improved airway patency",
    },
  },
  {
    action_type: "needle_decompression",
    conditions: { breathing: "labored" },
    effects: {
      spo2_change: 6,
      rr_change: -4,
      sbp_change: 10,
      effect_duration_seconds: 1800,
      description: "Needle decompression — simulating tension PTX relief",
    },
  },
  {
    action_type: "iv_access",
    conditions: {},
    effects: {
      description: "IV access established — enables fluid/medication administration",
      effect_duration_seconds: 99999,
    },
  },
  {
    action_type: "fluid_resuscitation",
    conditions: { circulation: "shock_decompensated" },
    effects: {
      hr_change: -12,
      sbp_change: 20,
      effect_duration_seconds: 600,
      description: "Fluid resuscitation — simulating temporary hemodynamic improvement",
    },
  },
  {
    action_type: "hypothermia_prevention",
    conditions: {},
    effects: {
      description: "Hypothermia prevention measures applied",
      effect_duration_seconds: 99999,
    },
  },
  {
    action_type: "airway_surgical",
    conditions: { airway: "obstructed" },
    effects: {
      airway_status_change: "surgical_airway",
      spo2_change: 10,
      rr_change: -5,
      effect_duration_seconds: 99999,
      description: "Surgical airway established — simulating restored ventilation",
    },
  },
]

// ---- DETERIORATION RATES ----
// How much vitals change per minute without intervention, by shock state

const DETERIORATION_RATES = {
  none: { hr: 0, sbp: 0, spo2: 0, blood_loss_per_min: 0 },
  compensated: { hr: 3, sbp: -2, spo2: -0.5, blood_loss_per_min: 60 },
  decompensated: { hr: 8, sbp: -5, spo2: -1, blood_loss_per_min: 150 },
  respiratory: { hr: 4, sbp: -1, spo2: -2, blood_loss_per_min: 0 },
}

// ---- SHOCK INDEX CALCULATION ----
export function calculateShockIndex(hr: number, sbp: number): number {
  if (sbp <= 0) return 10
  return Math.round((hr / sbp) * 100) / 100
}

// ---- DETERMINE SHOCK STATE ----
export function determineShockState(vitals: VitalSigns, bloodLossML: number): string {
  const si = calculateShockIndex(vitals.hr, vitals.sbp)
  if (bloodLossML > 2000 || si > 1.5 || vitals.sbp < 70) return "shock_decompensated"
  if (bloodLossML > 750 || si > 0.9 || vitals.sbp < 90) return "shock_compensated"
  return "normal"
}

// ---- APPLY DETERIORATION STEP ----
export function applyDeteriorationStep(
  state: SimulationState,
  intervalSeconds: number,
  profile: CasualtyProfile
): { updatedState: SimulationState; events: SimulationEvent[] } {
  const events: SimulationEvent[] = []
  const vitals = { ...state.current_vitals }
  let bloodLoss = state.estimated_blood_loss_ml

  const rate = profile.deterioration_profile.rate
  const isActiveHemorrhage = state.circulation_state === "active_hemorrhage"
  const isDecompensated = state.circulation_state === "shock_decompensated"
  const isCompensated = state.circulation_state === "shock_compensated"
  const isRespiratoryCompromise = state.breathing_status === "labored" || state.breathing_status === "shallow"

  const intervalMinutes = intervalSeconds / 60

  // Blood loss
  if (isActiveHemorrhage) {
    const detRates = DETERIORATION_RATES[isDecompensated ? "decompensated" : "compensated"]
    bloodLoss += detRates.blood_loss_per_min * intervalMinutes * (rate === "rapid" ? 2 : rate === "slow" ? 0.5 : 1)
  }

  // Hemodynamic deterioration
  if (isDecompensated || isActiveHemorrhage) {
    const detRates = DETERIORATION_RATES[isDecompensated ? "decompensated" : "compensated"]
    const modifier = rate === "rapid" ? 2 : rate === "slow" ? 0.5 : 1
    vitals.hr = Math.min(180, vitals.hr + detRates.hr * intervalMinutes * modifier)
    vitals.sbp = Math.max(40, vitals.sbp + detRates.sbp * intervalMinutes * modifier)
  }

  // Respiratory deterioration
  if (isRespiratoryCompromise) {
    vitals.spo2 = Math.max(60, vitals.spo2 + DETERIORATION_RATES.respiratory.spo2 * intervalMinutes)
  }

  // Death check
  const shockIndex = calculateShockIndex(vitals.hr, vitals.sbp)
  if (vitals.sbp < 40 || bloodLoss > 4500 || (vitals.spo2 < 70 && isRespiratoryCompromise)) {
    if (state.outcome !== "deceased") {
      events.push({
        type: "critical_threshold",
        description: "Critical threshold reached — casualty outcome: deceased (simulation)",
        data: { vitals, blood_loss: bloodLoss },
        elapsed_seconds: state.elapsed_seconds,
      })
    }
    return {
      updatedState: {
        ...state,
        current_vitals: vitals,
        estimated_blood_loss_ml: bloodLoss,
        shock_index: shockIndex,
        outcome: "deceased",
        triage_category: "deceased",
        circulation_state: "shock_decompensated",
        neurologic_status: "unresponsive",
        events: [],
      },
      events,
    }
  }

  // Update circulation state based on new blood loss
  const newCirculation = isActiveHemorrhage
    ? determineShockState(vitals, bloodLoss)
    : state.circulation_state

  return {
    updatedState: {
      ...state,
      current_vitals: vitals,
      estimated_blood_loss_ml: Math.round(bloodLoss),
      shock_index: shockIndex,
      circulation_state: newCirculation,
    },
    events,
  }
}

// ---- APPLY INTERVENTION EFFECT ----
export function applyInterventionEffect(
  state: SimulationState,
  intervention: Partial<Intervention>
): { updatedState: SimulationState; events: SimulationEvent[] } {
  const events: SimulationEvent[] = []

  const matchingEffect = INTERVENTION_EFFECTS.find((e) => {
    if (e.action_type !== intervention.action_type) return false
    if (e.conditions.circulation && e.conditions.circulation !== state.circulation_state) return false
    if (e.conditions.airway && e.conditions.airway !== state.airway_status) return false
    if (e.conditions.breathing && e.conditions.breathing !== state.breathing_status) return false
    return true
  })

  if (!matchingEffect) {
    return { updatedState: state, events }
  }

  const { effects } = matchingEffect
  const vitals = { ...state.current_vitals }

  if (effects.hr_change !== undefined) vitals.hr = Math.max(30, vitals.hr + effects.hr_change)
  if (effects.sbp_change !== undefined) vitals.sbp = Math.max(40, vitals.sbp + effects.sbp_change)
  if (effects.rr_change !== undefined) vitals.rr = Math.max(4, vitals.rr + effects.rr_change)
  if (effects.spo2_change !== undefined) vitals.spo2 = Math.min(100, vitals.spo2 + effects.spo2_change)

  events.push({
    type: "intervention_applied",
    description: effects.description ?? `Intervention applied: ${intervention.action_type}`,
    data: {
      intervention_type: intervention.action_type,
      effects_applied: effects,
    },
    elapsed_seconds: state.elapsed_seconds,
  })

  return {
    updatedState: {
      ...state,
      current_vitals: vitals,
      shock_index: calculateShockIndex(vitals.hr, vitals.sbp),
      airway_status: effects.airway_status_change ?? state.airway_status,
      breathing_status: effects.breathing_status_change ?? state.breathing_status,
      circulation_state: effects.circulation_change ?? state.circulation_state,
    },
    events,
  }
}

// ---- INITIALIZE SIMULATION STATE FROM PROFILE ----
export function initializeSimulationState(
  profile: CasualtyProfile,
  runId: string
): SimulationState {
  return {
    casualty_id: profile.id,
    elapsed_seconds: 0,
    current_vitals: { ...profile.baseline_vitals },
    airway_status: profile.airway_status,
    breathing_status: profile.breathing_status,
    circulation_state: profile.circulation_state,
    neurologic_status: profile.neurologic_status,
    triage_category: profile.triage_category,
    estimated_blood_loss_ml: profile.circulation_state === "active_hemorrhage" ? 500
      : profile.circulation_state === "shock_compensated" ? 1000
      : profile.circulation_state === "shock_decompensated" ? 2000 : 0,
    shock_index: calculateShockIndex(profile.baseline_vitals.hr, profile.baseline_vitals.sbp),
    outcome: "unknown",
    events: [],
  }
}

// ---- VITAL SIGN STATUS ----
export function getVitalStatus(
  vitalKey: keyof typeof VITAL_RANGES,
  value: number
): "normal" | "abnormal" | "critical" {
  const range = VITAL_RANGES[vitalKey]
  if (value <= range.criticalLow || value >= range.criticalHigh) return "critical"
  if (value < range.min || value > range.max) return "abnormal"
  return "normal"
}

export const VITAL_RANGES = {
  hr: { min: 60, max: 100, criticalLow: 40, criticalHigh: 150 },
  rr: { min: 12, max: 20, criticalLow: 6, criticalHigh: 35 },
  sbp: { min: 90, max: 140, criticalLow: 70, criticalHigh: 200 },
  spo2: { min: 95, max: 100, criticalLow: 85, criticalHigh: 100 },
}
