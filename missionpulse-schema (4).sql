-- ============================================
-- MISSIONPULSE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- Version: 1.0 - Phase 4 Production
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. COMPANIES (Multi-tenant isolation)
-- ============================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT,
  logo_url TEXT,
  
  -- Business Info
  duns_number TEXT,
  cage_code TEXT,
  sam_uei TEXT,
  naics_codes TEXT[],
  
  -- Certifications (GovCon)
  certifications TEXT[] DEFAULT '{}',
  -- Examples: SDVOSB, WOSB, HUBZone, 8(a), etc.
  
  -- Subscription
  plan TEXT DEFAULT 'starter', -- starter, growth, enterprise
  max_users INTEGER DEFAULT 10,
  max_opportunities INTEGER DEFAULT 25,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. USERS (Linked to Supabase Auth)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  -- Profile
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  title TEXT,
  
  -- RBAC Role (Shipley-aligned)
  role TEXT NOT NULL DEFAULT 'viewer',
  -- Roles: CEO, COO, CAP (Capture Manager), PM (Proposal Manager), 
  --        SA (Solution Architect), FIN (Pricing/Finance), 
  --        CON (Contracts), DEL (Delivery/Staffing), 
  --        QA (Quality), Partner, Admin, viewer
  
  -- Permissions override (for custom access)
  permissions JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  
  -- Preferences
  preferences JSONB DEFAULT '{"theme": "dark", "notifications": true}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. OPPORTUNITIES (Pursuits/Bids)
-- ============================================
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Info
  title TEXT NOT NULL,
  nickname TEXT,
  description TEXT,
  
  -- Government Details
  agency TEXT,
  sub_agency TEXT,
  solicitation_number TEXT,
  notice_id TEXT,
  contract_type TEXT, -- FFP, T&M, CPFF, IDIQ, BPA
  contract_vehicle TEXT, -- GSA MAS, SEWP, CIO-SP3, etc.
  
  -- Financials
  estimated_value DECIMAL(15,2),
  price_to_win DECIMAL(15,2),
  
  -- Dates
  release_date DATE,
  questions_due DATE,
  proposal_due DATE,
  award_date DATE,
  period_of_performance TEXT, -- "5 years (1 base + 4 option)"
  
  -- Shipley Phase
  phase TEXT DEFAULT 'opportunity',
  -- Phases: opportunity, pursuit, proposal, submitted, awarded, lost
  
  -- Scoring
  pwin INTEGER DEFAULT 50, -- 0-100
  fit_score INTEGER DEFAULT 50, -- 0-100
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  
  -- Decision
  go_no_go TEXT DEFAULT 'pending', -- pending, go, no-go
  go_no_go_date DATE,
  go_no_go_rationale TEXT,
  
  -- Win/Loss
  outcome TEXT, -- won, lost, no-bid, cancelled
  outcome_date DATE,
  outcome_notes TEXT,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  
  -- Status
  is_archived BOOLEAN DEFAULT FALSE,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. PROPOSAL SECTIONS
-- ============================================
CREATE TABLE proposal_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Section Info
  volume TEXT DEFAULT 'Technical', -- Technical, Management, Past Performance, Cost/Price
  section_number TEXT NOT NULL, -- L.3.1, M.2.a, etc.
  title TEXT NOT NULL,
  
  -- Content
  content TEXT,
  content_html TEXT,
  word_count INTEGER DEFAULT 0,
  page_count DECIMAL(5,2) DEFAULT 0,
  
  -- Page Limits (from RFP)
  page_limit INTEGER,
  is_over_limit BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT DEFAULT 'not_started',
  -- Statuses: not_started, in_progress, draft, review, final, locked
  
  -- Compliance
  compliance_status TEXT DEFAULT 'pending',
  -- Statuses: pending, partial, compliant, non-compliant
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  reviewer UUID REFERENCES users(id),
  
  -- Dates
  due_date DATE,
  submitted_at TIMESTAMPTZ,
  
  -- Version tracking
  version INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. COMPLIANCE REQUIREMENTS (L/M Matrix)
-- ============================================
CREATE TABLE compliance_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Requirement Info
  requirement_id TEXT NOT NULL, -- L.3.1.a, M.2.1, etc.
  requirement_text TEXT NOT NULL,
  source_section TEXT, -- Section L, Section M, SOW, PWS
  
  -- Classification
  requirement_type TEXT DEFAULT 'shall',
  -- Types: shall, should, may, will
  
  evaluation_factor TEXT, -- Technical Approach, Management, Past Performance, Price
  
  -- Response
  response_location TEXT, -- Where in proposal we address this
  response_summary TEXT,
  
  -- Status
  status TEXT DEFAULT 'not_addressed',
  -- Statuses: not_addressed, partial, addressed, verified
  
  -- Verification
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  
  -- Priority
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. TEAM ASSIGNMENTS
-- ============================================
CREATE TABLE team_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  role TEXT NOT NULL, 
  -- Roles: capture_manager, proposal_manager, volume_lead, section_author, 
  --        reviewer, subject_matter_expert, pricing_lead, contracts_lead
  
  volume TEXT, -- NULL means all volumes
  section_numbers TEXT[], -- Specific sections, NULL means all in volume
  
  permissions TEXT[] DEFAULT '{"read", "write"}', -- read, write, approve, delete
  
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(opportunity_id, user_id, role, volume)
);

-- ============================================
-- 7. CHAT HISTORY
-- ============================================
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  
  -- Agent Info
  agent_name TEXT NOT NULL, -- capture, strategy, blackhat, pricing, compliance, writer, contracts, orals
  
  -- Conversation
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  -- Format: [{role: "user"|"assistant", content: "...", timestamp: "..."}]
  
  -- Context
  context_snapshot JSONB, -- What context was sent to the agent
  
  -- Metrics
  message_count INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  
  -- Status
  is_archived BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. LESSONS LEARNED (Playbook)
-- ============================================
CREATE TABLE lessons_learned (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  
  -- Content
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- win_theme, discriminator, ghost, proof_point, process, technical
  content TEXT NOT NULL,
  
  -- Context
  agency TEXT,
  contract_type TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Quality
  rating INTEGER DEFAULT 5, -- 1-5 stars
  use_count INTEGER DEFAULT 0,
  
  -- Source
  source_type TEXT, -- manual, ai_generated, imported
  source_chat_id UUID REFERENCES chat_history(id),
  
  -- Status
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. AUDIT LOG (CMMC Compliance)
-- ============================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Action Details
  action TEXT NOT NULL, -- create, read, update, delete, export, login, logout
  resource_type TEXT NOT NULL, -- opportunity, section, user, chat, etc.
  resource_id UUID,
  
  -- Context
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. FILE ATTACHMENTS
-- ============================================
CREATE TABLE file_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  section_id UUID REFERENCES proposal_sections(id) ON DELETE CASCADE,
  
  -- File Info
  filename TEXT NOT NULL,
  file_type TEXT, -- pdf, docx, xlsx, png, etc.
  file_size INTEGER, -- bytes
  storage_path TEXT NOT NULL, -- Supabase Storage path
  
  -- Metadata
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Classification
  classification TEXT DEFAULT 'unclassified', -- unclassified, cui, classified
  
  -- Upload Info
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info, success, warning, error, deadline
  
  -- Link
  link_url TEXT,
  link_text TEXT,
  
  -- Related
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. INVITATIONS
-- ============================================
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Invite Details
  email TEXT NOT NULL,
  role TEXT DEFAULT 'viewer',
  
  -- Token for verification
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, accepted, expired, revoked
  
  -- Tracking
  invited_by UUID REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Opportunities
CREATE INDEX idx_opportunities_company ON opportunities(company_id);
CREATE INDEX idx_opportunities_phase ON opportunities(phase);
CREATE INDEX idx_opportunities_due ON opportunities(proposal_due);

-- Proposal Sections
CREATE INDEX idx_sections_opportunity ON proposal_sections(opportunity_id);
CREATE INDEX idx_sections_assigned ON proposal_sections(assigned_to);
CREATE INDEX idx_sections_status ON proposal_sections(status);

-- Compliance
CREATE INDEX idx_compliance_opportunity ON compliance_requirements(opportunity_id);
CREATE INDEX idx_compliance_status ON compliance_requirements(status);

-- Team Assignments
CREATE INDEX idx_assignments_opportunity ON team_assignments(opportunity_id);
CREATE INDEX idx_assignments_user ON team_assignments(user_id);

-- Chat History
CREATE INDEX idx_chat_user ON chat_history(user_id);
CREATE INDEX idx_chat_opportunity ON chat_history(opportunity_id);
CREATE INDEX idx_chat_agent ON chat_history(agent_name);

-- Audit Log
CREATE INDEX idx_audit_company ON audit_log(company_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Invitations
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status);

-- Lessons Learned
CREATE INDEX idx_lessons_company ON lessons_learned(company_id);
CREATE INDEX idx_lessons_category ON lessons_learned(category);
CREATE INDEX idx_lessons_approved ON lessons_learned(is_approved);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

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
  SELECT company_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- COMPANIES POLICIES
-- ============================================
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (id = get_user_company_id());

CREATE POLICY "Admins can update own company" ON companies
  FOR UPDATE USING (
    id = get_user_company_id() AND 
    get_user_role() IN ('Admin', 'CEO')
  );

-- ============================================
-- USERS POLICIES
-- ============================================
CREATE POLICY "Users can view colleagues" ON users
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can update any user in company" ON users
  FOR UPDATE USING (
    company_id = get_user_company_id() AND 
    get_user_role() IN ('Admin', 'CEO')
  );

CREATE POLICY "New users can insert themselves" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================
-- OPPORTUNITIES POLICIES
-- ============================================
CREATE POLICY "Users can view company opportunities" ON opportunities
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can create opportunities" ON opportunities
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update company opportunities" ON opportunities
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "Admins can delete opportunities" ON opportunities
  FOR DELETE USING (
    company_id = get_user_company_id() AND 
    get_user_role() IN ('Admin', 'CEO', 'COO')
  );

-- ============================================
-- PROPOSAL SECTIONS POLICIES
-- ============================================
CREATE POLICY "Users can view company sections" ON proposal_sections
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can create sections" ON proposal_sections
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update sections" ON proposal_sections
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete sections" ON proposal_sections
  FOR DELETE USING (company_id = get_user_company_id());

-- ============================================
-- COMPLIANCE REQUIREMENTS POLICIES
-- ============================================
CREATE POLICY "Users can view company compliance" ON compliance_requirements
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage compliance" ON compliance_requirements
  FOR ALL USING (company_id = get_user_company_id());

-- ============================================
-- TEAM ASSIGNMENTS POLICIES
-- ============================================
CREATE POLICY "Users can view company assignments" ON team_assignments
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage assignments" ON team_assignments
  FOR ALL USING (company_id = get_user_company_id());

-- ============================================
-- CHAT HISTORY POLICIES
-- ============================================
CREATE POLICY "Users can view own chats" ON chat_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create chats" ON chat_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chats" ON chat_history
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- LESSONS LEARNED POLICIES
-- ============================================
CREATE POLICY "Users can view company lessons" ON lessons_learned
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can create lessons" ON lessons_learned
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update company lessons" ON lessons_learned
  FOR UPDATE USING (company_id = get_user_company_id());

-- ============================================
-- AUDIT LOG POLICIES
-- ============================================
CREATE POLICY "Users can view company audit log" ON audit_log
  FOR SELECT USING (
    company_id = get_user_company_id() AND 
    get_user_role() IN ('Admin', 'CEO', 'COO')
  );

CREATE POLICY "System can insert audit log" ON audit_log
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- ============================================
-- FILE ATTACHMENTS POLICIES
-- ============================================
CREATE POLICY "Users can view company files" ON file_attachments
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can upload files" ON file_attachments
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can delete own uploads" ON file_attachments
  FOR DELETE USING (
    company_id = get_user_company_id() AND 
    (uploaded_by = auth.uid() OR get_user_role() IN ('Admin', 'CEO'))
  );

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- ============================================
-- INVITATIONS POLICIES
-- ============================================
CREATE POLICY "Admins can view company invitations" ON invitations
  FOR SELECT USING (
    company_id = get_user_company_id() AND 
    get_user_role() IN ('Admin', 'CEO', 'COO')
  );

CREATE POLICY "Admins can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    company_id = get_user_company_id() AND 
    get_user_role() IN ('Admin', 'CEO', 'COO')
  );

CREATE POLICY "Admins can update invitations" ON invitations
  FOR UPDATE USING (
    company_id = get_user_company_id() AND 
    get_user_role() IN ('Admin', 'CEO', 'COO')
  );

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_sections_updated_at
  BEFORE UPDATE ON proposal_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_compliance_updated_at
  BEFORE UPDATE ON compliance_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_chat_updated_at
  BEFORE UPDATE ON chat_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_lessons_updated_at
  BEFORE UPDATE ON lessons_learned
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SCHEMA COMPLETE
-- ============================================
-- Tables: 12
-- Indexes: 19
-- RLS Policies: 25
-- Triggers: 7
-- Functions: 3
