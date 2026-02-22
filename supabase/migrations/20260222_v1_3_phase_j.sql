-- v1.3 Phase J: Document Collaboration Loop
-- Tables for bidirectional sync, cross-doc coordination, versioning, milestones, assignments

-- ─── document_sync_state ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.document_sync_state (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cloud_provider text NOT NULL CHECK (cloud_provider IN ('onedrive', 'google_drive', 'sharepoint')),
  cloud_file_id text NOT NULL,
  sync_status text NOT NULL DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'synced', 'conflict', 'error')),
  last_sync_at timestamptz,
  last_cloud_edit_at timestamptz,
  last_mp_edit_at timestamptz,
  cloud_web_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(document_id, cloud_provider)
);

ALTER TABLE public.document_sync_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view sync state for their company"
  ON public.document_sync_state FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage sync state for their company"
  ON public.document_sync_state FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- ─── sync_conflicts ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sync_conflicts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL,
  section_id uuid,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  mp_version jsonb NOT NULL DEFAULT '{}'::jsonb,
  cloud_version jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolution text CHECK (resolution IN ('keep_mp', 'keep_cloud', 'merge', 'pending')),
  resolved_by uuid REFERENCES public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.sync_conflicts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view conflicts for their company"
  ON public.sync_conflicts FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage conflicts for their company"
  ON public.sync_conflicts FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- ─── coordination_rules ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coordination_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_doc_type text NOT NULL,
  source_field_path text NOT NULL,
  target_doc_type text NOT NULL,
  target_field_path text NOT NULL,
  transform_type text NOT NULL DEFAULT 'copy' CHECK (transform_type IN ('copy', 'format', 'aggregate', 'reference')),
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.coordination_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view rules for their company"
  ON public.coordination_rules FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage rules for their company"
  ON public.coordination_rules FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- ─── coordination_log ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coordination_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id uuid NOT NULL REFERENCES public.coordination_rules(id) ON DELETE CASCADE,
  trigger_document_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  affected_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  changes_applied jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'failed', 'skipped')),
  error_message text,
  executed_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.coordination_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view coordination log for their company"
  ON public.coordination_log FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- ─── document_versions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.document_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  source text NOT NULL DEFAULT 'missionpulse' CHECK (source IN ('missionpulse', 'word_online', 'excel_online', 'pptx_online', 'google_docs', 'google_sheets')),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  diff_summary jsonb,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(document_id, version_number)
);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view versions for their company"
  ON public.document_versions FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can create versions for their company"
  ON public.document_versions FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- ─── proposal_milestones ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.proposal_milestones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  milestone_type text NOT NULL CHECK (milestone_type IN ('gate_review', 'color_team', 'submission', 'debrief', 'kickoff', 'draft_due', 'final_due', 'custom')),
  title text NOT NULL,
  scheduled_date date NOT NULL,
  actual_date date,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'missed', 'cancelled')),
  notes text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.proposal_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view milestones for their company"
  ON public.proposal_milestones FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage milestones for their company"
  ON public.proposal_milestones FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- ─── section_assignments ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.section_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id uuid NOT NULL,
  assignee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  volume text,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'review', 'complete')),
  word_count integer DEFAULT 0,
  deadline date,
  assigned_by uuid REFERENCES public.profiles(id),
  assigned_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(section_id, assignee_id)
);

ALTER TABLE public.section_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view assignments for their company"
  ON public.section_assignments FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage assignments for their company"
  ON public.section_assignments FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- ─── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_document_sync_state_document ON public.document_sync_state(document_id);
CREATE INDEX IF NOT EXISTS idx_document_sync_state_company ON public.document_sync_state(company_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_document ON public.sync_conflicts(document_id);
CREATE INDEX IF NOT EXISTS idx_coordination_log_rule ON public.coordination_log(rule_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_document ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_proposal_milestones_opp ON public.proposal_milestones(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_section_assignments_section ON public.section_assignments(section_id);
CREATE INDEX IF NOT EXISTS idx_section_assignments_assignee ON public.section_assignments(assignee_id);
