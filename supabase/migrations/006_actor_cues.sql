-- 006_actor_cues.sql
-- Adds last_cue to casualty_actor_sessions so the proctor's treatment
-- logs can push real-time acting scripts to the actor's phone.

ALTER TABLE public.casualty_actor_sessions
  ADD COLUMN IF NOT EXISTS last_cue TEXT;
