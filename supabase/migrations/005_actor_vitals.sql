-- 005_actor_vitals.sql
-- Adds live vitals override and proctor notes to actor sessions,
-- and target_duration_minutes to scenario_runs for the 5-minute warning.

ALTER TABLE public.casualty_actor_sessions
  ADD COLUMN IF NOT EXISTS current_vitals JSONB,
  ADD COLUMN IF NOT EXISTS proctor_note   TEXT;

ALTER TABLE public.scenario_runs
  ADD COLUMN IF NOT EXISTS target_duration_minutes INTEGER;

-- Full replica identity so Supabase Realtime sends complete row data on UPDATE
ALTER TABLE public.casualty_actor_sessions REPLICA IDENTITY FULL;
