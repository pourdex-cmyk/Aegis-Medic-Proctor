-- ============================================================
-- AEGIS MEDIC PROCTOR — Demo Seed Data
-- ============================================================
-- Run via: supabase db seed
-- Or manually: psql $DATABASE_URL < supabase/seed/001_demo_data.sql
-- ============================================================
-- NOTE: This seed inserts demo data for development/testing.
-- It is safe to run repeatedly (uses INSERT ... ON CONFLICT DO NOTHING).
-- ============================================================

-- Demo organization
INSERT INTO organizations (id, name, slug, org_type, plan_tier, max_members)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Alpha Medical Platoon',
  'alpha-medical-plt',
  'military',
  'professional',
  25
) ON CONFLICT (id) DO NOTHING;

-- Demo doctrine pack (approved, so it can be used for scenario generation)
INSERT INTO doctrine_packs (id, org_id, name, version, audience, status, description, document_count, rule_count, approved_at)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'TCCC Guidelines 2024',
  '2024.1',
  'military',
  'approved',
  'Tactical Combat Casualty Care guidelines — all care-under-fire, tactical field care, and CASEVAC phases.',
  12,
  87,
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO doctrine_packs (id, org_id, name, version, audience, status, description, document_count, rule_count)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'Battalion SOP — Medical',
  '1.3',
  'military',
  'pending_approval',
  'Unit-specific standing operating procedures for medical personnel and combat lifesavers.',
  4,
  23
) ON CONFLICT (id) DO NOTHING;

-- Demo scenarios
INSERT INTO scenarios (id, org_id, title, description, audience, scenario_type, environment, complexity, casualty_count, status, doctrine_pack_id, objectives)
VALUES (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000001',
  'IED Strike — Route Clearance',
  'An IED detonates during route clearance, producing a mixed-severity MASCAL with blast and penetrating trauma. Team must triage, treat life threats, and prepare for CASEVAC under residual threat.',
  'military',
  'mascal',
  'urban',
  'advanced',
  4,
  'active',
  '00000000-0000-0000-0000-000000000010',
  ARRAY[
    'Correctly triage all four casualties using START/SALT methodology',
    'Apply hemorrhage control to all life-threatening bleeds within 3 minutes',
    'Establish airway management for unconscious casualties',
    'Prepare MIST report and CASEVAC request for highest-priority casualty'
  ]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scenarios (id, org_id, title, description, audience, scenario_type, environment, complexity, casualty_count, status, objectives)
VALUES (
  '00000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000001',
  'Vehicle Rollover — Mountain Terrain',
  'A MRAP rolls on a mountain pass. Two occupants are trapped with mechanism-of-injury consistent with thoracic and spinal trauma. Evacuation is delayed 45 minutes.',
  'military',
  'individual',
  'mountain',
  'intermediate',
  2,
  'active',
  ARRAY[
    'Assess mechanism and identify spinal precautions',
    'Manage tension pneumothorax if signs present',
    'Maintain casualty warmth in cold environment',
    'Document and transmit 9-line MEDEVAC'
  ]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scenarios (id, org_id, title, description, audience, scenario_type, environment, complexity, casualty_count, status, objectives)
VALUES (
  '00000000-0000-0000-0000-000000000022',
  '00000000-0000-0000-0000-000000000001',
  'CUF Drill — Direct Fire Contact',
  'A fire team takes direct fire. One Soldier sustains a femoral arterial bleed. The medic must provide care under fire while the team suppresses. Scenario tests decision-making under stress.',
  'military',
  'individual',
  'open_terrain',
  'beginner',
  1,
  'active',
  ARRAY[
    'Direct Soldier to self-apply tourniquet or apply under fire',
    'Move casualty to covered position before transitioning to TFC',
    'Reassess tourniquet effectiveness at TFC position'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Demo casualty profiles for scenario 1 (IED Strike)
INSERT INTO casualty_profiles (
  id, scenario_id, org_id, callsign, display_label, mechanism_of_injury,
  triage_category, airway_status, breathing_status, circulation_state, neurologic_status,
  visible_injuries, hidden_complications,
  baseline_vitals, pain_level, audio_profile
) VALUES
(
  '00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000001',
  'ALPHA-1',
  'SPC Torres — Vehicle Commander',
  'Primary blast injury. Bilateral lower extremity traumatic amputations at mid-thigh from IED detonation.',
  'T1',
  'patent',
  'labored',
  'hemorrhagic_shock',
  'V',
  '[{"type": "traumatic_amputation", "location": "left_thigh", "severity": "critical", "laterality": "left"}, {"type": "traumatic_amputation", "location": "right_thigh", "severity": "critical", "laterality": "right"}, {"type": "blast_fragment", "location": "abdomen", "severity": "moderate", "laterality": null}]',
  '[{"type": "abdominal_evisceration", "location": "lower_abdomen", "severity": "critical"}, {"type": "hemothorax", "location": "right_chest", "severity": "moderate"}]',
  '{"hr": 138, "rr": 28, "sbp": 72, "dbp": 40, "spo2": 91, "temp": 36.1, "avpu": "V"}',
  9,
  '{"primary_complaint": "My legs! I can''t feel my legs! Help me!"}'
),
(
  '00000000-0000-0000-0000-000000000031',
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000001',
  'ALPHA-2',
  'SGT Okafor — Team Leader',
  'Secondary blast and overpressure. Suspected tension pneumothorax, multiple fragment wounds to upper extremity.',
  'T1',
  'obstructed',
  'absent_right',
  'compensated',
  'P',
  '[{"type": "blast_fragment", "location": "right_chest", "severity": "critical", "laterality": "right"}, {"type": "laceration", "location": "right_forearm", "severity": "moderate", "laterality": "right"}, {"type": "blast_fragment", "location": "neck", "severity": "moderate", "laterality": null}]',
  '[{"type": "tension_pneumothorax", "location": "right_chest", "severity": "critical"}, {"type": "vascular_injury", "location": "right_forearm", "severity": "moderate"}]',
  '{"hr": 122, "rr": 32, "sbp": 88, "dbp": 52, "spo2": 86, "temp": 36.8, "avpu": "P"}',
  7,
  '{"primary_complaint": "Can''t... breathe..."}'
),
(
  '00000000-0000-0000-0000-000000000032',
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000001',
  'ALPHA-3',
  'PFC Kim — Gunner',
  'Blast concussion and multiple lacerations. Ambulatory, confused. No immediately life-threatening injuries identified.',
  'T2',
  'patent',
  'normal',
  'normal',
  'V',
  '[{"type": "laceration", "location": "scalp", "severity": "moderate", "laterality": null}, {"type": "contusion", "location": "left_shoulder", "severity": "minor", "laterality": "left"}, {"type": "blast_fragment", "location": "left_forearm", "severity": "minor", "laterality": "left"}]',
  '[{"type": "tbi_moderate", "location": "head", "severity": "moderate"}]',
  '{"hr": 98, "rr": 18, "sbp": 128, "dbp": 78, "spo2": 97, "temp": 36.9, "avpu": "V"}',
  5,
  '{"primary_complaint": "What happened? Where''s my weapon? My head is killing me."}'
),
(
  '00000000-0000-0000-0000-000000000033',
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000001',
  'ALPHA-4',
  'CPT Reyes — Platoon Leader',
  'No direct blast exposure. Walking wounded. Requesting SITREP. Psychologically affected, exhibiting combat stress.',
  'T3',
  'patent',
  'normal',
  'normal',
  'A',
  '[{"type": "contusion", "location": "left_knee", "severity": "minor", "laterality": "left"}, {"type": "acoustic_trauma", "location": "bilateral_ears", "severity": "minor", "laterality": null}]',
  '[{"type": "combat_stress_reaction", "location": "neurological", "severity": "moderate"}]',
  '{"hr": 88, "rr": 16, "sbp": 138, "dbp": 88, "spo2": 99, "temp": 36.7, "avpu": "A"}',
  3,
  '{"primary_complaint": "I''m fine — focus on my Soldiers. Get CASEVAC on the line NOW."}'
) ON CONFLICT (id) DO NOTHING;

-- Demo scenario injects for scenario 1
INSERT INTO scenario_injects (id, scenario_id, inject_type, trigger_type, title, description, elapsed_at_seconds)
VALUES
(
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000020',
  'command',
  'time',
  'Higher reports secondary IED threat',
  'Battalion reports a secondary device may be present in the area. Team must reassess security posture.',
  300
),
(
  '00000000-0000-0000-0000-000000000041',
  '00000000-0000-0000-0000-000000000020',
  'medical',
  'intervention',
  'ALPHA-2 deteriorates',
  'If needle decompression not performed by T+5min, ALPHA-2 loses consciousness (AVPU changes from P to U, SBP drops to 60).',
  300
),
(
  '00000000-0000-0000-0000-000000000042',
  '00000000-0000-0000-0000-000000000020',
  'intel',
  'time',
  'CASEVAC 15 minutes out',
  'UH-60 MEDEVAC inbound to LZ Bravo. Provide authentication and MIST report to crew chief.',
  720
),
(
  '00000000-0000-0000-0000-000000000043',
  '00000000-0000-0000-0000-000000000020',
  'environmental',
  'time',
  'Light failing — transition to NODs',
  'Sun is setting. Proctor may reduce lighting or instruct role players to transition to night procedures.',
  900
) ON CONFLICT (id) DO NOTHING;

-- Feature flags (used to toggle experimental features)
INSERT INTO feature_flags (flag_key, enabled, description)
VALUES
  ('ai_copilot', true, 'Live AI instructor copilot panel in run command center'),
  ('doctrine_embeddings', false, 'pgvector semantic search for doctrine retrieval (requires embedding pipeline)'),
  ('voice_lines', false, 'AI-generated role-player voice lines (requires TTS integration)'),
  ('mascal_board', true, 'MASCAL tracking board in scenario runs'),
  ('advanced_analytics', true, 'Dimension radar chart and advanced analytics views')
ON CONFLICT (flag_key) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  description = EXCLUDED.description;
