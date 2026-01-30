-- ═══════════════════════════════════════════════════════════════
-- MISSIONPULSE DATABASE SETUP v2.0
-- Run this ENTIRE script in Supabase SQL Editor
-- 
-- This script will:
-- 1. Create all required tables
-- 2. Add foreign key relationships
-- 3. Insert sample data for demo
-- 4. Create indexes for performance
-- 5. Set up RLS policies (disabled initially)
--
-- © 2026 Mission Meets Tech
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- PART 1: CREATE TABLES
-- ═══════════════════════════════════════════════════════════════

-- 1.1 COMPANIES TABLE (Multi-tenant support)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  logo_url TEXT,
  subscription_tier TEXT DEFAULT 'starter',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 USERS TABLE (11 Shipley Roles)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role_id TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 OPPORTUNITIES TABLE (Core pipeline data)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  agency TEXT,
  contract_value NUMERIC(15,2),
  priority TEXT DEFAULT 'Medium',
  shipley_phase TEXT DEFAULT 'gate_1',
  win_probability INTEGER DEFAULT 50,
  due_date DATE,
  solicitation_number TEXT,
  description TEXT,
  contract_type TEXT,
  set_aside TEXT,
  naics_code TEXT,
  primary_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 COMPETITORS TABLE (Black Hat Analysis)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  threat_level TEXT DEFAULT 'Medium',
  incumbent BOOLEAN DEFAULT false,
  strengths TEXT[],
  weaknesses TEXT[],
  discriminators TEXT[],
  ghost_strategy TEXT,
  intel_source TEXT,
  confidence_score INTEGER DEFAULT 50,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 COMPLIANCE REQUIREMENTS TABLE (Iron Dome)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL,
  section_reference TEXT,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  assigned_to UUID REFERENCES users(id),
  risk_level TEXT DEFAULT 'Medium',
  notes TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 TEAM MEMBERS TABLE (Staffing/Pricing)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  role_title TEXT,
  labor_category TEXT,
  hourly_rate NUMERIC(10,2),
  availability_percent INTEGER DEFAULT 100,
  clearance_level TEXT,
  certifications TEXT[],
  skills TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.7 PARTNERS TABLE (Teaming Arrangements)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  partner_type TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  capabilities TEXT[],
  past_performance TEXT,
  nda_signed BOOLEAN DEFAULT false,
  teaming_agreement BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'potential',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.8 PARTNER OPPORTUNITIES (Junction Table)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  role TEXT,
  work_share_percent INTEGER,
  status TEXT DEFAULT 'proposed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, opportunity_id)
);

-- 1.9 DOCUMENTS TABLE (Vault)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document_type TEXT,
  file_url TEXT,
  file_size INTEGER,
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'draft',
  uploaded_by UUID REFERENCES users(id),
  classification TEXT DEFAULT 'unclassified',
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.10 GATE REVIEWS TABLE (Go/No-Go Decisions)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gate_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  gate_type TEXT NOT NULL,
  review_date TIMESTAMPTZ,
  decision TEXT,
  decision_by UUID REFERENCES users(id),
  attendees UUID[],
  discussion_notes TEXT,
  action_items JSONB DEFAULT '[]',
  risk_assessment JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.11 PLAYBOOK LESSONS TABLE (Lessons Learned)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS playbook_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  outcome TEXT,
  tags TEXT[],
  is_golden_example BOOLEAN DEFAULT false,
  rating INTEGER DEFAULT 3,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- PART 2: CREATE INDEXES
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_opportunities_company ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_phase ON opportunities(shipley_phase);
CREATE INDEX IF NOT EXISTS idx_opportunities_due ON opportunities(due_date);
CREATE INDEX IF NOT EXISTS idx_competitors_opp ON competitors(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_opp ON compliance_requirements(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_requirements(status);
CREATE INDEX IF NOT EXISTS idx_documents_opp ON documents(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_gate_reviews_opp ON gate_reviews(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_playbook_company ON playbook_lessons(company_id);

-- ═══════════════════════════════════════════════════════════════
-- PART 3: INSERT SAMPLE DATA
-- ═══════════════════════════════════════════════════════════════

-- 3.1 Company
-- ─────────────────────────────────────────────────────────────────
INSERT INTO companies (id, name, domain, subscription_tier, settings) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Mission Meets Tech', 'missionmeetstech.com', 'enterprise', 
   '{"features": ["ai_agents", "competitive_intel", "pricing_engine", "compliance_tracker"]}'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

-- 3.2 Users (11 Shipley Roles)
-- ─────────────────────────────────────────────────────────────────
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
ON CONFLICT (email) DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  role_id = EXCLUDED.role_id;

-- 3.3 Opportunities (Demo Pipeline ~$713M)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO opportunities (id, company_id, name, agency, contract_value, priority, shipley_phase, win_probability, due_date, solicitation_number, contract_type, set_aside, naics_code) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 
   'DHA EHR Modernization', 'Defense Health Agency', 245000000, 'Critical', 'pink_team', 72, '2026-03-15', 
   'HT0011-26-R-0042', 'IDIQ', 'SDVOSB', '541512'),
  
  ('aaaa2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'VA Claims Processing AI', 'Veterans Affairs', 89000000, 'High', 'blue_team', 65, '2026-04-30',
   'VA119-26-R-0156', 'FFP', 'Small Business', '541511'),
   
  ('aaaa3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
   'CMS Fraud Detection Platform', 'Centers for Medicare & Medicaid', 156000000, 'High', 'gate_1', 45, '2026-06-15',
   'CMS-HHS-26-R-0089', 'T&M', 'Unrestricted', '541519'),
   
  ('aaaa4444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111',
   'IHS Telehealth Expansion', 'Indian Health Service', 67000000, 'Medium', 'red_team', 78, '2026-02-28',
   'IHS-HHS-26-R-0023', 'CPFF', '8(a)', '541511'),
   
  ('aaaa5555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111',
   'CDC Data Analytics Hub', 'Centers for Disease Control', 112000000, 'High', 'blue_team', 58, '2026-05-20',
   'CDC-HHS-26-R-0112', 'IDIQ', 'HUBZone', '541512'),
   
  ('aaaa6666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111',
   'NIH Research Portal', 'National Institutes of Health', 44000000, 'Medium', 'gold_team', 82, '2026-02-15',
   'NIH-HHS-26-R-0067', 'FFP', 'Woman-Owned', '518210')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  contract_value = EXCLUDED.contract_value,
  shipley_phase = EXCLUDED.shipley_phase,
  win_probability = EXCLUDED.win_probability,
  due_date = EXCLUDED.due_date;

-- 3.4 Competitors (Sample for DHA opportunity)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO competitors (opportunity_id, company_name, threat_level, incumbent, strengths, weaknesses, ghost_strategy) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'Leidos Health', 'High', true,
   ARRAY['Incumbent advantage', 'Deep DHA relationships', 'Large cleared workforce'],
   ARRAY['Proprietary lock-in', 'Recent CPARS issues', 'High overhead rates'],
   'Emphasize our open architecture and 30% cost savings vs incumbent'),
   
  ('aaaa1111-1111-1111-1111-111111111111', 'CACI International', 'Medium', false,
   ARRAY['Strong MHS Genesis experience', 'FedRAMP High certified'],
   ARRAY['No SDVOSB status', 'Limited interoperability solutions'],
   'Highlight our SDVOSB advantage and superior API integration'),
   
  ('aaaa1111-1111-1111-1111-111111111111', 'General Dynamics IT', 'Medium', false,
   ARRAY['Large contract capacity', 'Established DHA presence'],
   ARRAY['Slower innovation cycles', 'Complex corporate structure'],
   'Position as agile partner vs bureaucratic competitor')
ON CONFLICT DO NOTHING;

-- 3.5 Compliance Requirements (Sample)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO compliance_requirements (opportunity_id, requirement_type, section_reference, description, status, risk_level) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'Mandatory', 'L.5.1', 'Organizational Conflict of Interest mitigation plan', 'in_progress', 'High'),
  ('aaaa1111-1111-1111-1111-111111111111', 'Mandatory', 'L.5.2', 'CMMC Level 2 certification documentation', 'completed', 'Critical'),
  ('aaaa1111-1111-1111-1111-111111111111', 'Mandatory', 'L.5.3', 'FedRAMP High authorization evidence', 'pending', 'High'),
  ('aaaa1111-1111-1111-1111-111111111111', 'Evaluation', 'M.2.1', 'Past performance questionnaires (3 minimum)', 'in_progress', 'Medium'),
  ('aaaa1111-1111-1111-1111-111111111111', 'Evaluation', 'M.2.2', 'Key personnel resumes with certifications', 'pending', 'Medium')
ON CONFLICT DO NOTHING;

-- 3.6 Team Members (Sample)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO team_members (company_id, full_name, email, role_title, labor_category, hourly_rate, clearance_level, certifications) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Dr. Sarah Mitchell', 'smitchell@missionmeetstech.com', 
   'Chief Medical Informatics Officer', 'SME III', 285.00, 'Secret', 
   ARRAY['MD', 'CPHIMS', 'PMP']),
  ('11111111-1111-1111-1111-111111111111', 'Marcus Chen', 'mchen@missionmeetstech.com',
   'Senior Solutions Architect', 'Engineer IV', 225.00, 'Top Secret/SCI',
   ARRAY['AWS Solutions Architect Pro', 'TOGAF', 'CISSP']),
  ('11111111-1111-1111-1111-111111111111', 'Jennifer Okonkwo', 'jokonkwo@missionmeetstech.com',
   'Program Manager', 'PM III', 195.00, 'Secret',
   ARRAY['PMP', 'ITIL v4', 'SAFe Agilist'])
ON CONFLICT DO NOTHING;

-- 3.7 Partners (Sample)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO partners (company_id, partner_name, partner_type, contact_name, contact_email, capabilities, status, nda_signed, teaming_agreement) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Cipher Health Analytics', 'Subcontractor',
   'Amanda Torres', 'atorres@cipherhealth.com',
   ARRAY['Healthcare AI/ML', 'Clinical Decision Support', 'Population Health'],
   'active', true, true),
  ('11111111-1111-1111-1111-111111111111', 'SecureCloud Federal', 'Subcontractor',
   'Robert Kim', 'rkim@securecloudfed.com',
   ARRAY['FedRAMP Hosting', 'Cloud Migration', 'DevSecOps'],
   'active', true, true),
  ('11111111-1111-1111-1111-111111111111', 'VetFirst Solutions', 'Mentor-Protégé',
   'Marcus Johnson', 'mjohnson@vetfirst.com',
   ARRAY['SDVOSB Prime', 'Staffing Augmentation', 'Training'],
   'active', true, false)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- PART 4: ENABLE REALTIME (Optional)
-- ═══════════════════════════════════════════════════════════════

-- Enable realtime for opportunities table
ALTER PUBLICATION supabase_realtime ADD TABLE opportunities;

-- ═══════════════════════════════════════════════════════════════
-- PART 5: RLS POLICIES (Disabled for now - enable in production)
-- ═══════════════════════════════════════════════════════════════

-- Uncomment these when ready for production:
/*
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_lessons ENABLE ROW LEVEL SECURITY;

-- Example policies (customize as needed):
CREATE POLICY "Users see own company data" ON opportunities
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE email = auth.email())
  );
*/

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════

-- Run these after setup to verify:
-- SELECT COUNT(*) as company_count FROM companies;
-- SELECT COUNT(*) as user_count FROM users;
-- SELECT COUNT(*) as opp_count, SUM(contract_value) as total_value FROM opportunities;
-- SELECT COUNT(*) as competitor_count FROM competitors;
-- SELECT COUNT(*) as compliance_count FROM compliance_requirements;

-- ═══════════════════════════════════════════════════════════════
-- SETUP COMPLETE
-- ═══════════════════════════════════════════════════════════════
