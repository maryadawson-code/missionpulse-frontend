-- ============================================================
-- MISSIONPULSE v12.0 - COMPLETE DATABASE SCHEMA
-- Supabase PostgreSQL Database
-- 
-- Run this in Supabase SQL Editor to create all tables
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- COMPANIES TABLE
-- Multi-tenant company data
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  logo_url TEXT,
  cage_code VARCHAR(10),
  duns_number VARCHAR(15),
  naics_codes TEXT[], -- Array of NAICS codes
  set_aside_status TEXT[], -- SDVOSB, WOSB, 8(a), HUBZone, etc.
  gsa_schedule VARCHAR(50),
  cms_certification BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS TABLE  
-- Linked to Supabase Auth (auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'Member', -- CEO, COO, CAP, PM, SA, FIN, CON, DEL, QA, Partner, Admin
  phone VARCHAR(20),
  title VARCHAR(100),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- OPPORTUNITIES TABLE
-- Main proposal/opportunity tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Basic Info
  title VARCHAR(500) NOT NULL,
  description TEXT,
  agency VARCHAR(255),
  solicitation_number VARCHAR(100),
  
  -- Contract Details
  contract_value DECIMAL(15, 2),
  contract_type VARCHAR(50), -- FFP, T&M, CPFF, CPIF, IDIQ, BPA
  naics_code VARCHAR(10),
  set_aside VARCHAR(50),
  pop_location VARCHAR(255), -- Place of Performance
  pop_duration VARCHAR(100), -- Period of Performance duration
  
  -- Timeline
  rfp_release_date DATE,
  questions_due_date DATE,
  submission_deadline TIMESTAMPTZ,
  award_date DATE,
  
  -- Status
  shipley_phase VARCHAR(50) DEFAULT 'capture', -- capture, qualify, proposal, review, submit, award
  pwin INTEGER DEFAULT 50 CHECK (pwin >= 0 AND pwin <= 100),
  priority VARCHAR(20) DEFAULT 'medium', -- high, medium, low
  status VARCHAR(50) DEFAULT 'active', -- active, paused, won, lost, cancelled, no-bid
  completion_percent INTEGER DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
  
  -- Win Themes & Strategy
  win_themes JSONB DEFAULT '[]',
  discriminators JSONB DEFAULT '[]',
  ghost_themes JSONB DEFAULT '[]', -- Competitor weaknesses
  
  -- Teaming
  prime_contractor VARCHAR(255),
  teaming_partners JSONB DEFAULT '[]',
  
  -- Metadata
  source VARCHAR(100), -- GovWin, SAM.gov, Manual, etc.
  source_id VARCHAR(100), -- External system ID
  tags TEXT[],
  notes TEXT,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROPOSAL SECTIONS TABLE
-- Track individual sections of a proposal (L, M, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS proposal_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  section_number VARCHAR(50), -- L.1.2, M.3, etc.
  title VARCHAR(255) NOT NULL,
  volume VARCHAR(50), -- Technical, Management, Past Performance, Price
  
  page_limit INTEGER,
  current_pages INTEGER DEFAULT 0,
  word_limit INTEGER,
  current_words INTEGER DEFAULT 0,
  
  assigned_to UUID REFERENCES users(id),
  reviewer UUID REFERENCES users(id),
  
  status VARCHAR(50) DEFAULT 'not_started', -- not_started, drafting, review, revision, complete
  due_date DATE,
  completion_percent INTEGER DEFAULT 0,
  
  content TEXT,
  compliance_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMPLIANCE REQUIREMENTS TABLE
-- Track RFP requirements for compliance matrix
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  requirement_id VARCHAR(100), -- L.3.2.1, M.2.a, etc.
  requirement_text TEXT NOT NULL,
  source_section VARCHAR(100), -- Where in RFP
  
  category VARCHAR(100), -- Technical, Management, Staffing, Past Performance
  criticality VARCHAR(20) DEFAULT 'shall', -- shall, should, may
  
  response_section VARCHAR(100), -- Where we address it
  response_status VARCHAR(50) DEFAULT 'pending', -- pending, addressed, verified, gap
  response_notes TEXT,
  
  assigned_to UUID REFERENCES users(id),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TEAM ASSIGNMENTS TABLE
-- Track who is assigned to what opportunity/role
-- ============================================================
CREATE TABLE IF NOT EXISTS team_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  role VARCHAR(50) NOT NULL, -- Capture Manager, Volume Lead, Writer, Reviewer, etc.
  responsibilities TEXT,
  hours_allocated INTEGER,
  start_date DATE,
  end_date DATE,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(opportunity_id, user_id, role)
);

-- ============================================================
-- CHAT HISTORY TABLE
-- Store AI assistant conversations
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  agent_type VARCHAR(50) NOT NULL, -- strategy, sme, blackhat, compliance, etc.
  
  role VARCHAR(20) NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,
  
  metadata JSONB DEFAULT '{}', -- tokens, model, etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LESSONS LEARNED TABLE
-- Playbook of successful patterns
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons_learned (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  
  category VARCHAR(100) NOT NULL, -- win_theme, ghost, compliance, pricing, etc.
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  outcome VARCHAR(50), -- win, loss, learning
  agency VARCHAR(255),
  contract_type VARCHAR(50),
  
  tags TEXT[],
  quality_score INTEGER DEFAULT 3 CHECK (quality_score >= 1 AND quality_score <= 5),
  use_count INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  is_approved BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG TABLE
-- Track all significant actions
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  action VARCHAR(100) NOT NULL, -- create, update, delete, login, export, etc.
  entity_type VARCHAR(100), -- opportunity, user, section, etc.
  entity_id UUID,
  
  old_values JSONB,
  new_values JSONB,
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FILE ATTACHMENTS TABLE
-- Track uploaded documents
-- ============================================================
CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  section_id UUID REFERENCES proposal_sections(id) ON DELETE SET NULL,
  
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  
  category VARCHAR(50), -- rfp, response, reference, image, etc.
  description TEXT,
  
  uploaded_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- User notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL, -- deadline, assignment, review, mention, system
  title VARCHAR(255) NOT NULL,
  message TEXT,
  
  link_url TEXT,
  link_entity_type VARCHAR(50),
  link_entity_id UUID,
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVITATIONS TABLE
-- Track pending user invites
-- ============================================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Member',
  
  invited_by UUID REFERENCES users(id),
  
  token VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired, cancelled
  
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- Performance optimization
-- ============================================================

-- Companies
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_company ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_phase ON opportunities(shipley_phase);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(submission_deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_priority ON opportunities(priority);

-- Proposal Sections
CREATE INDEX IF NOT EXISTS idx_sections_opportunity ON proposal_sections(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sections_assigned ON proposal_sections(assigned_to);

-- Compliance Requirements
CREATE INDEX IF NOT EXISTS idx_compliance_opportunity ON compliance_requirements(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_requirements(response_status);

-- Team Assignments
CREATE INDEX IF NOT EXISTS idx_assignments_opportunity ON team_assignments(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON team_assignments(user_id);

-- Chat History
CREATE INDEX IF NOT EXISTS idx_chat_opportunity ON chat_history(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_history(created_at DESC);

-- Lessons Learned
CREATE INDEX IF NOT EXISTS idx_lessons_company ON lessons_learned(company_id);
CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons_learned(category);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-tenant data isolation
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons_learned ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Companies: Users can only see their own company
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (id = get_user_company_id());

CREATE POLICY "Admins can update own company" ON companies
  FOR UPDATE USING (id = get_user_company_id());

-- Users: Users can see colleagues in same company
CREATE POLICY "Users can view company users" ON users
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage users" ON users
  FOR ALL USING (
    company_id = get_user_company_id() 
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'CEO', 'COO')
    )
  );

-- Opportunities: Company-scoped access
CREATE POLICY "Users can view company opportunities" ON opportunities
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can create opportunities" ON opportunities
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update company opportunities" ON opportunities
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "Admins can delete opportunities" ON opportunities
  FOR DELETE USING (
    company_id = get_user_company_id()
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'CEO', 'COO', 'CAP')
    )
  );

-- Apply similar policies to other tables...
CREATE POLICY "Company scoped access" ON proposal_sections
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company scoped access" ON compliance_requirements
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company scoped access" ON team_assignments
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company scoped access" ON chat_history
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company scoped access" ON lessons_learned
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company scoped access" ON audit_log
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Company scoped access" ON file_attachments
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "User notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Company scoped access" ON invitations
  FOR ALL USING (company_id = get_user_company_id());

-- ============================================================
-- TRIGGERS
-- Auto-update timestamps
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON proposal_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_compliance_updated_at BEFORE UPDATE ON compliance_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON team_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons_learned
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VIEWS
-- Commonly used queries
-- ============================================================

-- Active opportunities summary
CREATE OR REPLACE VIEW opportunity_summary AS
SELECT 
  o.id,
  o.title,
  o.agency,
  o.solicitation_number,
  o.contract_value,
  o.shipley_phase,
  o.pwin,
  o.priority,
  o.status,
  o.completion_percent,
  o.submission_deadline,
  EXTRACT(DAY FROM o.submission_deadline - NOW()) as days_until_deadline,
  o.company_id,
  c.name as company_name,
  COUNT(DISTINCT ta.user_id) as team_size,
  COUNT(DISTINCT ps.id) as section_count
FROM opportunities o
JOIN companies c ON o.company_id = c.id
LEFT JOIN team_assignments ta ON o.id = ta.opportunity_id AND ta.is_active = TRUE
LEFT JOIN proposal_sections ps ON o.id = ps.opportunity_id
WHERE o.status = 'active'
GROUP BY o.id, c.name;

-- User workload view
CREATE OR REPLACE VIEW user_workload AS
SELECT 
  u.id as user_id,
  u.full_name,
  u.role,
  u.company_id,
  COUNT(DISTINCT ta.opportunity_id) as active_opportunities,
  COUNT(DISTINCT ps.id) as assigned_sections,
  SUM(ta.hours_allocated) as total_hours_allocated
FROM users u
LEFT JOIN team_assignments ta ON u.id = ta.user_id AND ta.is_active = TRUE
LEFT JOIN opportunities o ON ta.opportunity_id = o.id AND o.status = 'active'
LEFT JOIN proposal_sections ps ON u.id = ps.assigned_to
WHERE u.is_active = TRUE
GROUP BY u.id;

-- ============================================================
-- COMPLETE!
-- ============================================================
-- Run the seed-data.sql file next to populate sample data
-- ============================================================
