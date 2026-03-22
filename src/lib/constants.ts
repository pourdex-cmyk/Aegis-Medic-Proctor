// === AEGIS MEDIC PROCTOR — APPLICATION CONSTANTS ===

export const APP_NAME = "Aegis Medic Proctor"
export const APP_TAGLINE = "AI-First Tactical Medicine Proctoring Platform"
export const APP_DESCRIPTION =
  "Scenario generation, multi-casualty orchestration, realtime proctoring, and doctrine-aligned after-action reporting for military, law enforcement, and EMS training."

export const APP_VERSION = "1.0.0"
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

// === ORGANIZATION TYPES ===
export const ORG_TYPES = [
  { value: "military", label: "Military / DOD", icon: "Shield" },
  { value: "law_enforcement", label: "Law Enforcement / TEMS", icon: "Badge" },
  { value: "ems", label: "Emergency Medical Services", icon: "Ambulance" },
  { value: "training_institution", label: "Training Institution", icon: "GraduationCap" },
  { value: "other", label: "Other", icon: "Building" },
] as const

// === USER ROLES ===
export const USER_ROLES = [
  { value: "org_admin", label: "Organization Admin", description: "Full platform access, user management, billing" },
  { value: "lead_proctor", label: "Lead Proctor", description: "Create and run scenarios, access all AAR data" },
  { value: "assistant_proctor", label: "Assistant Proctor", description: "Participate in live runs, log treatments" },
  { value: "evaluator", label: "Evaluator / OC", description: "Grade scenarios, write evaluator notes, access reports" },
  { value: "observer", label: "Observer", description: "View-only access to live runs and reports" },
  { value: "role_player_coordinator", label: "Role Player Coordinator", description: "Manage audio cues and patient scripts" },
  { value: "doctrine_sme", label: "Doctrine SME", description: "Review and approve doctrine extractions" },
  { value: "trainee", label: "Trainee", description: "Limited access — view personal AAR only" },
] as const

// === TRAINING ENVIRONMENTS ===
export const TRAINING_ENVIRONMENTS = [
  "Urban / City",
  "Rural / Farmland",
  "Woodland / Forest",
  "Desert / Arid",
  "Mountain / High Altitude",
  "Indoor / CQB Structure",
  "Roadside / IED Scenario",
  "Maritime / Littoral",
  "Austere / Permissive",
  "Industrial / Complex",
  "Arctic / Cold Weather",
  "Jungle / Tropical",
] as const

// === SCENARIO TYPES ===
export const SCENARIO_TYPES = [
  { value: "tccc", label: "TCCC / Tactical Combat Casualty Care" },
  { value: "tems", label: "TEMS / Tactical Emergency Medical Support" },
  { value: "mascal", label: "MASCAL / Mass Casualty" },
  { value: "trauma_management", label: "Trauma Management" },
  { value: "airway_management", label: "Airway-Focused Management" },
  { value: "hemorrhage_control", label: "Hemorrhage Control" },
  { value: "triage_exercise", label: "Triage Exercise" },
  { value: "evacuation", label: "Evacuation / CASEVAC / MEDEVAC" },
  { value: "preventive_medicine", label: "Environmental / Preventive Medicine" },
] as const

// === TRIAGE CATEGORIES ===
export const TRIAGE_CATEGORIES = {
  T1: { label: "T1 — Immediate", color: "#e53e3e", bgColor: "rgba(220,38,38,0.15)", description: "Life-threatening — treat within minutes" },
  T2: { label: "T2 — Delayed", color: "#f59e0b", bgColor: "rgba(245,158,11,0.15)", description: "Serious — treat within hours" },
  T3: { label: "T3 — Minimal", color: "#22c55e", bgColor: "rgba(34,197,94,0.15)", description: "Minor — treat when resources allow" },
  T4: { label: "T4 — Expectant", color: "#9333ea", bgColor: "rgba(147,51,234,0.15)", description: "Unsurvivable with available resources" },
  DECEASED: { label: "Deceased", color: "#6b7594", bgColor: "rgba(107,117,148,0.15)", description: "KIA / no survivable injury pattern" },
} as const

// === VITAL SIGN NORMAL RANGES ===
export const VITAL_RANGES = {
  hr: { min: 60, max: 100, criticalLow: 40, criticalHigh: 150, unit: "bpm" },
  rr: { min: 12, max: 20, criticalLow: 6, criticalHigh: 35, unit: "/min" },
  sbp: { min: 90, max: 140, criticalLow: 70, criticalHigh: 200, unit: "mmHg" },
  dbp: { min: 60, max: 90, criticalLow: 40, criticalHigh: 120, unit: "mmHg" },
  spo2: { min: 95, max: 100, criticalLow: 85, criticalHigh: 100, unit: "%" },
  temp: { min: 36.5, max: 37.5, criticalLow: 32, criticalHigh: 40, unit: "°C" },
} as const

// === AIRWAY STATUS ===
export const AIRWAY_STATUS = [
  { value: "patent", label: "Patent", color: "stable" },
  { value: "partially_obstructed", label: "Partially Obstructed", color: "alert" },
  { value: "obstructed", label: "Obstructed", color: "critical" },
  { value: "surgical_airway", label: "Surgical Airway", color: "alert" },
  { value: "npa_placed", label: "NPA Placed", color: "stable" },
  { value: "opa_placed", label: "OPA Placed", color: "alert" },
  { value: "intubated", label: "Intubated", color: "stable" },
] as const

// === CONSCIOUSNESS LEVELS ===
export const AVPU_LEVELS = [
  { value: "A", label: "Alert", color: "stable" },
  { value: "V", label: "Responds to Voice", color: "alert" },
  { value: "P", label: "Responds to Pain", color: "critical" },
  { value: "U", label: "Unresponsive", color: "critical" },
] as const

// === SHOCK STATES ===
export const SHOCK_STATES = [
  { value: "compensated", label: "Compensated", color: "alert" },
  { value: "decompensated", label: "Decompensated", color: "critical" },
  { value: "irreversible", label: "Irreversible", color: "critical" },
  { value: "none", label: "No Shock", color: "stable" },
] as const

// === DOCTRINE PACK CATEGORIES ===
export const DOCTRINE_CATEGORIES = [
  { value: "hemorrhage_control", label: "Hemorrhage Control" },
  { value: "airway_management", label: "Airway Management" },
  { value: "breathing_respiration", label: "Breathing / Respiration" },
  { value: "circulation_shock", label: "Circulation / Shock" },
  { value: "hypothermia_prevention", label: "Hypothermia Prevention" },
  { value: "pain_management", label: "Pain Management" },
  { value: "infection_prevention", label: "Infection Prevention" },
  { value: "triage", label: "Triage Protocols" },
  { value: "evacuation", label: "Casualty Evacuation" },
  { value: "documentation", label: "Field Documentation" },
  { value: "communication", label: "Communication Protocols" },
  { value: "leadership", label: "Leadership / CUF" },
] as const

// === SCORING DIMENSIONS ===
export const SCORING_DIMENSIONS = [
  { key: "critical_actions", label: "Critical Actions", weight: 0.35, description: "Completion of doctrine-mandated life-saving interventions" },
  { key: "sequence", label: "Sequence Compliance", weight: 0.15, description: "Adherence to treatment priority order" },
  { key: "timing", label: "Timing", weight: 0.2, description: "Speed of recognition and intervention" },
  { key: "reassessment", label: "Reassessment", weight: 0.1, description: "Ongoing patient monitoring and response" },
  { key: "communication", label: "Communication", weight: 0.1, description: "Verbal reports, MIST/9-line, team coordination" },
  { key: "documentation", label: "Documentation", weight: 0.05, description: "TCCC card, casualty card, or equivalent" },
  { key: "safety", label: "Safety", weight: 0.05, description: "Scene safety, self-aid, tactical awareness" },
] as const

// === AUDIO CUE CATEGORIES ===
export const AUDIO_CUE_CATEGORIES = [
  { value: "pain", label: "Pain Response", icon: "Zap" },
  { value: "panic", label: "Panic / Distress", icon: "AlertTriangle" },
  { value: "confusion", label: "Confusion / Disoriented", icon: "HelpCircle" },
  { value: "respiratory_distress", label: "Respiratory Distress", icon: "Wind" },
  { value: "assessment_response", label: "Response to Assessment", icon: "MessageCircle" },
  { value: "improving", label: "Improving", icon: "TrendingUp" },
  { value: "deteriorating", label: "Deteriorating", icon: "TrendingDown" },
  { value: "loss_of_consciousness", label: "Loss of Consciousness", icon: "Moon" },
  { value: "silent", label: "Silent / No Response", icon: "VolumeX" },
] as const

// === COMPLEXITY LEVELS ===
export const COMPLEXITY_LEVELS = [
  { value: "basic", label: "Basic", description: "Straightforward single-system trauma, no hidden complications" },
  { value: "intermediate", label: "Intermediate", description: "Multi-system involvement, one hidden complication" },
  { value: "advanced", label: "Advanced", description: "Multiple hidden complications, non-linear deterioration" },
  { value: "expert", label: "Expert", description: "Complex multi-casualty with deceptive presentation and leadership demands" },
] as const

// === ROUTES ===
export const ROUTES = {
  home: "/",
  signIn: "/auth/sign-in",
  signUp: "/auth/sign-up",
  forgotPassword: "/auth/forgot-password",
  onboarding: "/onboarding",
  dashboard: "/app/dashboard",
  scenarios: "/app/scenarios",
  scenarioNew: "/app/scenarios/new",
  scenarioDetail: (id: string) => `/app/scenarios/${id}`,
  scenarioRun: (id: string) => `/app/scenarios/${id}/run`,
  casualties: "/app/casualties",
  doctrine: "/app/doctrine",
  reports: "/app/reports",
  analytics: "/app/analytics",
  admin: "/app/admin",
  audit: "/app/admin/audit",
  settings: "/app/settings",
  rolePlayer: "/role-player",
} as const

// === NAVIGATION ===
export const APP_NAV_ITEMS = [
  { href: "/app/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/app/scenarios", label: "Scenarios", icon: "Target" },
  { href: "/app/casualties", label: "Casualties", icon: "Users" },
  { href: "/app/doctrine", label: "Doctrine", icon: "BookOpen" },
  { href: "/app/reports", label: "Reports", icon: "FileText" },
  { href: "/app/analytics", label: "Analytics", icon: "BarChart3" },
] as const

export const ADMIN_NAV_ITEMS = [
  { href: "/app/admin", label: "Organization", icon: "Building2" },
  { href: "/app/admin/users", label: "Users", icon: "UserCog" },
  { href: "/app/admin/audit", label: "Audit Log", icon: "ScrollText" },
  { href: "/app/settings", label: "Settings", icon: "Settings" },
] as const
