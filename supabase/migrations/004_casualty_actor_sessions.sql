-- 004_casualty_actor_sessions.sql
-- Token-based patient actor sessions for live scenario role-players.
-- Tokens are created when the run page is loaded (pre-run standby),
-- then linked to the actual run_id when the proctor hits Start Run.

CREATE TABLE IF NOT EXISTS public.casualty_actor_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID        NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  run_id      UUID        REFERENCES public.scenario_runs(id) ON DELETE SET NULL,
  casualty_id UUID        NOT NULL REFERENCES public.casualty_profiles(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  CONSTRAINT casualty_actor_sessions_token_key     UNIQUE (token),
  CONSTRAINT casualty_actor_sessions_scen_cas_key  UNIQUE (scenario_id, casualty_id)
);

CREATE INDEX IF NOT EXISTS idx_actor_sessions_token       ON public.casualty_actor_sessions (token);
CREATE INDEX IF NOT EXISTS idx_actor_sessions_scenario_id ON public.casualty_actor_sessions (scenario_id);
CREATE INDEX IF NOT EXISTS idx_actor_sessions_run_id      ON public.casualty_actor_sessions (run_id);

ALTER TABLE public.casualty_actor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read actor sessions by token"
  ON public.casualty_actor_sessions FOR SELECT USING (true);

CREATE POLICY "Authenticated members can insert actor sessions"
  ON public.casualty_actor_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated members can update actor sessions"
  ON public.casualty_actor_sessions FOR UPDATE USING (true);

CREATE POLICY "Authenticated members can delete actor sessions"
  ON public.casualty_actor_sessions FOR DELETE USING (true);
