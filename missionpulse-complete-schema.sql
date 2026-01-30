-- ============================================================
-- MISSIONPULSE COMPLETE DATABASE SCHEMA
-- Run in Supabase SQL Editor
-- ============================================================

-- Drop existing tables if recreating
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS ai_approvals CASCADE;
DROP TABLE IF EXISTS win_themes CASCADE;
DROP TABLE IF EXISTS competitors CASCADE;
DROP TABLE IF EXISTS compliance_items CASCADE;
DROP TABLE IF EXISTS contract_clauses CASCADE;
DROP TABLE IF EXISTS pricing_items CASCADE;
DROP TABLE IF EXISTS teaming_partners CASCADE;
DROP TABLE IF EXISTS orals_sessions CASCADE;
DROP TABLE IF EXISTS lessons_learned CASCADE;
DROP TABLE IF EXISTS playbook_items CASCADE;
DROP TABLE IF EXISTS launch_checklists CASCADE;
DROP TABLE IF EXISTS post_award_actions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;

-- ============================================================
-- OPPORTUNITIES (Core Pipeline)
-- ============================================================
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  title TEXT,
  agency TEXT,
  ceiling NUMERIC DEFAULT 0,
  phase TEXT DEFAULT 'Qualify',
  pwin INTEGER DEFAULT 50,
  days_to_submit INTEGER DEFAULT 90,
  naics TEXT,
  set_aside TEXT,
  contract_type TEXT DEFAULT 'FFP',
  priority TEXT DEFAULT 'P-1',
  solicitation_number TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  org_id UUID
);

-- ============================================================
-- WIN THEMES
-- ============================================================
CREATE TABLE win_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  theme TEXT NOT NULL,
  description TEXT,
  discriminator TEXT,
  evidence TEXT,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- COMPETITORS (Black Hat Intel)
-- ============================================================
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  threat TEXT DEFAULT 'Medium',
  strengths TEXT,
  weaknesses TEXT,
  strategy TEXT,
  past_wins TEXT,
  estimated_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- COMPLIANCE ITEMS (RFP Shredder)
-- ============================================================
CREATE TABLE compliance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  ref TEXT,
  title TEXT NOT NULL,
  section TEXT,
  requirement_text TEXT,
  status TEXT DEFAULT 'pending',
  owner TEXT,
  confidence INTEGER DEFAULT 0,
  response_outline TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- CONTRACT CLAUSES (Contract Scanner)
-- ============================================================
CREATE TABLE contract_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  far TEXT,
  title TEXT NOT NULL,
  risk TEXT DEFAULT 'Low',
  compliance TEXT DEFAULT 'Review',
  notes TEXT,
  mitigation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PRICING ITEMS (BOE Builder)
-- ============================================================
CREATE TABLE pricing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  lcat TEXT NOT NULL,
  rate NUMERIC DEFAULT 0,
  hours INTEGER DEFAULT 0,
  wrap_rate NUMERIC DEFAULT 1.85,
  year INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TEAMING PARTNERS (Frenemy Protocol)
-- ============================================================
CREATE TABLE teaming_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Subcontractor',
  percentage INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  access_level TEXT DEFAULT 'read',
  access_expires TIMESTAMP WITH TIME ZONE,
  contact_name TEXT,
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- AI APPROVALS (HITL Queue)
-- ============================================================
CREATE TABLE ai_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  agent TEXT,
  content TEXT,
  confidence INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  reviewer TEXT,
  review_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ORALS SESSIONS
-- ============================================================
CREATE TABLE orals_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slides JSONB DEFAULT '[]',
  practice_time INTEGER DEFAULT 0,
  notes TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- LESSONS LEARNED
-- ============================================================
CREATE TABLE lessons_learned (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Process',
  lesson TEXT,
  impact TEXT DEFAULT 'Medium',
  outcome TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PLAYBOOK ITEMS (Golden Examples)
-- ============================================================
CREATE TABLE playbook_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Writing',
  content TEXT,
  score INTEGER DEFAULT 85,
  uses INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- LAUNCH CHECKLISTS
-- ============================================================
CREATE TABLE launch_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  category TEXT,
  status BOOLEAN DEFAULT FALSE,
  owner TEXT,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- POST AWARD ACTIONS
-- ============================================================
CREATE TABLE post_award_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  owner TEXT,
  due_date DATE,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TASKS (Swimlane Board)
-- ============================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  section TEXT,
  owner TEXT,
  status TEXT DEFAULT 'Draft',
  phase TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'Normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  size INTEGER,
  path TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  role TEXT,
  ip_address TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_opportunities_phase ON opportunities(phase);
CREATE INDEX idx_opportunities_priority ON opportunities(priority);
CREATE INDEX idx_opportunities_agency ON opportunities(agency);
CREATE INDEX idx_win_themes_opp ON win_themes(opp_id);
CREATE INDEX idx_competitors_opp ON competitors(opp_id);
CREATE INDEX idx_compliance_opp ON compliance_items(opp_id);
CREATE INDEX idx_pricing_opp ON pricing_items(opp_id);
CREATE INDEX idx_partners_opp ON teaming_partners(opp_id);
CREATE INDEX idx_ai_approvals_status ON ai_approvals(status);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaming_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE orals_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons_learned ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_award_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES (Allow all for authenticated users - tighten for production)
-- ============================================================
DROP POLICY IF EXISTS opportunities_all ON opportunities;
CREATE POLICY opportunities_all ON opportunities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS win_themes_all ON win_themes;
CREATE POLICY win_themes_all ON win_themes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS competitors_all ON competitors;
CREATE POLICY competitors_all ON competitors FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS compliance_items_all ON compliance_items;
CREATE POLICY compliance_items_all ON compliance_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS contract_clauses_all ON contract_clauses;
CREATE POLICY contract_clauses_all ON contract_clauses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS pricing_items_all ON pricing_items;
CREATE POLICY pricing_items_all ON pricing_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS teaming_partners_all ON teaming_partners;
CREATE POLICY teaming_partners_all ON teaming_partners FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ai_approvals_all ON ai_approvals;
CREATE POLICY ai_approvals_all ON ai_approvals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS orals_sessions_all ON orals_sessions;
CREATE POLICY orals_sessions_all ON orals_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS lessons_learned_all ON lessons_learned;
CREATE POLICY lessons_learned_all ON lessons_learned FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS playbook_items_all ON playbook_items;
CREATE POLICY playbook_items_all ON playbook_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS launch_checklists_all ON launch_checklists;
CREATE POLICY launch_checklists_all ON launch_checklists FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS post_award_actions_all ON post_award_actions;
CREATE POLICY post_award_actions_all ON post_award_actions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS tasks_all ON tasks;
CREATE POLICY tasks_all ON tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS documents_all ON documents;
CREATE POLICY documents_all ON documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS audit_logs_all ON audit_logs;
CREATE POLICY audit_logs_all ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO opportunities (nickname, title, agency, ceiling, phase, pwin, days_to_submit, naics, set_aside, contract_type, priority) VALUES
('DHA EHR Mod', 'DHA MHS GENESIS Cloud Migration', 'DHA', 98450210, 'Pink Team', 72, 37, '541512', 'SDVOSB', 'IDIQ', 'P-0'),
('VA Claims AI', 'VA Enterprise Cloud Hosting', 'VA', 45000000, 'Blue Team', 58, 82, '541511', '8(a)', 'FFP', 'P-1'),
('CMS Analytics', 'CMS Data Analytics Modernization', 'CMS', 125000000, 'Red Team', 68, 21, '541519', '', 'T&M', 'P-0'),
('IHS Telehealth', 'IHS Telehealth Expansion', 'IHS', 32000000, 'Capture', 55, 156, '541512', 'SDVOSB', 'BPA', 'P-1');

INSERT INTO playbook_items (title, category, score, uses) VALUES
('Executive Summary - DHA Win', 'Writing', 95, 47),
('Technical Innovation Theme', 'Strategy', 92, 38),
('Past Performance Narrative', 'Writing', 88, 52);

INSERT INTO lessons_learned (title, category, lesson, impact, date) VALUES
('RFP Response Time Crunch', 'Process', 'Start compliance matrix within 24hrs of RFP release', 'High', '2026-01-15'),
('Orals Prep Success', 'Presentation', 'Schedule 3 dry runs minimum, record and review', 'High', '2026-01-10'),
('Pricing Review Delay', 'Pricing', 'Lock rates 5 days before submission, not 2', 'Medium', '2026-01-05');

-- Verification
SELECT 'Schema created successfully. Tables:' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
