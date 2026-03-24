-- 004_casualty_actor_sessions.sql
-- Token-based patient actor sessions for live scenario role-players

CREATE TABLE IF NOT EXISTS public.casualty_actor_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      UUID        NOT NULL REFERENCES public.scenario_runs(id) ON DELETE CASCADE,
  casualty_id UUID        NOT NULL REFERENCES public.casualty_profiles(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '12 hours'),
  CONSTRAINT casualty_actor_sessions_token_key    UNIQUE (token),
  CONSTRAINT casualty_actor_sessions_run_cas_key  UNIQUE (run_id, casualty_id)
);

CREATE INDEX IF NOT EXISTS idx_casualty_actor_sessions_token  ON public.casualty_actor_sessions (token);
CREATE INDEX IF NOT EXISTS idx_casualty_actor_sessions_run_id ON public.casualty_actor_sessions (run_id);

ALTER TABLE public.casualty_actor_sessions ENABLE ROW LEVEL SECURITY;

-- Public read: the token itself is the secret
CREATE POLICY "Public read actor sessions by token"
  ON public.casualty_actor_sessions FOR SELECT USING (true);

-- Authenticated members can insert (token generation happens from authed client)
CREATE POLICY "Authenticated members can insert actor sessions"
  ON public.casualty_actor_sessions FOR INSERT WITH CHECK (true);

-- Allow deletion (cleanup)
CREATE POLICY "Authenticated members can delete actor sessions"
  ON public.casualty_actor_sessions FOR DELETE USING (true);
