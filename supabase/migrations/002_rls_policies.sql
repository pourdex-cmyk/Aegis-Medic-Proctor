-- =============================================================
-- AEGIS MEDIC PROCTOR — ROW LEVEL SECURITY POLICIES
-- Migration: 002_rls_policies
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctrine_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctrine_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctrine_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctrine_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_injects ENABLE ROW LEVEL SECURITY;
ALTER TABLE casualty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE casualty_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE casualty_state_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_interpretations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_cues ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- HELPER FUNCTIONS
-- =============================================================

-- Get current user's org membership
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY(
    SELECT org_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = TRUE
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is member of an org
CREATE OR REPLACE FUNCTION is_org_member(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM organization_members
    WHERE org_id = p_org_id AND user_id = auth.uid() AND is_active = TRUE
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user has specific role in org
CREATE OR REPLACE FUNCTION has_org_role(p_org_id UUID, VARIADIC p_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM organization_members
    WHERE org_id = p_org_id
      AND user_id = auth.uid()
      AND is_active = TRUE
      AND role = ANY(p_roles)
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is org admin
CREATE OR REPLACE FUNCTION is_org_admin(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT has_org_role(p_org_id, 'org_admin');
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =============================================================
-- PROFILES
-- =============================================================

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Org members can view each other's profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT user_id FROM organization_members
      WHERE org_id = ANY(get_user_org_ids())
    )
  );

-- =============================================================
-- ORGANIZATIONS
-- =============================================================

CREATE POLICY "Org members can view their org"
  ON organizations FOR SELECT
  USING (is_org_member(id));

CREATE POLICY "Org admins can update org"
  ON organizations FOR UPDATE
  USING (is_org_admin(id));

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================
-- ORGANIZATION MEMBERS
-- =============================================================

CREATE POLICY "Members can view their org's members"
  ON organization_members FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Org admins can manage members"
  ON organization_members FOR ALL
  USING (is_org_admin(org_id))
  WITH CHECK (is_org_admin(org_id));

CREATE POLICY "Users can insert themselves as org member on creation"
  ON organization_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =============================================================
-- ORGANIZATION INVITES
-- =============================================================

CREATE POLICY "Org admins can manage invites"
  ON organization_invites FOR ALL
  USING (is_org_admin(org_id))
  WITH CHECK (is_org_admin(org_id));

CREATE POLICY "Anyone can view invites by token"
  ON organization_invites FOR SELECT
  USING (TRUE); -- Token-based access controlled at app layer

-- =============================================================
-- DOCTRINE PACKS
-- =============================================================

CREATE POLICY "Org members can view approved doctrine packs"
  ON doctrine_packs FOR SELECT
  USING (
    is_org_member(org_id) AND
    (status != 'archived' OR is_org_admin(org_id))
  );

CREATE POLICY "Admins and SMEs can create doctrine packs"
  ON doctrine_packs FOR INSERT
  WITH CHECK (has_org_role(org_id, 'org_admin', 'doctrine_sme', 'lead_proctor'));

CREATE POLICY "Admins and SMEs can update doctrine packs"
  ON doctrine_packs FOR UPDATE
  USING (has_org_role(org_id, 'org_admin', 'doctrine_sme'));

CREATE POLICY "Admins can delete doctrine packs"
  ON doctrine_packs FOR DELETE
  USING (is_org_admin(org_id));

-- =============================================================
-- DOCTRINE DOCUMENTS & CHUNKS & RULES
-- =============================================================

CREATE POLICY "Org members can view doctrine documents"
  ON doctrine_documents FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Admins and SMEs can manage doctrine documents"
  ON doctrine_documents FOR ALL
  USING (has_org_role(org_id, 'org_admin', 'doctrine_sme', 'lead_proctor'))
  WITH CHECK (has_org_role(org_id, 'org_admin', 'doctrine_sme', 'lead_proctor'));

CREATE POLICY "Org members can view doctrine chunks"
  ON doctrine_chunks FOR SELECT
  USING (
    pack_id IN (SELECT id FROM doctrine_packs WHERE is_org_member(org_id))
  );

CREATE POLICY "Org members can view doctrine rules"
  ON doctrine_rules FOR SELECT
  USING (
    pack_id IN (SELECT id FROM doctrine_packs WHERE is_org_member(org_id))
  );

CREATE POLICY "SMEs and admins can manage doctrine rules"
  ON doctrine_rules FOR ALL
  USING (
    pack_id IN (
      SELECT id FROM doctrine_packs
      WHERE has_org_role(org_id, 'org_admin', 'doctrine_sme')
    )
  )
  WITH CHECK (
    pack_id IN (
      SELECT id FROM doctrine_packs
      WHERE has_org_role(org_id, 'org_admin', 'doctrine_sme')
    )
  );

-- =============================================================
-- SCENARIOS
-- =============================================================

CREATE POLICY "Org members can view scenarios"
  ON scenarios FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Lead proctors and admins can create scenarios"
  ON scenarios FOR INSERT
  WITH CHECK (
    has_org_role(org_id, 'org_admin', 'lead_proctor') AND
    created_by = auth.uid()
  );

CREATE POLICY "Scenario creator and admins can update"
  ON scenarios FOR UPDATE
  USING (
    created_by = auth.uid() OR is_org_admin(org_id)
  );

CREATE POLICY "Admins can delete scenarios"
  ON scenarios FOR DELETE
  USING (is_org_admin(org_id));

-- Scenario injects — same as scenario
CREATE POLICY "Org members can view injects"
  ON scenario_injects FOR SELECT
  USING (
    scenario_id IN (SELECT id FROM scenarios WHERE is_org_member(org_id))
  );

CREATE POLICY "Proctors and admins can manage injects"
  ON scenario_injects FOR ALL
  USING (
    scenario_id IN (
      SELECT id FROM scenarios
      WHERE has_org_role(org_id, 'org_admin', 'lead_proctor')
    )
  )
  WITH CHECK (
    scenario_id IN (
      SELECT id FROM scenarios
      WHERE has_org_role(org_id, 'org_admin', 'lead_proctor')
    )
  );

-- =============================================================
-- CASUALTY PROFILES
-- =============================================================

CREATE POLICY "Org members can view casualty profiles"
  ON casualty_profiles FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Proctors and admins can manage casualties"
  ON casualty_profiles FOR ALL
  USING (has_org_role(org_id, 'org_admin', 'lead_proctor', 'assistant_proctor'))
  WITH CHECK (has_org_role(org_id, 'org_admin', 'lead_proctor', 'assistant_proctor'));

-- =============================================================
-- SCENARIO RUNS
-- =============================================================

CREATE POLICY "Org members can view scenario runs"
  ON scenario_runs FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Lead proctors and admins can create runs"
  ON scenario_runs FOR INSERT
  WITH CHECK (has_org_role(org_id, 'org_admin', 'lead_proctor'));

CREATE POLICY "Lead proctors and admins can update runs"
  ON scenario_runs FOR UPDATE
  USING (
    lead_proctor_id = auth.uid() OR is_org_admin(org_id)
  );

CREATE POLICY "Org members can view run participants"
  ON run_participants FOR SELECT
  USING (
    run_id IN (SELECT id FROM scenario_runs WHERE is_org_member(org_id))
  );

CREATE POLICY "Users can join runs"
  ON run_participants FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    run_id IN (SELECT id FROM scenario_runs WHERE is_org_member(org_id))
  );

CREATE POLICY "Org members can view proctor assignments"
  ON proctor_assignments FOR SELECT
  USING (
    run_id IN (SELECT id FROM scenario_runs WHERE is_org_member(org_id))
  );

CREATE POLICY "Proctors can manage assignments"
  ON proctor_assignments FOR ALL
  USING (
    run_id IN (
      SELECT id FROM scenario_runs
      WHERE has_org_role(org_id, 'org_admin', 'lead_proctor', 'assistant_proctor')
    )
  )
  WITH CHECK (
    run_id IN (
      SELECT id FROM scenario_runs
      WHERE has_org_role(org_id, 'org_admin', 'lead_proctor', 'assistant_proctor')
    )
  );

-- =============================================================
-- LIVE STATE & INTERVENTIONS
-- =============================================================

CREATE POLICY "Proctors can view and update casualty states"
  ON casualty_states FOR ALL
  USING (
    run_id IN (
      SELECT id FROM scenario_runs
      WHERE has_org_role(org_id, 'org_admin', 'lead_proctor', 'assistant_proctor', 'evaluator')
    )
  )
  WITH CHECK (
    run_id IN (
      SELECT id FROM scenario_runs
      WHERE has_org_role(org_id, 'org_admin', 'lead_proctor', 'assistant_proctor')
    )
  );

CREATE POLICY "Org members can view state events"
  ON casualty_state_events FOR SELECT
  USING (
    run_id IN (SELECT id FROM scenario_runs WHERE is_org_member(org_id))
  );

CREATE POLICY "Proctors can insert state events"
  ON casualty_state_events FOR INSERT
  WITH CHECK (
    run_id IN (
      SELECT id FROM scenario_runs
      WHERE has_org_role(org_id, 'org_admin', 'lead_proctor', 'assistant_proctor')
    )
  );

CREATE POLICY "Org members can view interventions"
  ON interventions FOR SELECT
  USING (
    run_id IN (SELECT id FROM scenario_runs WHERE is_org_member(org_id))
  );

CREATE POLICY "Proctors can log interventions"
  ON interventions FOR INSERT
  WITH CHECK (
    run_id IN (
      SELECT id FROM scenario_runs
      WHERE has_org_role(org_id, 'org_admin', 'lead_proctor', 'assistant_proctor')
    ) AND proctor_id = auth.uid()
  );

CREATE POLICY "Proctors can view interpretations"
  ON intervention_interpretations FOR SELECT
  USING (
    intervention_id IN (
      SELECT id FROM interventions
      WHERE run_id IN (SELECT id FROM scenario_runs WHERE is_org_member(org_id))
    )
  );

-- =============================================================
-- AUDIO
-- =============================================================

CREATE POLICY "Org members can view audio cues"
  ON audio_cues FOR SELECT
  USING (
    is_system = TRUE OR
    org_id IS NULL OR
    is_org_member(org_id)
  );

CREATE POLICY "Proctors and admins can manage audio cues"
  ON audio_cues FOR ALL
  USING (is_org_admin(org_id))
  WITH CHECK (is_org_admin(org_id));

CREATE POLICY "Org members can view audio events"
  ON audio_events FOR SELECT
  USING (
    run_id IN (SELECT id FROM scenario_runs WHERE is_org_member(org_id))
  );

CREATE POLICY "Proctors can trigger audio"
  ON audio_events FOR INSERT
  WITH CHECK (
    run_id IN (
      SELECT id FROM scenario_runs
      WHERE has_org_role(org_id, 'org_admin', 'lead_proctor', 'assistant_proctor', 'role_player_coordinator')
    )
  );

-- =============================================================
-- GRADING & SCORES
-- =============================================================

CREATE POLICY "Org members can view rubrics"
  ON rubrics FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Admins can manage rubrics"
  ON rubrics FOR ALL
  USING (is_org_admin(org_id))
  WITH CHECK (is_org_admin(org_id));

CREATE POLICY "Org members can view rubric items"
  ON rubric_items FOR SELECT
  USING (
    rubric_id IN (SELECT id FROM rubrics WHERE is_org_member(org_id))
  );

CREATE POLICY "Evaluators and admins can view scores"
  ON scores FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM scenario_runs
      WHERE has_org_role(org_id, 'org_admin', 'lead_proctor', 'evaluator')
    ) OR evaluator_id = auth.uid()
  );

CREATE POLICY "Evaluators can create scores"
  ON scores FOR INSERT
  WITH CHECK (
    evaluator_id = auth.uid() AND
    run_id IN (
      SELECT id FROM scenario_runs
      WHERE has_org_role(org_id, 'org_admin', 'lead_proctor', 'evaluator')
    )
  );

-- =============================================================
-- REPORTS
-- =============================================================

CREATE POLICY "Authorized users can view reports"
  ON reports FOR SELECT
  USING (
    is_org_member(org_id) AND
    has_org_role(org_id, 'org_admin', 'lead_proctor', 'evaluator', 'observer')
  );

CREATE POLICY "Lead proctors and admins can create reports"
  ON reports FOR INSERT
  WITH CHECK (
    has_org_role(org_id, 'org_admin', 'lead_proctor') AND
    generated_by = auth.uid()
  );

-- =============================================================
-- AUDIT LOGS
-- =============================================================

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (is_org_admin(org_id));

-- Audit logs are inserted by service role only
-- No user insert policy — use service role key for audit writes

-- =============================================================
-- NOTIFICATIONS
-- =============================================================

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- =============================================================
-- FEATURE FLAGS
-- =============================================================

CREATE POLICY "Org members can view feature flags"
  ON feature_flags FOR SELECT
  USING (org_id IS NULL OR is_org_member(org_id));

CREATE POLICY "Admins can manage feature flags"
  ON feature_flags FOR ALL
  USING (org_id IS NULL OR is_org_admin(org_id))
  WITH CHECK (org_id IS NULL OR is_org_admin(org_id));
