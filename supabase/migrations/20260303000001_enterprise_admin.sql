-- v2.0 Enterprise Admin: SSO configurations, workspaces, company branding columns
-- Supports: SSO Config, Workspace Manager, Branded Templates

-- ─── sso_configurations ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sso_configurations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_id text NOT NULL,
  sso_url text NOT NULL,
  certificate text,
  is_active boolean DEFAULT true NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(company_id)
);

ALTER TABLE public.sso_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view SSO config for their company"
  ON public.sso_configurations FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can manage SSO config for their company"
  ON public.sso_configurations FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- ─── workspaces ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  domain text,
  subscription_tier text DEFAULT 'enterprise',
  is_active boolean DEFAULT true NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view workspaces for their company"
  ON public.workspaces FOR SELECT
  USING (parent_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can manage workspaces for their company"
  ON public.workspaces FOR ALL
  USING (parent_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- ─── companies: add branding columns ────────────────────────
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS header_text text,
  ADD COLUMN IF NOT EXISTS footer_text text;
