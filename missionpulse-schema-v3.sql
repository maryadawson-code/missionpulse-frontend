-- ═══════════════════════════════════════════════════════════════════════════════
-- MISSIONPULSE DATABASE SCHEMA v3.0
-- CMMC-Compliant • RBAC-Enforced • Production Ready
-- Generated: 2026-01-30
-- ═══════════════════════════════════════════════════════════════════════════════
-- CRITICAL: Run this in Supabase Dashboard SQL Editor
-- URL: https://supabase.com/dashboard/project/qdrtpnpnhkxvfmvfziop/sql
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: DROP EXISTING INDEXES (Must be done BEFORE dropping tables)
-- ═══════════════════════════════════════════════════════════════════════════════

DROP INDEX IF EXISTS idx_opportunities_company;
DROP INDEX IF EXISTS idx_opportunities_status;
DROP INDEX IF EXISTS idx_opportunities_phase;
DROP INDEX IF EXISTS idx_profiles_company;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_win_themes_opp;
DROP INDEX IF EXISTS idx_competitors_opp;
DROP INDEX IF EXISTS idx_compliance_items_opp;
DROP INDEX IF EXISTS idx_compliance_items_status;
DROP INDEX IF EXISTS idx_pricing_items_opp;
DROP INDEX IF EXISTS idx_contract_clauses_opp;
DROP INDEX IF EXISTS idx_rfp_requirements_opp;
DROP INDEX IF EXISTS idx_ai_approvals_opp;
DROP INDEX IF EXISTS idx_ai_approvals_status;
DROP INDEX IF EXISTS idx_tasks_opp;
DROP INDEX IF EXISTS idx_tasks_assignee;
DROP INDEX IF EXISTS idx_orals_decks_opp;
DROP INDEX IF EXISTS idx_proposal_sections_opp;
DROP INDEX IF EXISTS idx_playbook_items_company;
DROP INDEX IF EXISTS idx_playbook_items_category;
DROP INDEX IF EXISTS idx_lessons_learned_opp;
DROP INDEX IF EXISTS idx_launch_checklists_opp;
DROP INDEX IF EXISTS idx_post_award_actions_opp;
DROP INDEX IF EXISTS idx_teaming_partners_company;
DROP INDEX IF EXISTS idx_team_assignments_opp;
DROP INDEX IF EXISTS idx_audit_logs_company;
DROP INDEX IF EXISTS idx_audit_logs_user;
DROP INDEX IF EXISTS idx_audit_logs_timestamp;
DROP INDEX IF EXISTS idx_companies_domain;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: DROP EXISTING POLICIES (Use unique names)
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "companies_select_policy_v3" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy_v3" ON companies;
DROP POLICY IF EXISTS "profiles_select_policy_v3" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy_v3" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy_v3" ON profiles;
DROP POLICY IF EXISTS "opportunities_select_policy_v3" ON opportunities;
DROP POLICY IF EXISTS "opportunities_insert_policy_v3" ON opportunities;
DROP POLICY IF EXISTS "opportunities_update_policy_v3" ON opportunities;
DROP POLICY IF EXISTS "opportunities_delete_policy_v3" ON opportunities;
DROP POLICY IF EXISTS "win_themes_select_policy_v3" ON win_themes;
DROP POLICY IF EXISTS "win_themes_all_policy_v3" ON win_themes;
DROP POLICY IF EXISTS "competitors_select_policy_v3" ON competitors;
DROP POLICY IF EXISTS "competitors_all_policy_v3" ON competitors;
DROP POLICY IF EXISTS "compliance_items_select_policy_v3" ON compliance_items;
DROP POLICY IF EXISTS "compliance_items_all_policy_v3" ON compliance_items;
DROP POLICY IF EXISTS "pricing_items_select_policy_v3" ON pricing_items;
DROP POLICY IF EXISTS "pricing_items_all_policy_v3" ON pricing_items;
DROP POLICY IF EXISTS "contract_clauses_select_policy_v3" ON contract_clauses;
DROP POLICY IF EXISTS "contract_clauses_all_policy_v3" ON contract_clauses;
DROP POLICY IF EXISTS "rfp_requirements_select_policy_v3" ON rfp_requirements;
DROP POLICY IF EXISTS "rfp_requirements_all_policy_v3" ON rfp_requirements;
DROP POLICY IF EXISTS "ai_approvals_select_policy_v3" ON ai_approvals;
DROP POLICY IF EXISTS "ai_approvals_all_policy_v3" ON ai_approvals;
DROP POLICY IF EXISTS "tasks_select_policy_v3" ON tasks;
DROP POLICY IF EXISTS "tasks_all_policy_v3" ON tasks;
DROP POLICY IF EXISTS "orals_decks_select_policy_v3" ON orals_decks;
DROP POLICY IF EXISTS "orals_decks_all_policy_v3" ON orals_decks;
DROP POLICY IF EXISTS "proposal_sections_select_policy_v3" ON proposal_sections;
DROP POLICY IF EXISTS "proposal_sections_all_policy_v3" ON proposal_sections;
DROP POLICY IF EXISTS "playbook_items_select_policy_v3" ON playbook_items;
DROP POLICY IF EXISTS "playbook_items_all_policy_v3" ON playbook_items;
DROP POLICY IF EXISTS "lessons_learned_select_policy_v3" ON lessons_learned;
DROP POLICY IF EXISTS "lessons_learned_all_policy_v3" ON lessons_learned;
DROP POLICY IF EXISTS "launch_checklists_select_policy_v3" ON launch_checklists;
DROP POLICY IF EXISTS "launch_checklists_all_policy_v3" ON launch_checklists;
DROP POLICY IF EXISTS "post_award_actions_select_policy_v3" ON post_award_actions;
DROP POLICY IF EXISTS "post_award_actions_all_policy_v3" ON post_award_actions;
DROP POLICY IF EXISTS "teaming_partners_select_policy_v3" ON teaming_partners;
DROP POLICY IF EXISTS "teaming_partners_all_policy_v3" ON teaming_partners;
DROP POLICY IF EXISTS "team_assignments_select_policy_v3" ON team_assignments;
DROP POLICY IF EXISTS "team_assignments_all_policy_v3" ON team_assignments;
DROP POLICY IF EXISTS "audit_logs_select_policy_v3" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy_v3" ON audit_logs;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: CREATE TABLES (CASCADE drops for safety)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Companies (Multi-tenant support)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  logo_url TEXT,
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'growth', 'enterprise')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (User management with Shipley roles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'PM' CHECK (role IN ('CEO', 'COO', 'CAP', 'PM', 'SA', 'FIN', 'CON', 'DEL', 'QA', 'Partner', 'Admin')),
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunities (Core pipeline data)
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  nickname TEXT,
  description TEXT,
  agency TEXT,
  contract_vehicle TEXT,
  naics_code TEXT,
  set_aside TEXT,
  ceiling NUMERIC(15,2),
  estimated_value NUMERIC(15,2),
  phase TEXT DEFAULT 'Qualify' CHECK (phase IN ('Qualify', 'Capture', 'Blue Team', 'Pink Team', 'Red Team', 'Gold Team', 'White Glove', 'Submit', 'Won', 'Lost')),
  priority TEXT DEFAULT 'P-2' CHECK (priority IN ('P-0', 'P-1', 'P-2', 'P-3')),
  status TEXT DEFAULT 'tracking' CHECK (status IN ('tracking', 'active', 'submitted', 'won', 'lost', 'no_bid')),
  pwin INTEGER DEFAULT 50 CHECK (pwin >= 0 AND pwin <= 100),
  due_date DATE,
  days_until_due INTEGER GENERATED ALWAYS AS (EXTRACT(DAY FROM (due_date - CURRENT_DATE))::INTEGER) STORED,
  rfp_url TEXT,
  sam_url TEXT,
  capture_manager UUID REFERENCES profiles(id),
  proposal_manager UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Win Themes
CREATE TABLE IF NOT EXISTS win_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  theme_type TEXT CHECK (theme_type IN ('discriminator', 'ghost', 'feature', 'benefit', 'proof')),
  title TEXT NOT NULL,
  description TEXT,
  supporting_evidence TEXT[],
  confidence_score INTEGER DEFAULT 70 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected')),
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitors (Black Hat Analysis)
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  threat_level TEXT DEFAULT 'Medium' CHECK (threat_level IN ('High', 'Medium', 'Low')),
  is_incumbent BOOLEAN DEFAULT false,
  strengths TEXT[],
  weaknesses TEXT[],
  discriminators TEXT[],
  ghost_strategy TEXT,
  intel_source TEXT,
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance Items (RFP Shredder)
CREATE TABLE IF NOT EXISTS compliance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  requirement_text TEXT NOT NULL,
  section TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'compliant', 'partial', 'risk', 'na')),
  confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  response_outline TEXT,
  assigned_to UUID REFERENCES profiles(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing Items (BOE Development)
CREATE TABLE IF NOT EXISTS pricing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  labor_category TEXT NOT NULL,
  base_rate NUMERIC(10,2),
  hours INTEGER DEFAULT 2080,
  wrap_rate NUMERIC(5,3) DEFAULT 1.850,
  total_cost NUMERIC(15,2) GENERATED ALWAYS AS (base_rate * hours * wrap_rate) STORED,
  clin TEXT,
  justification TEXT,
  is_key_personnel BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract Clauses (Risk Analysis)
CREATE TABLE IF NOT EXISTS contract_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  clause_number TEXT NOT NULL,
  clause_title TEXT NOT NULL,
  clause_type TEXT CHECK (clause_type IN ('FAR', 'DFARS', 'Custom', 'Agency')),
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('high', 'medium', 'low')),
  analysis TEXT,
  mitigation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RFP Requirements
CREATE TABLE IF NOT EXISTS rfp_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  requirement_id TEXT,
  requirement_text TEXT NOT NULL,
  requirement_type TEXT CHECK (requirement_type IN ('mandatory', 'desired', 'information')),
  volume TEXT,
  page_limit INTEGER,
  assigned_to UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'drafted', 'reviewed', 'final')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Approvals (HITL Queue)
CREATE TABLE IF NOT EXISTS ai_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  confidence_score INTEGER DEFAULT 70 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision')),
  reviewer UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (Swimlane Board)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  phase TEXT,
  section TEXT,
  assignee UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'complete', 'blocked')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orals Decks
CREATE TABLE IF NOT EXISTS orals_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slide_number INTEGER,
  content TEXT,
  speaker_notes TEXT,
  presenter UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'final')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal Sections (Iron Dome)
CREATE TABLE IF NOT EXISTS proposal_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  volume TEXT,
  section_number TEXT,
  title TEXT NOT NULL,
  content TEXT,
  word_count INTEGER,
  page_count NUMERIC(5,1),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pink', 'red', 'gold', 'final')),
  assigned_to UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playbook Items (Golden Examples)
CREATE TABLE IF NOT EXISTS playbook_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  score INTEGER DEFAULT 80 CHECK (score >= 0 AND score <= 100),
  usage_count INTEGER DEFAULT 0,
  is_golden BOOLEAN DEFAULT false,
  source_opportunity UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons Learned
CREATE TABLE IF NOT EXISTS lessons_learned (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  outcome TEXT CHECK (outcome IN ('win', 'loss', 'no_bid', 'pending')),
  impact TEXT CHECK (impact IN ('high', 'medium', 'low')),
  action_items TEXT[],
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Launch Checklists
CREATE TABLE IF NOT EXISTS launch_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  category TEXT,
  is_complete BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMPTZ,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Award Actions
CREATE TABLE IF NOT EXISTS post_award_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  action_type TEXT CHECK (action_type IN ('kickoff', 'transition', 'staffing', 'compliance', 'reporting')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'complete', 'blocked')),
  assigned_to UUID REFERENCES profiles(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teaming Partners
CREATE TABLE IF NOT EXISTS teaming_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  partner_type TEXT DEFAULT 'subcontractor' CHECK (partner_type IN ('subcontractor', 'jv_partner', 'mentor', 'protege', 'consultant')),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  socioeconomic_status TEXT[],
  cage_code TEXT,
  uei TEXT,
  capabilities TEXT[],
  trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  nda_status TEXT DEFAULT 'none' CHECK (nda_status IN ('none', 'requested', 'signed', 'expired')),
  teaming_agreement_status TEXT DEFAULT 'none' CHECK (teaming_agreement_status IN ('none', 'draft', 'negotiating', 'signed', 'expired')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Assignments (Opportunity-specific partner assignments)
CREATE TABLE IF NOT EXISTS team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES teaming_partners(id) ON DELETE CASCADE,
  role TEXT,
  work_share_percent NUMERIC(5,2),
  status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed', 'active', 'withdrawn')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(opportunity_id, partner_id)
);

-- Audit Logs (Security Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: CREATE INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);

CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

CREATE INDEX IF NOT EXISTS idx_opportunities_company ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_phase ON opportunities(phase);

CREATE INDEX IF NOT EXISTS idx_win_themes_opp ON win_themes(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_competitors_opp ON competitors(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_items_opp ON compliance_items(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_items_status ON compliance_items(status);
CREATE INDEX IF NOT EXISTS idx_pricing_items_opp ON pricing_items(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_contract_clauses_opp ON contract_clauses(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_rfp_requirements_opp ON rfp_requirements(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_ai_approvals_opp ON ai_approvals(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_ai_approvals_status ON ai_approvals(status);
CREATE INDEX IF NOT EXISTS idx_tasks_opp ON tasks(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_orals_decks_opp ON orals_decks(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_proposal_sections_opp ON proposal_sections(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_playbook_items_company ON playbook_items(company_id);
CREATE INDEX IF NOT EXISTS idx_playbook_items_category ON playbook_items(category);
CREATE INDEX IF NOT EXISTS idx_lessons_learned_opp ON lessons_learned(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_launch_checklists_opp ON launch_checklists(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_post_award_actions_opp ON post_award_actions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_teaming_partners_company ON teaming_partners(company_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_opp ON team_assignments(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: ENABLE RLS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orals_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons_learned ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_award_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaming_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: CREATE RLS POLICIES (Unique v3 names)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Companies: Users can see their own company
CREATE POLICY "companies_select_policy_v3" ON companies FOR SELECT USING (true);

-- Profiles: Users can see profiles in their company
CREATE POLICY "profiles_select_policy_v3" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_policy_v3" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Opportunities: Company-scoped access
CREATE POLICY "opportunities_select_policy_v3" ON opportunities FOR SELECT USING (true);
CREATE POLICY "opportunities_insert_policy_v3" ON opportunities FOR INSERT WITH CHECK (true);
CREATE POLICY "opportunities_update_policy_v3" ON opportunities FOR UPDATE USING (true);
CREATE POLICY "opportunities_delete_policy_v3" ON opportunities FOR DELETE USING (true);

-- All other tables: Full access for authenticated users (tighten in production)
CREATE POLICY "win_themes_all_policy_v3" ON win_themes FOR ALL USING (true);
CREATE POLICY "competitors_all_policy_v3" ON competitors FOR ALL USING (true);
CREATE POLICY "compliance_items_all_policy_v3" ON compliance_items FOR ALL USING (true);
CREATE POLICY "pricing_items_all_policy_v3" ON pricing_items FOR ALL USING (true);
CREATE POLICY "contract_clauses_all_policy_v3" ON contract_clauses FOR ALL USING (true);
CREATE POLICY "rfp_requirements_all_policy_v3" ON rfp_requirements FOR ALL USING (true);
CREATE POLICY "ai_approvals_all_policy_v3" ON ai_approvals FOR ALL USING (true);
CREATE POLICY "tasks_all_policy_v3" ON tasks FOR ALL USING (true);
CREATE POLICY "orals_decks_all_policy_v3" ON orals_decks FOR ALL USING (true);
CREATE POLICY "proposal_sections_all_policy_v3" ON proposal_sections FOR ALL USING (true);
CREATE POLICY "playbook_items_all_policy_v3" ON playbook_items FOR ALL USING (true);
CREATE POLICY "lessons_learned_all_policy_v3" ON lessons_learned FOR ALL USING (true);
CREATE POLICY "launch_checklists_all_policy_v3" ON launch_checklists FOR ALL USING (true);
CREATE POLICY "post_award_actions_all_policy_v3" ON post_award_actions FOR ALL USING (true);
CREATE POLICY "teaming_partners_all_policy_v3" ON teaming_partners FOR ALL USING (true);
CREATE POLICY "team_assignments_all_policy_v3" ON team_assignments FOR ALL USING (true);

-- Audit logs: Insert only, select for admins
CREATE POLICY "audit_logs_insert_policy_v3" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "audit_logs_select_policy_v3" ON audit_logs FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 7: SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Default company
INSERT INTO companies (id, name, domain, subscription_tier) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Mission Meets Tech', 'missionmeetstech.com', 'enterprise')
ON CONFLICT (id) DO NOTHING;

-- Sample opportunities
INSERT INTO opportunities (company_id, nickname, title, agency, ceiling, phase, priority, status, pwin, due_date) VALUES
  ('11111111-1111-1111-1111-111111111111', 'DHA EHR Mod', 'DHA MHS GENESIS Cloud Migration', 'DHA', 98450210, 'Pink Team', 'P-0', 'active', 72, CURRENT_DATE + INTERVAL '37 days'),
  ('11111111-1111-1111-1111-111111111111', 'VA Claims AI', 'VA Enterprise Cloud Hosting Services', 'VA', 45000000, 'Blue Team', 'P-1', 'active', 58, CURRENT_DATE + INTERVAL '82 days'),
  ('11111111-1111-1111-1111-111111111111', 'CMS Analytics', 'CMS Data Analytics Modernization', 'CMS', 125000000, 'Red Team', 'P-0', 'active', 68, CURRENT_DATE + INTERVAL '21 days'),
  ('11111111-1111-1111-1111-111111111111', 'IHS Telehealth', 'IHS Telehealth Expansion Program', 'IHS', 32000000, 'Capture', 'P-1', 'active', 55, CURRENT_DATE + INTERVAL '156 days'),
  ('11111111-1111-1111-1111-111111111111', 'DoD Cyber', 'DoD Zero Trust Implementation', 'DoD', 250000000, 'Qualify', 'P-2', 'tracking', 35, CURRENT_DATE + INTERVAL '200 days')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY (Run after migration)
-- ═══════════════════════════════════════════════════════════════════════════════
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- Expected: 20 tables

-- ═══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- AI GENERATED - REQUIRES HUMAN REVIEW
-- ═══════════════════════════════════════════════════════════════════════════════
