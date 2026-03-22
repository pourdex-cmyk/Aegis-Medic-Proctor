-- =============================================================
-- AEGIS MEDIC PROCTOR — INITIAL DATABASE SCHEMA
-- Migration: 001_initial_schema
-- =============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================================
-- ORGANIZATIONS & TENANCY
-- =============================================================

CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  type        TEXT NOT NULL CHECK (type IN ('military', 'law_enforcement', 'ems', 'training_institution', 'other')),
  logo_url    TEXT,
  settings    JSONB NOT NULL DEFAULT '{
    "allow_ai_treatment_interpretation": true,
    "require_doctrine_approval": true,
    "enable_audio_system": true,
    "grading_strictness": "standard"
  }',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email           TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  current_org_id  UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE organization_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN (
    'org_admin', 'lead_proctor', 'assistant_proctor', 'evaluator',
    'observer', 'role_player_coordinator', 'doctrine_sme', 'trainee'
  )),
  display_name TEXT NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE TABLE organization_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL,
  invited_by  UUID NOT NULL REFERENCES profiles(id),
  token       TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- DOCTRINE PACKS
-- =============================================================

CREATE TABLE doctrine_packs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  version          TEXT NOT NULL DEFAULT '1.0',
  audience         TEXT NOT NULL CHECK (audience IN ('military', 'law_enforcement', 'ems', 'universal')),
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'archived')),
  description      TEXT,
  source_reference TEXT,
  approved_by      UUID REFERENCES profiles(id),
  approved_at      TIMESTAMPTZ,
  document_count   INTEGER NOT NULL DEFAULT 0,
  rule_count       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE doctrine_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id      UUID NOT NULL REFERENCES doctrine_packs(id) ON DELETE CASCADE,
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  file_url     TEXT,
  content_text TEXT,
  file_type    TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx', 'txt', 'md')),
  status       TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'chunked', 'indexed', 'error')),
  chunk_count  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE doctrine_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES doctrine_documents(id) ON DELETE CASCADE,
  pack_id       UUID NOT NULL REFERENCES doctrine_packs(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  page_number   INTEGER,
  section_title TEXT,
  embedding     vector(1536),
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE doctrine_rules (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id            UUID NOT NULL REFERENCES doctrine_packs(id) ON DELETE CASCADE,
  chunk_id           UUID REFERENCES doctrine_chunks(id) ON DELETE SET NULL,
  category           TEXT NOT NULL,
  title              TEXT NOT NULL,
  description        TEXT NOT NULL,
  critical_action    BOOLEAN NOT NULL DEFAULT FALSE,
  timing_expectation TEXT,
  failure_condition  TEXT,
  priority           INTEGER,
  source_citation    TEXT,
  approval_status    TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by        UUID REFERENCES profiles(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- SCENARIOS
-- =============================================================

CREATE TABLE scenarios (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  doctrine_pack_id   UUID REFERENCES doctrine_packs(id) ON DELETE SET NULL,
  created_by         UUID NOT NULL REFERENCES profiles(id),
  title              TEXT NOT NULL,
  description        TEXT,
  audience           TEXT NOT NULL CHECK (audience IN ('military', 'law_enforcement', 'ems')),
  environment        TEXT NOT NULL,
  scenario_type      TEXT NOT NULL,
  complexity         TEXT NOT NULL CHECK (complexity IN ('basic', 'intermediate', 'advanced', 'expert')),
  casualty_count     INTEGER NOT NULL DEFAULT 1,
  evac_delay_minutes INTEGER NOT NULL DEFAULT 30,
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'archived')),
  ai_generated       BOOLEAN NOT NULL DEFAULT FALSE,
  settings           JSONB NOT NULL DEFAULT '{}',
  objectives         JSONB NOT NULL DEFAULT '[]',
  overview_narrative TEXT,
  instructor_notes   TEXT,
  tags               TEXT[] NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE scenario_injects (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id         UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  trigger_type        TEXT NOT NULL CHECK (trigger_type IN ('time', 'manual', 'condition')),
  trigger_time_seconds INTEGER,
  trigger_condition   TEXT,
  effect_description  TEXT,
  affects_casualty_id UUID,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- CASUALTIES
-- =============================================================

CREATE TABLE casualty_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id               UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  org_id                    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  callsign                  TEXT NOT NULL,
  display_label             TEXT NOT NULL,
  age                       INTEGER,
  sex                       TEXT CHECK (sex IN ('male', 'female')),
  weight_kg                 NUMERIC(5,1),
  mechanism_of_injury       TEXT NOT NULL,
  visible_injuries          JSONB NOT NULL DEFAULT '[]',
  suspected_internal_injuries JSONB NOT NULL DEFAULT '[]',
  hidden_complications      JSONB NOT NULL DEFAULT '[]',
  airway_status             TEXT NOT NULL DEFAULT 'patent',
  breathing_status          TEXT NOT NULL DEFAULT 'normal',
  circulation_state         TEXT NOT NULL DEFAULT 'normal',
  neurologic_status         TEXT NOT NULL DEFAULT 'intact',
  pain_level                INTEGER NOT NULL DEFAULT 0 CHECK (pain_level BETWEEN 0 AND 10),
  mental_status             TEXT NOT NULL DEFAULT 'Alert',
  baseline_vitals           JSONB NOT NULL DEFAULT '{}',
  deterioration_profile     JSONB NOT NULL DEFAULT '{}',
  triage_category           TEXT NOT NULL DEFAULT 'T2' CHECK (triage_category IN ('T1', 'T2', 'T3', 'T4', 'deceased')),
  audio_profile             JSONB NOT NULL DEFAULT '{}',
  ai_generated              BOOLEAN NOT NULL DEFAULT FALSE,
  proctor_notes             TEXT,
  reveal_hidden_to_proctor  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order                INTEGER NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- SCENARIO RUNS
-- =============================================================

CREATE TABLE scenario_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id     UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_proctor_id UUID NOT NULL REFERENCES profiles(id),
  title           TEXT,
  status          TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'paused', 'completed', 'aborted')),
  started_at      TIMESTAMPTZ,
  paused_at       TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  clock_seconds   INTEGER NOT NULL DEFAULT 0,
  speed_multiplier NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE run_participants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id     UUID NOT NULL REFERENCES scenario_runs(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(run_id, user_id)
);

CREATE TABLE proctor_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        UUID NOT NULL REFERENCES scenario_runs(id) ON DELETE CASCADE,
  casualty_id   UUID NOT NULL REFERENCES casualty_profiles(id) ON DELETE CASCADE,
  proctor_id    UUID NOT NULL REFERENCES profiles(id),
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at   TIMESTAMPTZ,
  UNIQUE(run_id, casualty_id, released_at)
);

-- =============================================================
-- LIVE CASUALTY STATE
-- =============================================================

CREATE TABLE casualty_states (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id                 UUID NOT NULL REFERENCES scenario_runs(id) ON DELETE CASCADE,
  casualty_id            UUID NOT NULL REFERENCES casualty_profiles(id) ON DELETE CASCADE,
  current_vitals         JSONB NOT NULL DEFAULT '{}',
  airway_status          TEXT NOT NULL DEFAULT 'patent',
  breathing_status       TEXT NOT NULL DEFAULT 'normal',
  circulation_state      TEXT NOT NULL DEFAULT 'normal',
  neurologic_status      TEXT NOT NULL DEFAULT 'intact',
  triage_category        TEXT NOT NULL DEFAULT 'T2',
  outcome                TEXT NOT NULL DEFAULT 'unknown' CHECK (outcome IN ('alive', 'deceased', 'evacuated', 'unknown')),
  estimated_blood_loss_ml INTEGER NOT NULL DEFAULT 0,
  shock_index            NUMERIC(4,2) NOT NULL DEFAULT 0,
  interventions_applied  TEXT[] NOT NULL DEFAULT '{}',
  last_reassessed_at     TIMESTAMPTZ,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(run_id, casualty_id)
);

CREATE TABLE casualty_state_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id           UUID NOT NULL REFERENCES scenario_runs(id) ON DELETE CASCADE,
  casualty_id      UUID NOT NULL REFERENCES casualty_profiles(id) ON DELETE CASCADE,
  event_type       TEXT NOT NULL,
  description      TEXT NOT NULL,
  data             JSONB NOT NULL DEFAULT '{}',
  triggered_by     TEXT NOT NULL DEFAULT 'system' CHECK (triggered_by IN ('system', 'proctor', 'scenario_inject')),
  actor_id         UUID REFERENCES profiles(id),
  elapsed_seconds  INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- INTERVENTIONS
-- =============================================================

CREATE TABLE interventions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id           UUID NOT NULL REFERENCES scenario_runs(id) ON DELETE CASCADE,
  casualty_id      UUID NOT NULL REFERENCES casualty_profiles(id) ON DELETE CASCADE,
  proctor_id       UUID NOT NULL REFERENCES profiles(id),
  raw_text         TEXT,
  action_type      TEXT NOT NULL,
  body_location    TEXT,
  laterality       TEXT,
  quality          TEXT,
  performer        TEXT,
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  status           TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('pending_interpretation', 'interpreted', 'applied', 'rejected')),
  elapsed_seconds  INTEGER NOT NULL DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE intervention_interpretations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervention_id     UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  action_type         TEXT NOT NULL,
  body_location       TEXT,
  laterality          TEXT,
  quality             TEXT,
  confidence          NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  ambiguity_flags     TEXT[] NOT NULL DEFAULT '{}',
  effect_description  TEXT,
  doctrine_rule_id    UUID REFERENCES doctrine_rules(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- AUDIO
-- =============================================================

CREATE TABLE audio_cues (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID REFERENCES organizations(id) ON DELETE CASCADE,
  pack_id          UUID REFERENCES doctrine_packs(id) ON DELETE SET NULL,
  category         TEXT NOT NULL,
  title            TEXT NOT NULL,
  script_text      TEXT NOT NULL,
  intensity        TEXT NOT NULL DEFAULT 'medium' CHECK (intensity IN ('low', 'medium', 'high')),
  voice_style      TEXT,
  duration_seconds INTEGER,
  tags             TEXT[] NOT NULL DEFAULT '{}',
  is_system        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audio_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID NOT NULL REFERENCES scenario_runs(id) ON DELETE CASCADE,
  casualty_id     UUID REFERENCES casualty_profiles(id) ON DELETE SET NULL,
  cue_id          UUID REFERENCES audio_cues(id) ON DELETE SET NULL,
  triggered_by    TEXT NOT NULL CHECK (triggered_by IN ('manual', 'automatic', 'scheduled')),
  actor_id        UUID REFERENCES profiles(id),
  script_text     TEXT NOT NULL,
  played_at       TIMESTAMPTZ,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'playing', 'completed', 'skipped')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- GRADING & SCORING
-- =============================================================

CREATE TABLE rubrics (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  doctrine_pack_id   UUID REFERENCES doctrine_packs(id) ON DELETE SET NULL,
  name               TEXT NOT NULL,
  description        TEXT,
  scenario_type      TEXT NOT NULL DEFAULT 'general',
  is_default         BOOLEAN NOT NULL DEFAULT FALSE,
  dimension_weights  JSONB NOT NULL DEFAULT '{
    "critical_actions": 0.35,
    "sequence": 0.15,
    "timing": 0.20,
    "reassessment": 0.10,
    "communication": 0.10,
    "documentation": 0.05,
    "safety": 0.05
  }',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rubric_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id        UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  doctrine_rule_id UUID REFERENCES doctrine_rules(id) ON DELETE SET NULL,
  category         TEXT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  points_possible  INTEGER NOT NULL DEFAULT 10,
  is_critical      BOOLEAN NOT NULL DEFAULT FALSE,
  fail_condition   TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE scores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id           UUID NOT NULL REFERENCES scenario_runs(id) ON DELETE CASCADE,
  casualty_id      UUID REFERENCES casualty_profiles(id) ON DELETE SET NULL,
  rubric_id        UUID NOT NULL REFERENCES rubrics(id),
  evaluator_id     UUID NOT NULL REFERENCES profiles(id),
  total_score      NUMERIC(6,2) NOT NULL DEFAULT 0,
  max_possible     NUMERIC(6,2) NOT NULL DEFAULT 100,
  percentage       NUMERIC(5,2) NOT NULL DEFAULT 0,
  dimension_scores JSONB NOT NULL DEFAULT '{}',
  passed           BOOLEAN NOT NULL DEFAULT FALSE,
  ai_narrative     TEXT,
  evaluator_notes  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE score_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score_id        UUID NOT NULL REFERENCES scores(id) ON DELETE CASCADE,
  rubric_item_id  UUID REFERENCES rubric_items(id) ON DELETE SET NULL,
  points_earned   NUMERIC(5,2) NOT NULL DEFAULT 0,
  points_possible NUMERIC(5,2) NOT NULL DEFAULT 0,
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- REPORTS
-- =============================================================

CREATE TABLE reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            UUID NOT NULL REFERENCES scenario_runs(id) ON DELETE CASCADE,
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  generated_by      UUID NOT NULL REFERENCES profiles(id),
  title             TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'error')),
  summary           TEXT,
  ai_narrative      TEXT,
  remediation_plan  JSONB,
  strengths         TEXT[] NOT NULL DEFAULT '{}',
  failures          TEXT[] NOT NULL DEFAULT '{}',
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE report_exports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  format      TEXT NOT NULL CHECK (format IN ('pdf', 'json', 'html')),
  file_url    TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'error')),
  created_by  UUID NOT NULL REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- AUDIT & NOTIFICATIONS
-- =============================================================

CREATE TABLE audit_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id            UUID REFERENCES profiles(id),
  actor_display_name  TEXT,
  action              TEXT NOT NULL,
  resource_type       TEXT NOT NULL,
  resource_id         UUID,
  description         TEXT NOT NULL,
  metadata            JSONB NOT NULL DEFAULT '{}',
  ip_address          INET,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE feature_flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL,
  enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(key, org_id)
);

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX idx_org_members_org ON organization_members(org_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_doctrine_packs_org ON doctrine_packs(org_id);
CREATE INDEX idx_doctrine_docs_pack ON doctrine_documents(pack_id);
CREATE INDEX idx_doctrine_chunks_pack ON doctrine_chunks(pack_id);
CREATE INDEX idx_doctrine_chunks_doc ON doctrine_chunks(document_id);
CREATE INDEX idx_doctrine_rules_pack ON doctrine_rules(pack_id);
CREATE INDEX idx_scenarios_org ON scenarios(org_id);
CREATE INDEX idx_scenarios_created_by ON scenarios(created_by);
CREATE INDEX idx_casualty_profiles_scenario ON casualty_profiles(scenario_id);
CREATE INDEX idx_scenario_runs_scenario ON scenario_runs(scenario_id);
CREATE INDEX idx_scenario_runs_org ON scenario_runs(org_id);
CREATE INDEX idx_scenario_runs_status ON scenario_runs(status);
CREATE INDEX idx_casualty_states_run ON casualty_states(run_id);
CREATE INDEX idx_casualty_state_events_run ON casualty_state_events(run_id);
CREATE INDEX idx_interventions_run ON interventions(run_id);
CREATE INDEX idx_interventions_casualty ON interventions(casualty_id);
CREATE INDEX idx_audio_events_run ON audio_events(run_id);
CREATE INDEX idx_scores_run ON scores(run_id);
CREATE INDEX idx_reports_run ON reports(run_id);
CREATE INDEX idx_reports_org ON reports(org_id);
CREATE INDEX idx_audit_logs_org ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_doctrine_chunks_embedding ON doctrine_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================================
-- UPDATED_AT TRIGGERS
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_doctrine_packs_updated_at BEFORE UPDATE ON doctrine_packs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_scenarios_updated_at BEFORE UPDATE ON scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_casualty_profiles_updated_at BEFORE UPDATE ON casualty_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_casualty_states_updated_at BEFORE UPDATE ON casualty_states FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
