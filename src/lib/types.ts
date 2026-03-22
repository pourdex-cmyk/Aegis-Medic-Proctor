// === AEGIS MEDIC PROCTOR — CORE TYPE DEFINITIONS ===

// ---- BASE TYPES ----
export type Uuid = string
export type Timestamp = string
export type Json = Record<string, unknown>

// ---- ORGANIZATION ----
export interface Organization {
  id: Uuid
  name: string
  slug: string
  type: "military" | "law_enforcement" | "ems" | "training_institution" | "other"
  logo_url?: string
  settings: OrganizationSettings
  created_at: Timestamp
  updated_at: Timestamp
}

export interface OrganizationSettings {
  default_doctrine_pack_id?: string
  allow_ai_treatment_interpretation: boolean
  require_doctrine_approval: boolean
  enable_audio_system: boolean
  grading_strictness: "lenient" | "standard" | "strict"
  branding?: {
    primary_color?: string
    logo_url?: string
    watermark_reports?: boolean
  }
}

export interface OrganizationMember {
  id: Uuid
  org_id: Uuid
  user_id: Uuid
  role: UserRole
  display_name: string
  email: string
  avatar_url?: string
  is_active: boolean
  joined_at: Timestamp
}

export type UserRole =
  | "org_admin"
  | "lead_proctor"
  | "assistant_proctor"
  | "evaluator"
  | "observer"
  | "role_player_coordinator"
  | "doctrine_sme"
  | "trainee"

// ---- DOCTRINE ----
export interface DoctrinePack {
  id: Uuid
  org_id: Uuid
  name: string
  version: string
  audience: "military" | "law_enforcement" | "ems" | "universal"
  status: "draft" | "pending_approval" | "approved" | "archived"
  description?: string
  source_reference?: string
  approved_by?: Uuid
  approved_at?: Timestamp
  created_at: Timestamp
  updated_at: Timestamp
  document_count: number
  rule_count: number
}

export interface DoctrineDocument {
  id: Uuid
  pack_id: Uuid
  org_id: Uuid
  title: string
  file_url?: string
  content_text?: string
  file_type: "pdf" | "docx" | "txt" | "md"
  status: "processing" | "chunked" | "indexed" | "error"
  chunk_count: number
  created_at: Timestamp
}

export interface DoctrineChunk {
  id: Uuid
  document_id: Uuid
  pack_id: Uuid
  content: string
  page_number?: number
  section_title?: string
  embedding?: number[]
  metadata: Json
  created_at: Timestamp
}

export interface DoctrineRule {
  id: Uuid
  pack_id: Uuid
  chunk_id?: Uuid
  category: string
  title: string
  description: string
  critical_action: boolean
  timing_expectation?: string
  failure_condition?: string
  priority?: number
  source_citation?: string
  approval_status: "pending" | "approved" | "rejected"
  approved_by?: Uuid
  created_at: Timestamp
}

// ---- SCENARIO ----
export interface Scenario {
  id: Uuid
  org_id: Uuid
  doctrine_pack_id?: Uuid
  created_by: Uuid
  title: string
  description?: string
  audience: "military" | "law_enforcement" | "ems"
  environment: string
  scenario_type: string
  complexity: "basic" | "intermediate" | "advanced" | "expert"
  casualty_count: number
  evac_delay_minutes: number
  status: "draft" | "ready" | "archived"
  ai_generated: boolean
  settings: ScenarioSettings
  objectives: ScenarioObjective[]
  overview_narrative?: string
  instructor_notes?: string
  tags: string[]
  created_at: Timestamp
  updated_at: Timestamp
}

export interface ScenarioSettings {
  hidden_complications: boolean
  equipment_limitations: string[]
  weather_stressors: string[]
  triage_emphasis: number
  airway_emphasis: number
  hemorrhage_emphasis: number
  multisystem_emphasis: number
  leadership_emphasis: number
  audio_intensity: "minimal" | "moderate" | "high"
  grading_strictness: "lenient" | "standard" | "strict"
}

export interface ScenarioObjective {
  id: string
  text: string
  category: string
  critical: boolean
}

export interface ScenarioInject {
  id: Uuid
  scenario_id: Uuid
  title: string
  description: string
  trigger_type: "time" | "manual" | "condition"
  trigger_time_seconds?: number
  trigger_condition?: string
  effect_description?: string
  affects_casualty_id?: Uuid
  created_at: Timestamp
}

// ---- CASUALTY ----
export interface CasualtyProfile {
  id: Uuid
  scenario_id: Uuid
  org_id: Uuid
  callsign: string
  display_label: string
  age?: number
  sex?: "male" | "female"
  weight_kg?: number
  mechanism_of_injury: string
  visible_injuries: InjuryItem[]
  suspected_internal_injuries: InjuryItem[]
  hidden_complications: InjuryItem[]
  airway_status: AirwayStatus
  breathing_status: BreathingStatus
  circulation_state: CirculationState
  neurologic_status: NeurologicStatus
  pain_level: number
  mental_status: string
  baseline_vitals: VitalSigns
  deterioration_profile: DeteriorationProfile
  triage_category: TriageCategory
  audio_profile: AudioProfile
  ai_generated: boolean
  proctor_notes?: string
  reveal_hidden_to_proctor: boolean
  created_at: Timestamp
  updated_at: Timestamp
}

export interface InjuryItem {
  id: string
  type: string
  location: string
  severity: "minor" | "moderate" | "severe" | "critical"
  laterality?: "left" | "right" | "bilateral" | "midline"
  description: string
  visible_to_trainee: boolean
}

export type AirwayStatus = "patent" | "partially_obstructed" | "obstructed" | "surgical_airway" | "npa_placed" | "opa_placed" | "intubated"
export type BreathingStatus = "normal" | "labored" | "shallow" | "agonal" | "absent" | "assisted"
export type CirculationState = "normal" | "hemorrhage_controlled" | "active_hemorrhage" | "shock_compensated" | "shock_decompensated"
export type NeurologicStatus = "intact" | "altered" | "unresponsive"
export type TriageCategory = "T1" | "T2" | "T3" | "T4" | "deceased"

export interface VitalSigns {
  hr: number
  rr: number
  sbp: number
  dbp: number
  spo2: number
  temp: number
  gcs?: number
  avpu: "A" | "V" | "P" | "U"
  recorded_at?: Timestamp
}

export interface DeteriorationProfile {
  rate: "rapid" | "moderate" | "slow" | "stable"
  primary_pathway: string
  time_to_critical_seconds?: number
  intervention_sensitivity: Record<string, "high" | "medium" | "low">
}

export interface AudioProfile {
  verbosity: "silent" | "minimal" | "moderate" | "expressive"
  primary_complaint?: string
  auto_trigger_conditions: AutoTriggerCondition[]
}

export interface AutoTriggerCondition {
  condition: string
  cue_category: string
  delay_seconds: number
}

// ---- SCENARIO RUN ----
export interface ScenarioRun {
  id: Uuid
  scenario_id: Uuid
  org_id: Uuid
  lead_proctor_id: Uuid
  title?: string
  status: "scheduled" | "active" | "paused" | "completed" | "aborted"
  started_at?: Timestamp
  paused_at?: Timestamp
  completed_at?: Timestamp
  clock_seconds: number
  speed_multiplier: number
  created_at: Timestamp
}

export interface RunParticipant {
  id: Uuid
  run_id: Uuid
  user_id: Uuid
  role: "lead_proctor" | "assistant_proctor" | "evaluator" | "observer" | "role_player_coordinator"
  joined_at: Timestamp
}

export interface ProctorAssignment {
  id: Uuid
  run_id: Uuid
  casualty_id: Uuid
  proctor_id: Uuid
  assigned_at: Timestamp
  released_at?: Timestamp
}

// ---- CASUALTY STATE (LIVE) ----
export interface CasualtyState {
  id: Uuid
  run_id: Uuid
  casualty_id: Uuid
  current_vitals: VitalSigns
  airway_status: AirwayStatus
  breathing_status: BreathingStatus
  circulation_state: CirculationState
  neurologic_status: NeurologicStatus
  triage_category: TriageCategory
  outcome: "alive" | "deceased" | "evacuated" | "unknown"
  estimated_blood_loss_ml: number
  shock_index: number
  interventions_applied: string[]
  last_reassessed_at?: Timestamp
  updated_at: Timestamp
}

export interface CasualtyStateEvent {
  id: Uuid
  run_id: Uuid
  casualty_id: Uuid
  event_type: "vitals_update" | "status_change" | "intervention_applied" | "reassessment" | "hidden_reveal" | "deterioration" | "improvement"
  description: string
  data: Json
  triggered_by: "system" | "proctor" | "scenario_inject"
  actor_id?: Uuid
  elapsed_seconds: number
  created_at: Timestamp
}

// ---- INTERVENTIONS ----
export interface Intervention {
  id: Uuid
  run_id: Uuid
  casualty_id: Uuid
  proctor_id: Uuid
  raw_text?: string
  action_type: string
  body_location?: string
  laterality?: string
  quality?: string
  performer?: string
  confidence_score: number
  status: "pending_interpretation" | "interpreted" | "applied" | "rejected"
  elapsed_seconds: number
  notes?: string
  created_at: Timestamp
}

export interface InterventionInterpretation {
  id: Uuid
  intervention_id: Uuid
  action_type: string
  body_location?: string
  laterality?: "left" | "right" | "bilateral"
  quality?: string
  confidence: number
  ambiguity_flags: string[]
  effect_description?: string
  doctrine_rule_id?: Uuid
  created_at: Timestamp
}

// ---- AUDIO ----
export interface AudioCue {
  id: Uuid
  org_id: Uuid
  pack_id?: Uuid
  category: string
  title: string
  script_text: string
  intensity: "low" | "medium" | "high"
  voice_style?: string
  duration_seconds?: number
  tags: string[]
  is_system: boolean
  created_at: Timestamp
}

export interface AudioEvent {
  id: Uuid
  run_id: Uuid
  casualty_id?: Uuid
  cue_id?: Uuid
  triggered_by: "manual" | "automatic" | "scheduled"
  actor_id?: Uuid
  script_text: string
  played_at?: Timestamp
  elapsed_seconds: number
  status: "queued" | "playing" | "completed" | "skipped"
  created_at: Timestamp
}

// ---- GRADING & SCORING ----
export interface Rubric {
  id: Uuid
  org_id: Uuid
  doctrine_pack_id?: Uuid
  name: string
  description?: string
  scenario_type: string
  is_default: boolean
  dimension_weights: Record<string, number>
  created_at: Timestamp
}

export interface RubricItem {
  id: Uuid
  rubric_id: Uuid
  doctrine_rule_id?: Uuid
  category: string
  title: string
  description: string
  points_possible: number
  is_critical: boolean
  fail_condition?: string
  created_at: Timestamp
}

export interface Score {
  id: Uuid
  run_id: Uuid
  casualty_id?: Uuid
  rubric_id: Uuid
  evaluator_id: Uuid
  total_score: number
  max_possible: number
  percentage: number
  dimension_scores: Record<string, number>
  passed: boolean
  ai_narrative?: string
  evaluator_notes?: string
  created_at: Timestamp
}

// ---- REPORTS ----
export interface Report {
  id: Uuid
  run_id: Uuid
  org_id: Uuid
  generated_by: Uuid
  title: string
  status: "generating" | "ready" | "error"
  summary?: string
  ai_narrative?: string
  remediation_plan?: RecommendationItem[]
  strengths: string[]
  failures: string[]
  metadata: ReportMetadata
  created_at: Timestamp
}

export interface RecommendationItem {
  category: string
  action: string
  doctrine_reference?: string
  priority: "high" | "medium" | "low"
}

export interface ReportMetadata {
  doctrine_pack_used?: string
  casualty_count: number
  participant_count: number
  run_duration_seconds: number
  scenario_title: string
  run_date: string
}

// ---- AUDIT ----
export interface AuditLog {
  id: Uuid
  org_id: Uuid
  actor_id?: Uuid
  actor_display_name?: string
  action: string
  resource_type: string
  resource_id?: Uuid
  description: string
  metadata: Json
  ip_address?: string
  created_at: Timestamp
}

// ---- UI STATE ----
export interface ToastPayload {
  title: string
  description?: string
  variant?: "default" | "success" | "warning" | "critical" | "info"
  duration?: number
}

export interface ConfirmDialogOptions {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
  onConfirm: () => void | Promise<void>
}

export interface PageState {
  loading: boolean
  error?: string
}

// ---- AI OUTPUTS ----
export interface ScenarioGenerationOutput {
  title: string
  overview_narrative: string
  instructor_notes: string
  objectives: ScenarioObjective[]
  tags: string[]
  estimated_duration_minutes: number
  decision_traps: string[]
  expected_milestones: string[]
  grading_considerations: string[]
}

export interface CasualtyGenerationOutput {
  callsign: string
  mechanism_of_injury: string
  visible_injuries: InjuryItem[]
  suspected_internal_injuries: InjuryItem[]
  hidden_complications: InjuryItem[]
  airway_status: AirwayStatus
  breathing_status: BreathingStatus
  circulation_state: CirculationState
  neurologic_status: NeurologicStatus
  baseline_vitals: VitalSigns
  triage_category: TriageCategory
  primary_complaint: string
  generation_notes: string
}

export interface TreatmentInterpretationOutput {
  action_type: string
  body_location?: string
  laterality?: string
  quality?: string
  confidence: number
  ambiguity_flags: string[]
  effect_description?: string
}

export interface GradingNarrativeOutput {
  overall_narrative: string
  strengths: string[]
  failures: string[]
  missed_critical_actions: string[]
  remediation_recommendations: RecommendationItem[]
  trainee_summary: string
  instructor_summary: string
}
