-- ============================================
-- MISSIONPULSE v12 - COMPLETE DATABASE SCHEMA
-- Supabase PostgreSQL + Row Level Security
-- ============================================

-- Enable UUID extension (should already be enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. COMPANIES (Tenants)
-- ============================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  cage_code TEXT,
  duns_number TEXT,
  uei_number TEXT,
  naics_codes TEXT[] DEFAULT '{}',
  set_aside_status TEXT[] DEFAULT '{}', -- SDVOSB, 8(a), HUBZone, WOSB, etc.
  contract_vehicles TEXT[] DEFAULT '{}', -- GSA, OASIS, SEWP, etc.
  logo_url TEXT,
  primary_color TEXT DEFAULT '#00E5FA',
  tagline TEXT,
  win_themes TEXT[] DEFAULT '{}',
  discriminators TEXT[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'starter', -- starter, professional, enterprise
  subscription_status TEXT DEFAULT 'active', -- active, past_due, canceled
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. USERS (linked to Supabase Auth)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'PM', 
  -- Roles: CEO, COO, CAP, PM, SA, FIN, CON, DEL, QA, Partner, Admin
  title TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_company_admin BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB DEFAULT '{"email": true, "in_app": true}',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. OPPORTUNITIES (Pursuits)
-- ============================================
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  agency TEXT,
  sub_agency TEXT,
  solicitation_number TEXT,
  notice_id TEXT, -- SAM.gov notice ID
  
  -- Classification
  naics_code TEXT,
  psc_code TEXT,
  set_aside TEXT,
  place_of_performance TEXT,
  
  -- Contract Details
  contract_type TEXT, -- FFP, T&M, CPFF, CPIF, IDIQ
  contract_vehicle TEXT,
  estimated_value BIGINT, -- in cents
  period_of_performance TEXT,
  
  -- Dates
  posting_date TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ,
  questions_deadline TIMESTAMPTZ,
  submission_deadline TIMESTAMPTZ,
  award_date TIMESTAMPTZ,
  
  -- Shipley Process
  shipley_phase TEXT DEFAULT 'gate1', 
  -- Phases: gate1, blue, kickoff, pink, red, gold, white, submit, awarded, lost
  phase_entry_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Scoring
  pwin INTEGER DEFAULT 50 CHECK (pwin >= 0 AND pwin <= 100),
  priority TEXT DEFAULT 'P-1', -- P-0 (must win), P-1 (strategic), P-2 (opportunistic)
  go_no_go TEXT DEFAULT 'pending', -- pending, go, no-go
  go_no_go_date TIMESTAMPTZ,
  go_no_go_notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'active', -- active, submitted, won, lost, no-bid, canceled
  outcome_notes TEXT,
  actual_award_value BIGINT,
  
  -- Team
  capture_manager_id UUID REFERENCES users(id),
  proposal_manager_id UUID REFERENCES users(id),
  
  -- Strategy
  win_themes TEXT[] DEFAULT '{}',
  discriminators TEXT[] DEFAULT '{}',
  ghost_team JSONB DEFAULT '[]', -- Competitor analysis
  
  -- Compliance
  compliance_score INTEGER DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100),
  section_l_requirements INTEGER DEFAULT 0,
  section_m_criteria INTEGER DEFAULT 0,
  
  -- Metadata
  source TEXT, -- manual, sam_gov, govwin, deltek
  source_url TEXT,
  metadata JSONB DEFAULT '{}',
  
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
  
  -- Section Identity
  volume TEXT NOT NULL, -- I (Tech), II (Mgmt), III (Past Perf), IV (Cost), V (Admin)
  section_number TEXT NOT NULL, -- 1.0, 1.1, 3.2.1, etc.
  title TEXT NOT NULL,
  
  -- Content
  requirement_text TEXT, -- From RFP L section
  evaluation_criteria TEXT, -- From RFP M section
  response_text TEXT, -- Our drafted response
  
  -- Status Tracking
  status TEXT DEFAULT 'not_started', 
  -- Statuses: not_started, outline, drafting, pink_review, red_review, gold_review, final, approved
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  volume_lead_id UUID REFERENCES users(id),
  
  -- Compliance
  compliance_tags TEXT[] DEFAULT '{}', -- FAR clauses, DFARS, etc.
  is_compliant BOOLEAN,
  compliance_notes TEXT,
  
  -- Metrics
  word_count INTEGER DEFAULT 0,
  page_count DECIMAL(5,2) DEFAULT 0,
  page_limit DECIMAL(5,2),
  
  -- AI Assist
  ai_confidence INTEGER CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  ai_suggestions TEXT,
  last_ai_assist TIMESTAMPTZ,
  
  -- Audit
  last_edited_by UUID REFERENCES users(id),
  last_edited_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(opportunity_id, volume, section_number)
);

-- ============================================
-- 5. COMPLIANCE REQUIREMENTS
-- ============================================
CREATE TABLE compliance_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Requirement Identity
  requirement_id TEXT NOT NULL, -- L.1.a, M.3.2, C.4.1
  source_section TEXT NOT NULL, -- L, M, C, etc.
  page_reference TEXT,
  
  -- Content
  requirement_text TEXT NOT NULL,
  evaluation_factor TEXT, -- For M section items
  
  -- Mapping
  response_volume TEXT,
  response_section TEXT,
  proposal_section_id UUID REFERENCES proposal_sections(id),
  
  -- Status
  compliance_status TEXT DEFAULT 'pending', 
  -- Statuses: pending, compliant, non_compliant, partial, not_applicable
  
  -- Risk
  risk_level TEXT DEFAULT 'medium', -- low, medium, high, critical
  risk_notes TEXT,
  
  -- Verification
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  
  notes TEXT,
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
  -- Roles: capture_manager, proposal_manager, volume_lead, section_author, reviewer, subject_matter_expert, pricing_lead, contracts_lead
  
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
-- 8. LESSONS LEARNED / PLAYBOOK
-- ============================================
CREATE TABLE lessons_learned (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  
  -- Classification
  category TEXT NOT NULL, 
  -- Categories: win_theme, discriminator, compliance_tip, pricing_strategy, past_performance, process_improvement, competitor_intel, proposal_language
  
  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  
  -- Context
  agency TEXT,
  contract_type TEXT,
  outcome TEXT, -- win, loss, no_bid
  
  -- Organization
  tags TEXT[] DEFAULT '{}',
  is_starred BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0, -- How many times used in proposals
  
  -- Source
  source_type TEXT, -- manual, ai_generated, imported
  source_section_id UUID REFERENCES proposal_sections(id),
  
  -- Audit
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. AUDIT LOG
-- ============================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Action Details
  action TEXT NOT NULL, -- create, read, update, delete, export, login, logout, invite
  resource_type TEXT NOT NULL, -- opportunity, section, user, company, file, etc.
  resource_id UUID,
  resource_name TEXT,
  
  -- Change Tracking
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  
  -- CUI Tracking
  involves_cui BOOLEAN DEFAULT FALSE,
  cui_category TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. FILE ATTACHMENTS
-- ============================================
CREATE TABLE file_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  section_id UUID REFERENCES proposal_sections(id) ON DELETE SET NULL,
  
  -- File Info
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- pdf, docx, xlsx, etc.
  file_size INTEGER NOT NULL, -- bytes
  mime_type TEXT,
  
  -- Storage
  storage_path TEXT NOT NULL, -- Supabase storage path
  storage_bucket TEXT DEFAULT 'missionpulse-files',
  
  -- Classification
  category TEXT, -- rfp, amendment, draft, attachment, export, reference
  is_cui BOOLEAN DEFAULT FALSE,
  cui_marking TEXT,
  
  -- Metadata
  description TEXT,
  version INTEGER DEFAULT 1,
  
  -- Audit
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification Content
  type TEXT NOT NULL, -- deadline, assignment, mention, review_request, status_change, system
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Link
  link_type TEXT, -- opportunity, section, user
  link_id UUID,
  link_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Delivery
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. INVITATIONS
-- ============================================
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'PM',
  
  invited_by UUID REFERENCES users(id),
  
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  status TEXT DEFAULT 'pending', -- pending, accepted, expired, canceled
  
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_user_id UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Companies
CREATE INDEX idx_companies_domain ON companies(domain);

-- Users
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Opportunities
CREATE INDEX idx_opportunities_company ON opportunities(company_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_phase ON opportunities(shipley_phase);
CREATE INDEX idx_opportunities_deadline ON opportunities(submission_deadline);
CREATE INDEX idx_opportunities_priority ON opportunities(priority);

-- Proposal Sections
CREATE INDEX idx_sections_opportunity ON proposal_sections(opportunity_id);
CREATE INDEX idx_sections_company ON proposal_sections(company_id);
CREATE INDEX idx_sections_assigned ON proposal_sections(assigned_to);
CREATE INDEX idx_sections_status ON proposal_sections(status);

-- Compliance Requirements
CREATE INDEX idx_compliance_opportunity ON compliance_requirements(opportunity_id);
CREATE INDEX idx_compliance_status ON compliance_requirements(compliance_status);

-- Team Assignments
CREATE INDEX idx_assignments_opportunity ON team_assignments(opportunity_id);
CREATE INDEX idx_assignments_user ON team_assignments(user_id);

-- Chat History
CREATE INDEX idx_chat_company ON chat_history(company_id);
CREATE INDEX idx_chat_user ON chat_history(user_id);
CREATE INDEX idx_chat_opportunity ON chat_history(opportunity_id);

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

-- COMPANIES: Users can only see their own company
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (id = get_user_company_id());

CREATE POLICY "Admins can update own company" ON companies
  FOR UPDATE USING (
    id = get_user_company_id() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'Admin' OR role = 'CEO'))
  );

-- USERS: Users can see colleagues in their company
CREATE POLICY "Users can view company colleagues" ON users
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage company users" ON users
  FOR ALL USING (
    company_id = get_user_company_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'Admin' OR role = 'CEO'))
  );

-- OPPORTUNITIES: Company isolation
CREATE POLICY "Users can view company opportunities" ON opportunities
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can create opportunities" ON opportunities
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update company opportunities" ON opportunities
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "Managers can delete opportunities" ON opportunities
  FOR DELETE USING (
    company_id = get_user_company_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('CEO', 'COO', 'CAP', 'Admin'))
  );

-- PROPOSAL SECTIONS: Company isolation
CREATE POLICY "Users can view company sections" ON proposal_sections
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage company sections" ON proposal_sections
  FOR ALL USING (company_id = get_user_company_id());

-- COMPLIANCE REQUIREMENTS: Company isolation
CREATE POLICY "Users can view company compliance" ON compliance_requirements
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage company compliance" ON compliance_requirements
  FOR ALL USING (company_id = get_user_company_id());

-- TEAM ASSIGNMENTS: Company isolation
CREATE POLICY "Users can view company assignments" ON team_assignments
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Managers can manage assignments" ON team_assignments
  FOR ALL USING (
    company_id = get_user_company_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('CEO', 'COO', 'CAP', 'PM', 'Admin'))
  );

-- CHAT HISTORY: User can only see their own chats
CREATE POLICY "Users can view own chats" ON chat_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own chats" ON chat_history
  FOR ALL USING (user_id = auth.uid());

-- LESSONS LEARNED: Company isolation
CREATE POLICY "Users can view company lessons" ON lessons_learned
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage company lessons" ON lessons_learned
  FOR ALL USING (company_id = get_user_company_id());

-- AUDIT LOG: Company isolation, insert only for users
CREATE POLICY "Users can view company audit log" ON audit_log
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "System can insert audit log" ON audit_log
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- FILE ATTACHMENTS: Company isolation
CREATE POLICY "Users can view company files" ON file_attachments
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage company files" ON file_attachments
  FOR ALL USING (company_id = get_user_company_id());

-- NOTIFICATIONS: User can only see their own
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- INVITATIONS: Company admins can manage
CREATE POLICY "Admins can view company invitations" ON invitations
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Admins can manage invitations" ON invitations
  FOR ALL USING (
    company_id = get_user_company_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'Admin' OR role = 'CEO' OR is_company_admin = TRUE))
  );


-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON proposal_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_updated_at BEFORE UPDATE ON compliance_requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_updated_at BEFORE UPDATE ON chat_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons_learned
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- TRIGGER: AUTO-CREATE USER RECORD ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'PM'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================
-- SEED DATA: Test Company & User
-- ============================================

-- Insert test company
INSERT INTO companies (id, name, domain, cage_code, duns_number, uei_number, naics_codes, set_aside_status, contract_vehicles, tagline, win_themes, discriminators)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Mission Meets Tech',
  'missionmeetstech.com',
  '8ABC1',
  '123456789',
  'MISSIONMT001',
  ARRAY['541512', '541519', '541611', '561210'],
  ARRAY['SDVOSB', 'VOSB'],
  ARRAY['GSA IT Schedule 70', 'OASIS SB Pool 1', 'CIO-SP3 SB'],
  'Mission. Technology. Transformation.',
  ARRAY['Proven Federal Healthcare IT Expertise', 'Agile Delivery with CMMI Level 3', 'Veteran-Owned Small Business Commitment', '95% On-Time Delivery Record'],
  ARRAY['MHS GENESIS Implementation Experience', 'VA EHR Modernization Team', 'DoD HealthCare Analytics Platform', 'Real-time Interoperability Engine']
);

-- Insert sample opportunities
INSERT INTO opportunities (company_id, title, agency, solicitation_number, naics_code, set_aside, contract_type, estimated_value, submission_deadline, shipley_phase, pwin, priority, status, win_themes, discriminators)
VALUES 
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'DHA Healthcare Analytics Platform',
  'Defense Health Agency',
  'FA8773-26-R-0042',
  '541512',
  'SDVOSB',
  'FFP',
  1250000000, -- $12.5M in cents
  NOW() + INTERVAL '45 days',
  'pink',
  72,
  'P-0',
  'active',
  ARRAY['Proven MHS GENESIS Experience', 'Real-time Analytics Dashboard'],
  ARRAY['Former DHA PM on Team', 'Existing ATO for Similar System']
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'VA Electronic Health Record Support',
  'Veterans Affairs',
  'VA118-26-Q-0891',
  '541519',
  'SDVOSB',
  'T&M',
  850000000, -- $8.5M
  NOW() + INTERVAL '30 days',
  'red',
  65,
  'P-1',
  'active',
  ARRAY['Cerner Millennium Expertise', 'Veteran-Focused Mission'],
  ARRAY['5 VA References', 'Cleared Staff Available']
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'CMS Data Modernization Initiative',
  'Centers for Medicare & Medicaid Services',
  'CMS-2026-DMI-0023',
  '541611',
  'Small Business',
  'CPFF',
  2100000000, -- $21M
  NOW() + INTERVAL '60 days',
  'blue',
  45,
  'P-1',
  'active',
  ARRAY['Cloud Migration Accelerator', 'Healthcare Data Governance'],
  ARRAY['AWS GovCloud Certified Team', 'HIPAA Compliance Framework']
);


-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;


-- ============================================
-- VERIFICATION QUERIES (run after setup)
-- ============================================

-- Check tables created
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check seed data
-- SELECT * FROM companies;
-- SELECT * FROM opportunities;

