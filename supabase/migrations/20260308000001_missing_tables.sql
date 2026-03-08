-- fine_tune_jobs: referenced in codebase, missing from DB
CREATE TABLE IF NOT EXISTS public.fine_tune_jobs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by      uuid        NOT NULL REFERENCES auth.users(id),
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','running','completed','failed','cancelled')),
  base_model      text        NOT NULL,
  training_file   text,
  result_model_id text,
  error_message   text,
  metadata        jsonb,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fine_tune_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_members_fine_tune" ON public.fine_tune_jobs
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );
CREATE INDEX IF NOT EXISTS idx_fine_tune_jobs_company ON public.fine_tune_jobs (company_id);

-- company_voice_profiles: referenced in writer agent, missing from DB
CREATE TABLE IF NOT EXISTS public.company_voice_profiles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  tone            text,
  style_keywords  text[],
  sample_content  text,
  fingerprint     jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.company_voice_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_members_voice_profile" ON public.company_voice_profiles
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );
