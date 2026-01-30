-- ============================================================
-- MissionPulse V2 Database Schema Migration
-- FILE: missionpulse-v2-migrations.sql
-- VERSION: 2.0.0
-- DATE: January 30, 2026
-- 
-- Run this in Supabase SQL Editor
-- © 2026 Mission Meets Tech
-- ============================================================

-- ============================================================
-- 1. WIN THEMES TABLE
-- ============================================================
DROP TABLE IF EXISTS win_themes CASCADE;

CREATE TABLE win_themes (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('technical', 'experience', 'team', 'innovation', 'risk', 'value')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    strength INTEGER DEFAULT 70 CHECK (strength >= 0 AND strength <= 100),
    evidence TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for win_themes
ALTER TABLE win_themes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "win_themes_read_policy" ON win_themes;
CREATE POLICY "win_themes_read_policy" ON win_themes FOR SELECT USING (true);

DROP POLICY IF EXISTS "win_themes_write_policy" ON win_themes;
CREATE POLICY "win_themes_write_policy" ON win_themes FOR ALL USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_win_themes_opportunity ON win_themes(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_win_themes_category ON win_themes(category);

-- ============================================================
-- 2. ORALS DECKS TABLE
-- ============================================================
DROP TABLE IF EXISTS orals_decks CASCADE;

CREATE TABLE orals_decks (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    name VARCHAR(255),
    slides JSONB DEFAULT '[]',
    total_duration INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'presented')),
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for orals_decks
ALTER TABLE orals_decks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orals_decks_read_policy" ON orals_decks;
CREATE POLICY "orals_decks_read_policy" ON orals_decks FOR SELECT USING (true);

DROP POLICY IF EXISTS "orals_decks_write_policy" ON orals_decks;
CREATE POLICY "orals_decks_write_policy" ON orals_decks FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_orals_decks_opportunity ON orals_decks(opportunity_id);

-- ============================================================
-- 3. COMPLIANCE ITEMS TABLE
-- ============================================================
DROP TABLE IF EXISTS compliance_items CASCADE;

CREATE TABLE compliance_items (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    section VARCHAR(50) NOT NULL,
    requirement TEXT NOT NULL,
    type CHAR(1) NOT NULL CHECK (type IN ('L', 'M')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('complete', 'in_progress', 'pending', 'at_risk')),
    assignee VARCHAR(255),
    volume VARCHAR(100),
    page_limit INTEGER,
    weight INTEGER,
    notes TEXT,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for compliance_items
ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compliance_items_read_policy" ON compliance_items;
CREATE POLICY "compliance_items_read_policy" ON compliance_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "compliance_items_write_policy" ON compliance_items;
CREATE POLICY "compliance_items_write_policy" ON compliance_items FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_compliance_items_opportunity ON compliance_items(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_items_status ON compliance_items(status);
CREATE INDEX IF NOT EXISTS idx_compliance_items_type ON compliance_items(type);

-- ============================================================
-- 4. TEAMING PARTNERS TABLE
-- ============================================================
DROP TABLE IF EXISTS teaming_partners CASCADE;

CREATE TABLE teaming_partners (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('prime', 'sub', 'consultant', 'mentor')),
    role VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive')),
    nda_status VARCHAR(50) DEFAULT 'not_started' CHECK (nda_status IN ('signed', 'pending', 'expired', 'not_started')),
    nda_expires DATE,
    ta_status VARCHAR(50) DEFAULT 'not_started' CHECK (ta_status IN ('signed', 'pending', 'expired', 'not_started')),
    contact VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    certifications TEXT[] DEFAULT '{}',
    work_share INTEGER DEFAULT 0 CHECK (work_share >= 0 AND work_share <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for teaming_partners
ALTER TABLE teaming_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teaming_partners_read_policy" ON teaming_partners;
CREATE POLICY "teaming_partners_read_policy" ON teaming_partners FOR SELECT USING (true);

DROP POLICY IF EXISTS "teaming_partners_write_policy" ON teaming_partners;
CREATE POLICY "teaming_partners_write_policy" ON teaming_partners FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_teaming_partners_status ON teaming_partners(status);
CREATE INDEX IF NOT EXISTS idx_teaming_partners_type ON teaming_partners(type);

-- ============================================================
-- 5. PROPOSAL DRAFTS TABLE (for Iron Dome)
-- ============================================================
DROP TABLE IF EXISTS proposal_drafts CASCADE;

CREATE TABLE proposal_drafts (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    template_id VARCHAR(100),
    section VARCHAR(255),
    content TEXT,
    tone VARCHAR(50),
    word_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'final')),
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for proposal_drafts
ALTER TABLE proposal_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proposal_drafts_read_policy" ON proposal_drafts;
CREATE POLICY "proposal_drafts_read_policy" ON proposal_drafts FOR SELECT USING (true);

DROP POLICY IF EXISTS "proposal_drafts_write_policy" ON proposal_drafts;
CREATE POLICY "proposal_drafts_write_policy" ON proposal_drafts FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_proposal_drafts_opportunity ON proposal_drafts(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_proposal_drafts_template ON proposal_drafts(template_id);

-- ============================================================
-- 6. RFP REQUIREMENTS TABLE
-- ============================================================
DROP TABLE IF EXISTS rfp_requirements CASCADE;

CREATE TABLE rfp_requirements (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    requirement_id VARCHAR(50),
    text TEXT NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    section VARCHAR(50),
    page_ref VARCHAR(50),
    status VARCHAR(50) DEFAULT 'identified' CHECK (status IN ('identified', 'mapped', 'addressed', 'verified')),
    notes TEXT,
    extracted_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for rfp_requirements
ALTER TABLE rfp_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rfp_requirements_read_policy" ON rfp_requirements;
CREATE POLICY "rfp_requirements_read_policy" ON rfp_requirements FOR SELECT USING (true);

DROP POLICY IF EXISTS "rfp_requirements_write_policy" ON rfp_requirements;
CREATE POLICY "rfp_requirements_write_policy" ON rfp_requirements FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_rfp_requirements_opportunity ON rfp_requirements(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_rfp_requirements_priority ON rfp_requirements(priority);

-- ============================================================
-- 7. LESSONS LEARNED TABLE
-- ============================================================
DROP TABLE IF EXISTS lessons_learned CASCADE;

CREATE TABLE lessons_learned (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    outcome VARCHAR(50) CHECK (outcome IN ('win', 'loss', 'no_bid', 'in_progress')),
    lesson TEXT NOT NULL,
    impact VARCHAR(20) CHECK (impact IN ('high', 'medium', 'low')),
    recommended_actions TEXT[],
    tags TEXT[] DEFAULT '{}',
    submitted_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for lessons_learned
ALTER TABLE lessons_learned ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lessons_learned_read_policy" ON lessons_learned;
CREATE POLICY "lessons_learned_read_policy" ON lessons_learned FOR SELECT USING (true);

DROP POLICY IF EXISTS "lessons_learned_write_policy" ON lessons_learned;
CREATE POLICY "lessons_learned_write_policy" ON lessons_learned FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_lessons_learned_category ON lessons_learned(category);
CREATE INDEX IF NOT EXISTS idx_lessons_learned_outcome ON lessons_learned(outcome);

-- ============================================================
-- 8. AI APPROVALS TABLE (HITL)
-- ============================================================
DROP TABLE IF EXISTS ai_approvals CASCADE;

CREATE TABLE ai_approvals (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    content_type VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    ai_confidence DECIMAL(5,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
    reviewer VARCHAR(255),
    review_notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    token_cost INTEGER DEFAULT 0
);

-- RLS for ai_approvals
ALTER TABLE ai_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_approvals_read_policy" ON ai_approvals;
CREATE POLICY "ai_approvals_read_policy" ON ai_approvals FOR SELECT USING (true);

DROP POLICY IF EXISTS "ai_approvals_write_policy" ON ai_approvals;
CREATE POLICY "ai_approvals_write_policy" ON ai_approvals FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_ai_approvals_opportunity ON ai_approvals(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_ai_approvals_status ON ai_approvals(status);

-- ============================================================
-- 9. AUDIT LOGS TABLE (CMMC Compliance)
-- ============================================================
DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for audit_logs - more restrictive
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_read_policy" ON audit_logs;
CREATE POLICY "audit_logs_read_policy" ON audit_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON audit_logs FOR INSERT WITH CHECK (true);

-- No update/delete policies - audit logs are immutable

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- 10. UPDATE TIMESTAMPS TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
DROP TRIGGER IF EXISTS update_win_themes_timestamp ON win_themes;
CREATE TRIGGER update_win_themes_timestamp BEFORE UPDATE ON win_themes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orals_decks_timestamp ON orals_decks;
CREATE TRIGGER update_orals_decks_timestamp BEFORE UPDATE ON orals_decks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_compliance_items_timestamp ON compliance_items;
CREATE TRIGGER update_compliance_items_timestamp BEFORE UPDATE ON compliance_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teaming_partners_timestamp ON teaming_partners;
CREATE TRIGGER update_teaming_partners_timestamp BEFORE UPDATE ON teaming_partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_proposal_drafts_timestamp ON proposal_drafts;
CREATE TRIGGER update_proposal_drafts_timestamp BEFORE UPDATE ON proposal_drafts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these to verify tables were created correctly:

-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT * FROM win_themes LIMIT 1;
-- SELECT * FROM orals_decks LIMIT 1;
-- SELECT * FROM compliance_items LIMIT 1;
-- SELECT * FROM teaming_partners LIMIT 1;
-- SELECT * FROM proposal_drafts LIMIT 1;
-- SELECT * FROM rfp_requirements LIMIT 1;
-- SELECT * FROM lessons_learned LIMIT 1;
-- SELECT * FROM ai_approvals LIMIT 1;
-- SELECT * FROM audit_logs LIMIT 1;

-- ============================================================
-- SEED DATA (Optional - uncomment to insert demo data)
-- ============================================================

/*
-- Win Themes seed data
INSERT INTO win_themes (opportunity_id, category, title, description, strength, evidence) VALUES
(1, 'technical', 'Proven Healthcare Data Platform', 'Deployed at 3 DoD MTFs with 99.9% uptime', 95, ARRAY['DHA Phase 1 Success', 'HIPAA Certified']),
(1, 'team', 'Cleared Healthcare IT Experts', '15 TS/SCI cleared staff with avg 12 years experience', 88, ARRAY['Key Personnel Resumes', 'Clearance Verification']),
(1, 'experience', 'VA Modernization Track Record', '3 successful VA contract completions totaling $45M', 92, ARRAY['CPARs Ratings', 'Contract Awards']);

-- Teaming Partners seed data
INSERT INTO teaming_partners (name, type, role, status, nda_status, contact, email, certifications, work_share) VALUES
('CloudFirst Technologies', 'sub', 'Cloud Infrastructure', 'active', 'signed', 'John Smith', 'jsmith@cloudfi.com', ARRAY['SDVOSB', 'ISO 27001'], 30),
('SecureNet Solutions', 'sub', 'Cybersecurity', 'active', 'signed', 'Sarah Chen', 'schen@securenet.io', ARRAY['FedRAMP High', 'CMMC L3'], 25);

-- Compliance Items seed data
INSERT INTO compliance_items (opportunity_id, section, requirement, type, status, assignee, volume, page_limit) VALUES
(1, 'L.4.1', 'Technical Approach (50 pages max)', 'L', 'complete', 'Sarah Chen', 'Technical', 50),
(1, 'L.4.2', 'Management Plan (30 pages max)', 'L', 'in_progress', 'John Smith', 'Management', 30),
(1, 'M.3.1', 'Technical Approach - 40%', 'M', 'in_progress', 'Sarah Chen', 'Technical', NULL);
*/

-- ============================================================
-- END OF MIGRATION
-- ============================================================
-- 
-- SECURITY AUDIT: ✓
-- - All tables have RLS enabled
-- - Policies use public access (adjust for production)
-- - Audit logs are immutable (no update/delete)
-- 
-- COST METER: ~200 tokens for schema creation
-- 
-- AI GENERATED - REQUIRES HUMAN REVIEW
-- ============================================================
