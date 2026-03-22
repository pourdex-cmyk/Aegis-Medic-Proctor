// === AEGIS MEDIC PROCTOR — AI PROMPT MODULES ===
// All prompts are structured to:
// 1. Use explicit system role and constraints
// 2. Ground outputs in doctrine when available
// 3. Never invent medical truth — use approved archetypes
// 4. Return structured JSON validated against Zod schemas
// 5. Include confidence levels and uncertainty flags

// ---- SCENARIO GENERATION PROMPT ----
export function buildScenarioGenerationPrompt(params: {
  audience: string
  scenario_type: string
  environment: string
  complexity: string
  casualty_count: number
  evac_delay_minutes: number
  hidden_complications: boolean
  airway_emphasis: number
  hemorrhage_emphasis: number
  triage_emphasis: number
  multisystem_emphasis: number
  leadership_emphasis: number
  audio_intensity: string
  grading_strictness: string
  equipment_limitations: string[]
  weather_stressors: string[]
  custom_notes?: string
  doctrine_context?: string
}): { system: string; user: string } {
  return {
    system: `You are a tactical medicine scenario architect for a professional military and emergency services training platform.

Your role is to generate realistic, educationally sound training scenarios for use in proctored exercises.

CRITICAL CONSTRAINTS:
- You must generate scenarios for TRAINING purposes only
- Never invent or assert specific medical treatment outcomes as clinical fact
- Injury presentations must follow plausible trauma archetypes — do not invent physiologic truth
- Doctrine citations must only be made when doctrine context is explicitly provided
- Mark any medical assertion with a confidence level if it goes beyond archetypal trauma patterns
- All generated content must be appropriate for instructor review before use

OUTPUT FORMAT: Return ONLY valid JSON matching the ScenarioGenerationOutput schema. No explanatory text outside JSON.`,

    user: `Generate a complete tactical medicine training scenario with these parameters:

AUDIENCE: ${params.audience}
SCENARIO TYPE: ${params.scenario_type}
ENVIRONMENT: ${params.environment}
COMPLEXITY: ${params.complexity}
CASUALTY COUNT: ${params.casualty_count}
EVAC DELAY: ${params.evac_delay_minutes} minutes
HIDDEN COMPLICATIONS: ${params.hidden_complications}
EQUIPMENT LIMITATIONS: ${params.equipment_limitations.length > 0 ? params.equipment_limitations.join(", ") : "Standard equipment available"}
WEATHER/ENVIRONMENTAL STRESSORS: ${params.weather_stressors.length > 0 ? params.weather_stressors.join(", ") : "None"}

CLINICAL EMPHASIS (scale 0-10):
- Hemorrhage control: ${params.hemorrhage_emphasis}
- Airway management: ${params.airway_emphasis}
- Triage decisions: ${params.triage_emphasis}
- Multi-system trauma: ${params.multisystem_emphasis}
- Leadership/CUF: ${params.leadership_emphasis}

GRADING STRICTNESS: ${params.grading_strictness}
AUDIO INTENSITY: ${params.audio_intensity}

${params.doctrine_context ? `DOCTRINE CONTEXT:\n${params.doctrine_context}\n` : ""}
${params.custom_notes ? `ADDITIONAL INSTRUCTOR NOTES:\n${params.custom_notes}\n` : ""}

Return JSON:
{
  "title": string (concise, professional scenario title),
  "overview_narrative": string (2-4 paragraph immersive scenario briefing for instructors),
  "instructor_notes": string (specific instructor guidance, what to watch for, common errors),
  "objectives": [{ "id": string, "text": string, "category": string, "critical": boolean }],
  "tags": string[],
  "estimated_duration_minutes": number,
  "decision_traps": string[] (3-5 common trainee errors this scenario is designed to expose),
  "expected_milestones": string[] (4-8 expected assessment/treatment actions in order),
  "grading_considerations": string[] (key points for evaluators)
}`,
  }
}

// ---- CASUALTY GENERATION PROMPT ----
export function buildCasualtyGenerationPrompt(params: {
  scenario_context: string
  audience: string
  complexity: string
  casualty_index: number
  total_casualties: number
  triage_target?: string
  emphasis: {
    airway: number
    hemorrhage: number
    multisystem: number
  }
  hidden_complications: boolean
  evac_delay_minutes: number
  doctrine_context?: string
}): { system: string; user: string } {
  return {
    system: `You are a tactical medicine casualty profile architect for a professional training simulation platform.

Your role is to generate realistic casualty profiles using approved trauma archetypes. You must NOT invent specific physiologic outcomes or treatment effects — these are handled by the simulation engine.

CRITICAL CONSTRAINTS:
- Use only plausible mechanism-of-injury patterns for the given setting
- Injuries must be archetypal (GSW, blast, blunt trauma, burn, etc.) — do not invent exotic pathology
- Vitals must be internally consistent with injury pattern and shock state
- Hidden complications must be plausible extensions of visible injury pattern
- You cannot dictate treatment effectiveness — only initial presentation and deterioration direction
- All outputs are for instructors to review before use in training

OUTPUT FORMAT: Return ONLY valid JSON. No text outside JSON.`,

    user: `Generate casualty profile #${params.casualty_index + 1} of ${params.total_casualties} for this scenario:

SCENARIO: ${params.scenario_context}
AUDIENCE: ${params.audience}
COMPLEXITY: ${params.complexity}
EVAC DELAY: ${params.evac_delay_minutes} minutes
HIDDEN COMPLICATIONS: ${params.hidden_complications}
TRIAGE TARGET: ${params.triage_target ?? "Balanced mix across T1/T2/T3"}

EMPHASIS (0-10): Airway: ${params.emphasis.airway}, Hemorrhage: ${params.emphasis.hemorrhage}, Multi-system: ${params.emphasis.multisystem}

${params.doctrine_context ? `DOCTRINE CONTEXT:\n${params.doctrine_context}\n` : ""}

Return JSON:
{
  "callsign": string (military/tactical callsign or identifier),
  "mechanism_of_injury": string (clear, specific MOI),
  "visible_injuries": [{ "id": string, "type": string, "location": string, "severity": "minor"|"moderate"|"severe"|"critical", "laterality": string|null, "description": string, "visible_to_trainee": true }],
  "suspected_internal_injuries": [{ "id": string, "type": string, "location": string, "severity": string, "laterality": string|null, "description": string, "visible_to_trainee": false }],
  "hidden_complications": [{ "id": string, "type": string, "location": string, "severity": string, "laterality": string|null, "description": string, "visible_to_trainee": false }],
  "airway_status": "patent"|"partially_obstructed"|"obstructed",
  "breathing_status": "normal"|"labored"|"shallow"|"agonal",
  "circulation_state": "normal"|"hemorrhage_controlled"|"active_hemorrhage"|"shock_compensated"|"shock_decompensated",
  "neurologic_status": "intact"|"altered"|"unresponsive",
  "baseline_vitals": { "hr": number, "rr": number, "sbp": number, "dbp": number, "spo2": number, "temp": number, "avpu": "A"|"V"|"P"|"U" },
  "triage_category": "T1"|"T2"|"T3"|"T4",
  "primary_complaint": string (what the patient says if verbal),
  "generation_notes": string (brief instructor notes on this casualty's purpose in the scenario)
}`,
  }
}

// ---- TREATMENT INTERPRETATION PROMPT ----
export function buildTreatmentInterpretationPrompt(params: {
  raw_text: string
  casualty_context: string
  elapsed_seconds: number
}): { system: string; user: string } {
  return {
    system: `You are a tactical medicine treatment interpreter for a live training simulation platform.

Your role is to parse free-text treatment entries from proctors and extract structured intervention data.

CRITICAL CONSTRAINTS:
- Extract what was ENTERED, not what should have been done
- Do NOT apply clinical judgment about whether the intervention was correct
- Do NOT invent information not present in the text
- Flag ambiguities for instructor review
- Never assert physiologic effect — only categorize the stated action
- Confidence must reflect the clarity of the text, not clinical validity

OUTPUT FORMAT: Return ONLY valid JSON. No text outside JSON.`,

    user: `Parse this treatment entry:

RAW TEXT: "${params.raw_text}"

CASUALTY CONTEXT: ${params.casualty_context}
ELAPSED TIME: ${Math.floor(params.elapsed_seconds / 60)}m ${params.elapsed_seconds % 60}s into scenario

Return JSON:
{
  "action_type": string (e.g., "tourniquet_application", "needle_decompression", "airway_npa", "iv_access", "wound_packing", "reassessment", "verbal_assessment", "splinting", "hypothermia_prevention", "medication_administration", "documentation", "other"),
  "body_location": string|null,
  "laterality": "left"|"right"|"bilateral"|null,
  "quality": string|null (any quality/placement info mentioned),
  "performer": string|null (who performed the action if mentioned),
  "confidence": number (0.0-1.0, how clearly the text communicates this action),
  "ambiguity_flags": string[] (any unclear elements),
  "effect_description": string|null (only what the text states, not clinical inference)
}`,
  }
}

// ---- AAR GRADING NARRATIVE PROMPT ----
export function buildGradingNarrativePrompt(params: {
  scenario_title: string
  audience: string
  doctrine_pack_name?: string
  casualty_count: number
  run_duration_seconds: number
  interventions: Array<{ action: string; elapsed: number; casualty: string; correct: boolean }>
  missed_critical_actions: string[]
  scores: Record<string, number>
  overall_percentage: number
  doctrine_context?: string
}): { system: string; user: string } {
  return {
    system: `You are a tactical medicine after-action review (AAR) writer for a professional training platform.

Your role is to generate clear, objective, doctrine-grounded narrative assessments for training runs.

CRITICAL CONSTRAINTS:
- Base all assessments on the provided event data and scores — do not invent events
- Be direct but professional — this is for instructor use
- Cite doctrine pack when doctrine context is provided
- Mark recommendations as training guidance, not clinical protocol
- Be specific about what happened at what time, not general
- Strengths must be real achievements, not platitudes

OUTPUT FORMAT: Return ONLY valid JSON. No text outside JSON.`,

    user: `Generate an AAR narrative for this training run:

SCENARIO: ${params.scenario_title}
AUDIENCE: ${params.audience}
DOCTRINE PACK: ${params.doctrine_pack_name ?? "None"}
CASUALTIES: ${params.casualty_count}
RUN DURATION: ${formatDuration(params.run_duration_seconds)}
OVERALL SCORE: ${params.overall_percentage}%

DIMENSION SCORES: ${JSON.stringify(params.scores)}
MISSED CRITICAL ACTIONS: ${params.missed_critical_actions.join("; ") || "None"}

KEY INTERVENTIONS:
${params.interventions.slice(0, 20).map((i) => `  ${formatDuration(i.elapsed)} — ${i.action} (${i.casualty}) [${i.correct ? "correct" : "suboptimal"}]`).join("\n")}

${params.doctrine_context ? `DOCTRINE CONTEXT:\n${params.doctrine_context}\n` : ""}

Return JSON:
{
  "overall_narrative": string (3-5 paragraph professional AAR summary),
  "strengths": string[] (3-5 specific things the team did well),
  "failures": string[] (specific failures with timing context),
  "missed_critical_actions": string[] (formatted as instructor talking points),
  "remediation_recommendations": [{ "category": string, "action": string, "doctrine_reference": string|null, "priority": "high"|"medium"|"low" }],
  "trainee_summary": string (1-2 paragraph summary appropriate for trainee debrief),
  "instructor_summary": string (concise bullet-point style summary for instructor debrief card)
}`,
  }
}

// ---- VOICE LINE GENERATION PROMPT ----
export function buildVoiceLinePrompt(params: {
  category: string
  casualty_context: string
  intensity: string
  elapsed_seconds: number
}): { system: string; user: string } {
  return {
    system: `You are a role-player script writer for a tactical medicine training platform.

Generate realistic patient voice lines appropriate for the given clinical situation. Lines should be authentic to the condition and appropriate for role-player delivery.

CONSTRAINTS:
- Lines must be appropriate for the clinical presentation — do not overstate or understate
- Match intensity level — minimal means quiet/brief, high means more expressive
- Keep lines brief (1-3 sentences max)
- Do NOT have the patient self-diagnose or describe their pathophysiology
- Focus on subjective experience: pain, confusion, fear, sensation

OUTPUT FORMAT: Return ONLY valid JSON.`,

    user: `Generate a voice line for:
CATEGORY: ${params.category}
CASUALTY: ${params.casualty_context}
INTENSITY: ${params.intensity}
TIME INTO SCENARIO: ${Math.floor(params.elapsed_seconds / 60)}m ${params.elapsed_seconds % 60}s

Return JSON:
{
  "script_text": string,
  "delivery_notes": string (brief guidance for role player on tone/delivery)
}`,
  }
}

// ---- DOCTRINE RULE EXTRACTION PROMPT ----
export function buildDoctrineExtractionPrompt(chunk: string): { system: string; user: string } {
  return {
    system: `You are a doctrine analysis system for a tactical medicine training platform.

Your role is to extract structured rules and critical actions from medical doctrine text chunks.

CONSTRAINTS:
- Extract ONLY what is explicitly stated in the provided text
- Do NOT add rules based on general medical knowledge — only the provided text
- Mark confidence based on text clarity
- Flag any ambiguous language in the source
- Category must be drawn from standard tactical medicine domains

OUTPUT FORMAT: Return ONLY valid JSON.`,

    user: `Extract doctrine rules from this text chunk:

"${chunk}"

Return JSON:
{
  "rules": [{
    "title": string,
    "description": string,
    "category": "hemorrhage_control"|"airway_management"|"breathing_respiration"|"circulation_shock"|"hypothermia_prevention"|"pain_management"|"infection_prevention"|"triage"|"evacuation"|"documentation"|"communication"|"leadership",
    "critical_action": boolean,
    "timing_expectation": string|null,
    "failure_condition": string|null,
    "priority": number|null (1=highest),
    "source_citation": string (quote from source text)
  }]
}`,
  }
}

// ---- INSTRUCTOR COPILOT PROMPT ----
export function buildInstructorCopilotPrompt(params: {
  query: string
  scenario_context: string
  casualty_statuses: string
  elapsed_seconds: number
  doctrine_context?: string
}): { system: string; user: string } {
  return {
    system: `You are an instructor assistant for a live tactical medicine training exercise.

Your role is to help the lead proctor/instructor with real-time guidance, analysis, and suggestions during a live scenario run.

CRITICAL CONSTRAINTS:
- Ground all responses in the provided doctrine context where available
- Clearly label when you are speculating vs. citing doctrine
- Never act as autonomous medical authority — always label as training guidance
- Do NOT make live patient care recommendations — this is a training simulation only
- If the question cannot be answered from doctrine context, say so explicitly
- Keep responses concise — the instructor is under time pressure

IMPORTANT: Any medical statements are for TRAINING SIMULATION purposes only.`,

    user: `INSTRUCTOR QUERY: "${params.query}"

SCENARIO: ${params.scenario_context}
ELAPSED TIME: ${Math.floor(params.elapsed_seconds / 60)}m ${params.elapsed_seconds % 60}s
CURRENT CASUALTY STATUS:
${params.casualty_statuses}

${params.doctrine_context ? `DOCTRINE CONTEXT:\n${params.doctrine_context}\n` : ""}

Provide a focused, practical response to assist the instructor during this live run.`,
  }
}

// Helper function to format duration (duplicated from utils for use in this module)
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}
