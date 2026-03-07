-- Per-user OAuth tokens for self-service integrations.
-- Each user authorizes their own connected account. No admin required.

CREATE TABLE IF NOT EXISTS public.user_oauth_tokens (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider          text        NOT NULL,
  access_token      text        NOT NULL,
  refresh_token     text,
  token_type        text        NOT NULL DEFAULT 'Bearer',
  expires_at        timestamptz,
  scope             text,
  provider_user_id  text,
  provider_email    text,
  metadata          jsonb,
  connected_at      timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

ALTER TABLE public.user_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_tokens_all" ON public.user_oauth_tokens
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_oauth_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_oauth_updated_at
  BEFORE UPDATE ON public.user_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_oauth_updated_at();

CREATE INDEX IF NOT EXISTS idx_user_oauth_provider
  ON public.user_oauth_tokens (user_id, provider);
