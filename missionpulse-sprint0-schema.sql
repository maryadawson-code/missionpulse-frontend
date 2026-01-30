-- ═══════════════════════════════════════════════════════════════
-- MISSIONPULSE DATABASE SCHEMA v1.0
-- Sprint 0: Database Foundation
-- Run this in Supabase SQL Editor
-- Created: January 26, 2026
-- ═══════════════════════════════════════════════════════════════

-- 1. COMPANIES TABLE (for multi-tenant support)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  logo_url TEXT,
  subscription_tier TEXT DEFAULT 'starter', -- starter, growth, enterprise
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default company
INSERT INTO companies (id, name, domain, subscription_tier) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Mission Meets Tech', 'missionmeetstech.com', 'enterprise')
ON CONFLICT (id) DO NOTHING;


-- 2. USERS TABLE (11 Shipley Roles)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role_id TEXT NOT NULL, -- CEO, COO, CAP, PM, SA, FIN, CON, DEL, QA, Partner, Admin
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert sample users (11 Shipley roles)
INSERT INTO users (company_id, email, full_name, role_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'mwomack@missionmeetstech.com', 'Mary Womack', 'CEO'),
  ('11111111-1111-1111-1111-111111111111', 'jthompson@missionmeetstech.com', 'James Thompson', 'COO'),
  ('11111111-1111-1111-1111-111111111111', 'schen@missionmeetstech.com', 'Sarah Chen', 'CAP'),
  ('11111111-1111-1111-1111-111111111111', 'mrodriguez@missionmeetstech.com', 'Michael Rodriguez', 'PM'),
  ('11111111-1111-1111-1111-111111111111', 'jwong@missionmeetstech.com', 'James Wong', 'SA'),
  ('11111111-1111-1111-1111-111111111111', 'akim@missionmeetstech.com', 'Angela Kim', 'FIN'),
  ('11111111-1111-1111-1111-111111111111', 'dpatel@missionmeetstech.com', 'David Patel', 'CON'),
  ('11111111-1111-1111-1111-111111111111', 'ljohnson@missionmeetstech.com', 'Lisa Johnson', 'DEL'),
  ('11111111-1111-1111-1111-111111111111', 'rsmith@missionmeetstech.com', 'Robert Smith', 'QA'),
  ('11111111-1111-1111-1111-111111111111', 'partner@cipherhealth.com', 'Cipher Health Analytics', 'Partner'),
  ('11111111-1111-1111-1111-111111111111', 'admin@missionmeetstech.com', 'System Admin', 'Admin')
ON CONFLICT (email) DO NOTHING;


-- 3. COMPETITORS TABLE (Black Hat Analysis)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  threat_level TEXT DEFAULT 'Medium', -- High, Medium, Low
  incumbent BOOLEAN DEFAULT false,
  strengths TEXT[],
  weaknesses TEXT[],
  discriminators TEXT[],
  ghost_strategy TEXT,
  intel_source TEXT,
  confidence_score INTEGER DEFAULT 50, -- 0-100
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitors_opp ON competitors(opportunity_id);

-- Insert sample competitors for DHA EHR Mod opportunity
INSERT INTO competitors (opportunity_id, company_name, threat_level, incumbent, strengths, weaknesses, ghost_strategy) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'GovCorp Legacy Services', 'High', true, 
   ARRAY['Incumbent advantage', '15-year DHA relationship', 'Cleared workforce'], 
   ARRAY['Aging technology stack', 'No FedRAMP High', 'Recent CPARS downgrade'],
   'Highlight their proprietary middleware lock-in and 40% cost overruns during tech refresh'),
  ('aaaa1111-1111-1111-1111-111111111111', 'CloudFirst Federal', 'Medium', false,
   ARRAY['Strong cloud credentials', 'AWS GovCloud expertise'],
   ARRAY['No EHR migration experience', 'Limited DHA past performance'],
   'Emphasize our proven 4.2M record migration with zero breaches'),
  ('bbbb2222-2222-2222-2222-222222222222', 'VetTech Solutions', 'High', true,
   ARRAY['VA incumbent', 'Deep VBA knowledge'],
   ARRAY['No AI/ML capabilities', 'Manual processes'],
   'Position AI automation as 60% faster claims processing')
ON CONFLICT DO NOTHING;


-- 4. COMPLIANCE REQUIREMENTS TABLE (Iron Dome)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  pws_reference TEXT NOT NULL, -- PWS 4.3.1, Section L.2, etc.
  requirement_text TEXT NOT NULL,
  status TEXT DEFAULT 'Not Started', -- Not Started, In Progress, Compliant, Partial, High Risk
  risk_level TEXT DEFAULT 'Green', -- Green, Yellow, Red
  assigned_to UUID REFERENCES users(id),
  section_assignment TEXT, -- Volume I, Volume II, etc.
  response_outline TEXT,
  proof_points TEXT[],
  due_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_opp ON compliance_requirements(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_requirements(status);
CREATE INDEX IF NOT EXISTS idx_compliance_assigned ON compliance_requirements(assigned_to);

-- Insert sample compliance requirements
INSERT INTO compliance_requirements (opportunity_id, pws_reference, requirement_text, status, risk_level) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'PWS 4.3.1', 'The Contractor shall ensure all clinical data exchanges comply with HL7 FHIR Release 4 standards', 'High Risk', 'Red'),
  ('aaaa1111-1111-1111-1111-111111111111', 'PWS 4.3.2', 'All systems must achieve FedRAMP High authorization within 180 days of contract award', 'Compliant', 'Green'),
  ('aaaa1111-1111-1111-1111-111111111111', 'PWS 5.1.1', 'Key personnel must possess active Secret clearance minimum', 'Compliant', 'Green'),
  ('aaaa1111-1111-1111-1111-111111111111', 'Section L.5', 'Past performance references must include at least one DoD healthcare IT contract over $25M', 'Partial', 'Yellow'),
  ('aaaa1111-1111-1111-1111-111111111111', 'Section M.2', 'Technical approach must address zero-trust architecture implementation', 'In Progress', 'Green')
ON CONFLICT DO NOTHING;


-- 5. TEAM MEMBERS TABLE (Staffing & Pricing)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role_title TEXT NOT NULL, -- Program Manager, Technical Lead, etc.
  labor_category TEXT, -- Matches LCAT from contract
  is_key_personnel BOOLEAN DEFAULT false,
  clearance_level TEXT, -- None, Public Trust, Secret, TS, TS/SCI
  hourly_rate NUMERIC(10,2),
  loaded_rate NUMERIC(10,2),
  allocated_hours INTEGER,
  start_date DATE,
  end_date DATE,
  resume_on_file BOOLEAN DEFAULT false,
  loi_status TEXT DEFAULT 'Not Started', -- Not Started, Requested, Received, Signed
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_opp ON team_members(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_team_key ON team_members(is_key_personnel);


-- 6. PARTNERS TABLE (Teaming Arrangements)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id), -- Our company
  partner_name TEXT NOT NULL,
  partner_type TEXT DEFAULT 'Subcontractor', -- Subcontractor, JV Partner, Mentor, Protégé
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  socioeconomic_status TEXT[], -- SDVOSB, 8(a), HUBZone, WOSB, etc.
  cage_code TEXT,
  duns_number TEXT,
  capabilities TEXT[],
  past_performance_summary TEXT,
  trust_score INTEGER DEFAULT 50, -- 0-100
  nda_status TEXT DEFAULT 'None', -- None, Requested, Signed
  teaming_agreement_status TEXT DEFAULT 'None', -- None, Draft, Signed
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partners_company ON partners(company_id);

-- Insert sample partners
INSERT INTO partners (company_id, partner_name, partner_type, socioeconomic_status, capabilities, trust_score) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Cipher Health Analytics', 'Subcontractor', 
   ARRAY['SDVOSB'], ARRAY['Healthcare AI/ML', 'Clinical Analytics', 'FHIR Integration'], 78),
  ('11111111-1111-1111-1111-111111111111', 'VetBridge Consulting', 'Subcontractor',
   ARRAY['SDVOSB', 'VOSB'], ARRAY['VA Systems Integration', 'VistA Expertise', 'Change Management'], 85),
  ('11111111-1111-1111-1111-111111111111', 'NexGen Cloud Federal', 'Subcontractor',
   ARRAY['8(a)'], ARRAY['AWS GovCloud', 'FedRAMP Authorization', 'Cloud Migration'], 72)
ON CONFLICT DO NOTHING;


-- 7. PARTNER OPPORTUNITIES (Junction Table)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS partner_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  role TEXT, -- Prime, Major Sub, Minor Sub
  worksheet_percentage NUMERIC(5,2), -- % of work
  estimated_value NUMERIC(15,2),
  status TEXT DEFAULT 'Proposed', -- Proposed, Confirmed, Declined
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(opportunity_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_opps_opp ON partner_opportunities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_partner_opps_partner ON partner_opportunities(partner_id);


-- 8. PLAYBOOK LESSONS TABLE (Lessons Learned)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS playbook_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id),
  category TEXT NOT NULL, -- Win Theme, Ghost, Compliance, Pricing, Orals, Process
  title TEXT NOT NULL,
  lesson_text TEXT NOT NULL,
  context TEXT, -- What situation prompted this lesson
  outcome TEXT, -- Win, Loss, Pending
  impact_score INTEGER DEFAULT 5, -- 1-10
  is_golden_example BOOLEAN DEFAULT false,
  tags TEXT[],
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_company ON playbook_lessons(company_id);
CREATE INDEX IF NOT EXISTS idx_lessons_category ON playbook_lessons(category);
CREATE INDEX IF NOT EXISTS idx_lessons_golden ON playbook_lessons(is_golden_example);

-- Insert sample lessons
INSERT INTO playbook_lessons (company_id, category, title, lesson_text, outcome, is_golden_example, tags) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Win Theme', 'FedRAMP as Schedule Risk Eliminator',
   'Position our existing FedRAMP High authorization as eliminating 6-month authorization timeline risk. Quantify avoided costs and schedule impact.',
   'Win', true, ARRAY['FedRAMP', 'Cloud', 'Risk Mitigation']),
  ('11111111-1111-1111-1111-111111111111', 'Ghost', 'Incumbent Lock-In Ghost',
   'When competing against entrenched incumbents, highlight proprietary middleware and data portability risks. Reference GAO reports on vendor lock-in costs.',
   'Win', true, ARRAY['Ghosting', 'Incumbent', 'Competitive']),
  ('11111111-1111-1111-1111-111111111111', 'Compliance', 'Section L Cross-Reference Matrix',
   'Always create explicit cross-reference matrix mapping Section L requirements to Volume locations. Evaluators consistently praised this approach.',
   'Win', false, ARRAY['Compliance', 'Section L', 'Organization'])
ON CONFLICT DO NOTHING;


-- 9. DOCUMENTS TABLE (Vault)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  file_name TEXT NOT NULL,
  file_type TEXT, -- pdf, docx, xlsx, pptx
  file_size INTEGER,
  storage_path TEXT, -- Supabase Storage path
  storage_bucket TEXT DEFAULT 'documents',
  portion_marking TEXT DEFAULT 'Unclassified', -- CUI, FOUO, Unclassified
  document_type TEXT, -- RFP, Amendment, Draft, Final, Reference
  version INTEGER DEFAULT 1,
  description TEXT,
  uploaded_by UUID REFERENCES users(id),
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_opp ON documents(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_docs_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_docs_type ON documents(document_type);


-- 10. GATE REVIEWS TABLE (Go/No-Go Tracking)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS gate_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  gate_number INTEGER NOT NULL, -- 1, 2, 3, 4
  gate_name TEXT NOT NULL, -- Bid/No-Bid, Blue Team, Red Team, Gold Team
  scheduled_date DATE,
  actual_date DATE,
  decision TEXT, -- Go, No-Go, Conditional Go, Deferred
  decision_maker UUID REFERENCES users(id),
  conditions TEXT[], -- Conditions for Conditional Go
  attendees UUID[],
  meeting_notes TEXT,
  risk_assessment JSONB, -- Structured risk data
  pwin_at_gate INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gates_opp ON gate_reviews(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_gates_decision ON gate_reviews(decision);

-- Insert sample gate reviews
INSERT INTO gate_reviews (opportunity_id, gate_number, gate_name, decision, pwin_at_gate, conditions) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 1, 'Bid/No-Bid', 'Conditional Go', 72,
   ARRAY['Blue Team validation of Cipher Health teaming', 'Confirm FHIR R4 certification timeline', 'Finalize Dr. Reyes LOI']),
  ('bbbb2222-2222-2222-2222-222222222222', 1, 'Bid/No-Bid', 'Go', 58, NULL),
  ('cccc3333-3333-3333-3333-333333333333', 2, 'Blue Team', 'Go', 68, NULL)
ON CONFLICT DO NOTHING;


-- 11. ACTIVITY LOG TABLE (Audit Trail)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- created, updated, deleted, viewed, exported, shared
  entity_type TEXT NOT NULL, -- opportunity, compliance, document, etc.
  entity_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_company ON activity_log(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_opp ON activity_log(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);


-- 12. UPDATE OPPORTUNITIES TABLE (Add missing columns if needed)
-- ═══════════════════════════════════════════════════════════════
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='opportunities' AND column_name='naics_code') THEN
    ALTER TABLE opportunities ADD COLUMN naics_code TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='opportunities' AND column_name='set_aside') THEN
    ALTER TABLE opportunities ADD COLUMN set_aside TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='opportunities' AND column_name='period_of_performance') THEN
    ALTER TABLE opportunities ADD COLUMN period_of_performance TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='opportunities' AND column_name='release_date') THEN
    ALTER TABLE opportunities ADD COLUMN release_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='opportunities' AND column_name='current_gate') THEN
    ALTER TABLE opportunities ADD COLUMN current_gate INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='opportunities' AND column_name='assigned_cap') THEN
    ALTER TABLE opportunities ADD COLUMN assigned_cap UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='opportunities' AND column_name='assigned_pm') THEN
    ALTER TABLE opportunities ADD COLUMN assigned_pm UUID;
  END IF;
END $$;


-- 13. DISABLE RLS FOR TESTING (Re-enable in Sprint 7)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE competitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE partner_opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE gate_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;


-- 14. HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Function to calculate days remaining
CREATE OR REPLACE FUNCTION days_until_due(due_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN GREATEST(0, due_date - CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['companies', 'users', 'competitors', 'compliance_requirements', 
                           'team_members', 'partners', 'playbook_lessons', 'documents', 'gate_reviews']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s 
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
  END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════

-- Check all tables were created
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ═══════════════════════════════════════════════════════════════
-- AI GENERATED - REQUIRES HUMAN REVIEW
-- MissionPulse Sprint 0 Database Schema
-- © 2026 Mission Meets Tech
-- ═══════════════════════════════════════════════════════════════
