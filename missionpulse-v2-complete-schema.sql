-- ============================================================
-- MISSIONPULSE V2 - COMPLETE DATABASE SCHEMA
-- Run in Supabase SQL Editor
-- Created: January 29, 2026
-- ============================================================

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Opportunities (Pipeline)
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  agency TEXT,
  value BIGINT DEFAULT 0,
  status TEXT DEFAULT 'Identified',
  phase TEXT DEFAULT 'Phase 0',
  pwin INT DEFAULT 50,
  due_date TIMESTAMPTZ,
  solicitation_number TEXT,
  naics_code TEXT,
  set_aside TEXT,
  contract_type TEXT,
  description TEXT,
  source TEXT,
  capture_manager TEXT,
  proposal_manager TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Assignments
CREATE TABLE IF NOT EXISTS team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  role TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROPOSAL DEVELOPMENT
-- ============================================================

-- Proposal Sections (Iron Dome)
CREATE TABLE IF NOT EXISTS proposal_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  section_number TEXT NOT NULL,
  title TEXT NOT NULL,
  volume TEXT DEFAULT 'technical',
  content TEXT,
  word_count INT DEFAULT 0,
  word_limit INT DEFAULT 2000,
  status TEXT DEFAULT 'draft',
  ai_percent INT DEFAULT 0,
  citation_count INT DEFAULT 0,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RFP Requirements (Shredder)
CREATE TABLE IF NOT EXISTS rfp_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  requirement_id TEXT NOT NULL,
  rfp_section TEXT DEFAULT 'L',
  requirement_type TEXT DEFAULT 'shall',
  requirement_text TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  source_page TEXT,
  compliance_response TEXT,
  proposal_section TEXT,
  assigned_to TEXT,
  is_mapped BOOLEAN DEFAULT FALSE,
  is_compliant BOOLEAN DEFAULT FALSE,
  is_risk BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Win Themes
CREATE TABLE IF NOT EXISTS win_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  theme_title TEXT NOT NULL,
  theme_description TEXT,
  discriminator_type TEXT DEFAULT 'feature',
  proof_points TEXT,
  volume_section TEXT DEFAULT 'technical',
  ai_generated BOOLEAN DEFAULT FALSE,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRICING & COMPLIANCE
-- ============================================================

-- Pricing Items
CREATE TABLE IF NOT EXISTS pricing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  clin TEXT,
  description TEXT NOT NULL,
  quantity INT DEFAULT 1,
  unit TEXT DEFAULT 'Each',
  unit_price DECIMAL(12,2) DEFAULT 0,
  extended_price DECIMAL(14,2) DEFAULT 0,
  labor_category TEXT,
  hours INT,
  rate DECIMAL(8,2),
  is_optional BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract Clauses
CREATE TABLE IF NOT EXISTS contract_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  clause_number TEXT NOT NULL,
  category TEXT DEFAULT 'far',
  title TEXT NOT NULL,
  description TEXT,
  risk_level TEXT DEFAULT 'low',
  financial_impact BIGINT,
  ai_analysis TEXT,
  mitigation_strategy TEXT,
  is_reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance Items
CREATE TABLE IF NOT EXISTS compliance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  requirement TEXT NOT NULL,
  section_reference TEXT,
  status TEXT DEFAULT 'pending',
  response TEXT,
  assigned_to TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMPETITOR INTELLIGENCE
-- ============================================================

-- Competitors (Black Hat)
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  strengths TEXT,
  weaknesses TEXT,
  strategy TEXT,
  ghost_themes TEXT,
  threat_level TEXT DEFAULT 'medium',
  win_probability INT,
  intel_source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Frenemy Entities
CREATE TABLE IF NOT EXISTS frenemy_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL,
  relationship TEXT DEFAULT 'unknown',
  cage_code TEXT,
  set_aside_status TEXT,
  threat_score INT,
  win_rate INT,
  capabilities TEXT,
  strengths TEXT,
  weaknesses TEXT,
  intel_notes TEXT,
  contact_name TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TEAMING & PAST PERFORMANCE
-- ============================================================

-- Teaming Partners
CREATE TABLE IF NOT EXISTS teaming_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  partner_type TEXT DEFAULT 'subcontractor',
  set_aside_status TEXT,
  cage_code TEXT,
  duns_number TEXT,
  nda_signed BOOLEAN DEFAULT FALSE,
  nda_expiry DATE,
  ta_signed BOOLEAN DEFAULT FALSE,
  ta_expiry DATE,
  capability_areas TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  workshare_percent INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Past Performance
CREATE TABLE IF NOT EXISTS past_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_name TEXT NOT NULL,
  contract_number TEXT,
  contracting_agency TEXT,
  contract_value BIGINT DEFAULT 0,
  start_date DATE,
  end_date DATE,
  period_of_performance TEXT,
  cpars_rating TEXT DEFAULT 'satisfactory',
  relevance_score INT DEFAULT 50,
  poc_name TEXT,
  poc_email TEXT,
  poc_phone TEXT,
  scope_description TEXT,
  key_accomplishments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI & REVIEW
-- ============================================================

-- AI Approvals (HITL)
CREATE TABLE IF NOT EXISTS ai_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_title TEXT,
  ai_output TEXT NOT NULL,
  confidence_score INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  reviewer TEXT,
  reviewer_notes TEXT,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orals Sessions
CREATE TABLE IF NOT EXISTS orals_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  session_type TEXT DEFAULT 'mock',
  session_date TIMESTAMPTZ DEFAULT NOW(),
  presenter_name TEXT,
  presenter_role TEXT,
  time_limit_minutes INT DEFAULT 30,
  qa_bank JSONB DEFAULT '[]',
  recording_url TEXT,
  ai_feedback TEXT,
  confidence_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LAUNCH & POST-AWARD
-- ============================================================

-- Launch Checklist
CREATE TABLE IF NOT EXISTS launch_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'content',
  assigned_to TEXT,
  due_date DATE,
  is_complete BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Launch ROI
CREATE TABLE IF NOT EXISTS launch_roi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE UNIQUE NOT NULL,
  contract_value BIGINT DEFAULT 0,
  pwin INT DEFAULT 50,
  labor_hours INT DEFAULT 0,
  hourly_rate INT DEFAULT 150,
  other_costs BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submission Log
CREATE TABLE IF NOT EXISTS submission_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_by TEXT,
  submission_method TEXT DEFAULT 'Electronic',
  confirmation_number TEXT
);

-- Post-Award Tasks
CREATE TABLE IF NOT EXISTS post_award_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  phase TEXT DEFAULT 'award',
  priority TEXT DEFAULT 'medium',
  assigned_to TEXT,
  due_date DATE,
  notes TEXT,
  is_complete BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract Details
CREATE TABLE IF NOT EXISTS contract_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE UNIQUE NOT NULL,
  contract_number TEXT,
  award_date DATE,
  pop_start DATE,
  pop_end DATE,
  contracting_officer TEXT,
  cor_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- KNOWLEDGE & REPORTING
-- ============================================================

-- Lessons Learned
CREATE TABLE IF NOT EXISTS lessons_learned (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  outcome TEXT,
  impact_level TEXT DEFAULT 'medium',
  context TEXT NOT NULL,
  insight TEXT NOT NULL,
  recommendation TEXT,
  submitted_by TEXT,
  tags TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT DEFAULT 'pipeline',
  report_name TEXT NOT NULL,
  generated_by TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  date_range_start DATE,
  date_range_end DATE,
  report_data JSONB DEFAULT '{}',
  export_format TEXT DEFAULT 'pdf',
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE frenemy_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaming_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE past_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE orals_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_roi ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_award_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons_learned ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PUBLIC ACCESS POLICIES (For Development)
-- Replace with proper RBAC policies in production
-- ============================================================

-- Drop existing policies if they exist (safe re-run)
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Create public access policies
CREATE POLICY "opportunities_public_all" ON opportunities FOR ALL USING (true);
CREATE POLICY "team_assignments_public_all" ON team_assignments FOR ALL USING (true);
CREATE POLICY "proposal_sections_public_all" ON proposal_sections FOR ALL USING (true);
CREATE POLICY "rfp_requirements_public_all" ON rfp_requirements FOR ALL USING (true);
CREATE POLICY "win_themes_public_all" ON win_themes FOR ALL USING (true);
CREATE POLICY "pricing_items_public_all" ON pricing_items FOR ALL USING (true);
CREATE POLICY "contract_clauses_public_all" ON contract_clauses FOR ALL USING (true);
CREATE POLICY "compliance_items_public_all" ON compliance_items FOR ALL USING (true);
CREATE POLICY "competitors_public_all" ON competitors FOR ALL USING (true);
CREATE POLICY "frenemy_entities_public_all" ON frenemy_entities FOR ALL USING (true);
CREATE POLICY "teaming_partners_public_all" ON teaming_partners FOR ALL USING (true);
CREATE POLICY "past_performance_public_all" ON past_performance FOR ALL USING (true);
CREATE POLICY "ai_approvals_public_all" ON ai_approvals FOR ALL USING (true);
CREATE POLICY "orals_sessions_public_all" ON orals_sessions FOR ALL USING (true);
CREATE POLICY "launch_checklist_public_all" ON launch_checklist FOR ALL USING (true);
CREATE POLICY "launch_roi_public_all" ON launch_roi FOR ALL USING (true);
CREATE POLICY "submission_log_public_all" ON submission_log FOR ALL USING (true);
CREATE POLICY "post_award_tasks_public_all" ON post_award_tasks FOR ALL USING (true);
CREATE POLICY "contract_details_public_all" ON contract_details FOR ALL USING (true);
CREATE POLICY "lessons_learned_public_all" ON lessons_learned FOR ALL USING (true);
CREATE POLICY "reports_public_all" ON reports FOR ALL USING (true);
CREATE POLICY "audit_logs_public_all" ON audit_logs FOR ALL USING (true);

-- ============================================================
-- SAMPLE DATA (Optional - Remove for Production)
-- ============================================================

-- Insert sample opportunities
INSERT INTO opportunities (title, agency, value, status, pwin, due_date, naics_code) VALUES
  ('VA EHR Modernization Support', 'VA', 45000000, 'Proposal', 65, '2026-03-15', '541512'),
  ('DHA Clinical Analytics Platform', 'DHA', 28000000, 'Capture', 55, '2026-04-01', '541511'),
  ('CMS Data Integration Services', 'CMS', 15000000, 'Qualification', 40, '2026-05-15', '541519'),
  ('IHS Telehealth Expansion', 'IHS', 8500000, 'Identified', 30, '2026-06-30', '541512')
ON CONFLICT DO NOTHING;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_due_date ON opportunities(due_date);
CREATE INDEX IF NOT EXISTS idx_proposal_sections_opportunity ON proposal_sections(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_rfp_requirements_opportunity ON rfp_requirements(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_pricing_items_opportunity ON pricing_items(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_competitors_opportunity ON competitors(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_ai_approvals_status ON ai_approvals(status);
CREATE INDEX IF NOT EXISTS idx_lessons_learned_category ON lessons_learned(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================
-- COMPLETION MESSAGE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE 'MissionPulse v2 schema created successfully!';
  RAISE NOTICE 'Tables: 22';
  RAISE NOTICE 'RLS: Enabled on all tables';
  RAISE NOTICE 'Policies: Public access (dev mode)';
END $$;
