-- ============================================================
-- MissionPulse Complete Database Schema
-- FILE: missionpulse-v3-complete-migrations.sql
-- DATE: January 30, 2026
-- RUN: Supabase Dashboard > SQL Editor > Paste & Execute
-- ============================================================

-- ============================================================
-- CORE TABLES
-- ============================================================

-- 1. OPPORTUNITIES (Pipeline)
DROP TABLE IF EXISTS opportunities CASCADE;
CREATE TABLE opportunities (
    id BIGSERIAL PRIMARY KEY,
    nickname VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    agency VARCHAR(50),
    ceiling NUMERIC(15,2) DEFAULT 0,
    phase VARCHAR(50) DEFAULT 'Qualify',
    pwin INTEGER DEFAULT 50 CHECK (pwin >= 0 AND pwin <= 100),
    days_to_due INTEGER DEFAULT 90,
    priority VARCHAR(10) DEFAULT 'P-2',
    naics VARCHAR(10),
    contract_type VARCHAR(50),
    set_aside VARCHAR(50),
    sam_url TEXT,
    incumbent VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT valid_phase CHECK (phase IN ('Qualify','Capture','Blue Team','Pink Team','Red Team','Gold Team','White Glove','Submit','Awarded','Lost'))
);

-- 2. TEAM ASSIGNMENTS
DROP TABLE IF EXISTS team_assignments CASCADE;
CREATE TABLE team_assignments (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by VARCHAR(255),
    CONSTRAINT valid_role CHECK (role IN ('CEO','COO','CAP','PM','SA','FIN','CON','DEL','QA','Partner','Admin'))
);

-- 3. COMPLIANCE ITEMS (L/M Matrix)
DROP TABLE IF EXISTS compliance_items CASCADE;
CREATE TABLE compliance_items (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    req_id VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    section VARCHAR(50),
    type CHAR(1) CHECK (type IN ('L','M')),
    status VARCHAR(20) DEFAULT 'pending',
    owner VARCHAR(100),
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('pending','in_progress','complete','blocked'))
);

-- 4. CONTRACT CLAUSES (FAR/DFARS)
DROP TABLE IF EXISTS contract_clauses CASCADE;
CREATE TABLE contract_clauses (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    clause_number VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    category VARCHAR(50),
    risk_level VARCHAR(20) DEFAULT 'LOW',
    compliance_status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_risk CHECK (risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL'))
);

-- 5. COMPETITORS (Black Hat)
DROP TABLE IF EXISTS competitors CASCADE;
CREATE TABLE competitors (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    strengths TEXT,
    weaknesses TEXT,
    threat VARCHAR(20) DEFAULT 'MEDIUM',
    incumbent BOOLEAN DEFAULT FALSE,
    estimated_price NUMERIC(15,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_threat CHECK (threat IN ('LOW','MEDIUM','HIGH','CRITICAL'))
);

-- 6. PRICING ITEMS (BOE)
DROP TABLE IF EXISTS pricing_items CASCADE;
CREATE TABLE pricing_items (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    lcat VARCHAR(100) NOT NULL,
    rate NUMERIC(10,2) NOT NULL,
    hours INTEGER NOT NULL DEFAULT 0,
    wrap NUMERIC(4,2) DEFAULT 1.85,
    total NUMERIC(15,2) GENERATED ALWAYS AS (rate * hours * wrap) STORED,
    period VARCHAR(20) DEFAULT 'Base',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI APPROVALS (HITL Queue)
DROP TABLE IF EXISTS ai_approvals CASCADE;
CREATE TABLE ai_approvals (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    agent VARCHAR(50) NOT NULL,
    content TEXT,
    confidence INTEGER DEFAULT 75,
    status VARCHAR(20) DEFAULT 'pending',
    reviewer VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_agent CHECK (agent IN ('Capture','Strategy','Writer','Compliance','Pricing','Contracts','Orals','BlackHat')),
    CONSTRAINT valid_approval_status CHECK (status IN ('pending','review','approved','rejected','revised'))
);

-- 8. ORALS DECKS
DROP TABLE IF EXISTS orals_decks CASCADE;
CREATE TABLE orals_decks (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    slide_number INTEGER NOT NULL,
    slide_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    speaker_notes TEXT,
    duration_seconds INTEGER DEFAULT 120,
    presenter VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PLAYBOOK ITEMS (Golden Examples)
DROP TABLE IF EXISTS playbook_items CASCADE;
CREATE TABLE playbook_items (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    score INTEGER DEFAULT 80,
    uses INTEGER DEFAULT 0,
    source_opp VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- 10. PARTNER ACCESS (Frenemy Protocol)
DROP TABLE IF EXISTS partner_access CASCADE;
CREATE TABLE partner_access (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    partner_name VARCHAR(200) NOT NULL,
    partner_email VARCHAR(255) NOT NULL,
    access_level VARCHAR(20) DEFAULT 'limited',
    modules TEXT[],
    nda_signed BOOLEAN DEFAULT FALSE,
    nda_expiry DATE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by VARCHAR(255),
    revoked_at TIMESTAMPTZ,
    auto_revoke_on_submit BOOLEAN DEFAULT TRUE,
    CONSTRAINT valid_access CHECK (access_level IN ('none','limited','standard','full'))
);

-- 11. LAUNCH CHECKLISTS
DROP TABLE IF EXISTS launch_checklists CASCADE;
CREATE TABLE launch_checklists (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    item VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    owner VARCHAR(100),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    CONSTRAINT valid_checklist_status CHECK (status IN ('pending','in_progress','complete','blocked','na'))
);

-- 12. POST AWARD ACTIONS
DROP TABLE IF EXISTS post_award_actions CASCADE;
CREATE TABLE post_award_actions (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    action VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    owner VARCHAR(100),
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    notes TEXT,
    CONSTRAINT valid_action_status CHECK (status IN ('pending','in_progress','complete','blocked'))
);

-- 13. AUDIT LOGS (CMMC Compliance)
DROP TABLE IF EXISTS audit_logs CASCADE;
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50),
    user_email VARCHAR(255) NOT NULL,
    user_role VARCHAR(20),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    opportunity_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. RFP REQUIREMENTS (Shredder Output)
DROP TABLE IF EXISTS rfp_requirements CASCADE;
CREATE TABLE rfp_requirements (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    req_number VARCHAR(50),
    text TEXT NOT NULL,
    section VARCHAR(50),
    volume VARCHAR(50),
    req_type VARCHAR(20),
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    assigned_to VARCHAR(100),
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_req_type CHECK (req_type IN ('SHALL','SHOULD','MAY','WILL')),
    CONSTRAINT valid_req_status CHECK (status IN ('new','mapped','addressed','verified'))
);

-- 15. LESSONS LEARNED
DROP TABLE IF EXISTS lessons_learned CASCADE;
CREATE TABLE lessons_learned (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    lesson TEXT NOT NULL,
    impact VARCHAR(20),
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255),
    CONSTRAINT valid_impact CHECK (impact IN ('positive','negative','neutral'))
);

-- 16. WIN THEMES (Discriminators)
DROP TABLE IF EXISTS win_themes CASCADE;
CREATE TABLE win_themes (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    theme VARCHAR(200) NOT NULL,
    description TEXT,
    evidence TEXT,
    strength INTEGER DEFAULT 50,
    category VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. TEAMING PARTNERS
DROP TABLE IF EXISTS teaming_partners CASCADE;
CREATE TABLE teaming_partners (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(200),
    contact_email VARCHAR(255),
    role VARCHAR(50),
    set_aside VARCHAR(50),
    teaming_type VARCHAR(20) DEFAULT 'sub',
    nda_status VARCHAR(20) DEFAULT 'pending',
    ta_status VARCHAR(20) DEFAULT 'pending',
    workshare_percent INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_teaming_type CHECK (teaming_type IN ('prime','sub','jv','mentor_protege')),
    CONSTRAINT valid_nda_status CHECK (nda_status IN ('pending','sent','signed','expired')),
    CONSTRAINT valid_ta_status CHECK (ta_status IN ('pending','draft','signed','expired'))
);

-- 18. PROPOSAL DRAFTS (Iron Dome Content)
DROP TABLE IF EXISTS proposal_drafts CASCADE;
CREATE TABLE proposal_drafts (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    section VARCHAR(50) NOT NULL,
    version INTEGER DEFAULT 1,
    title VARCHAR(200),
    content TEXT NOT NULL,
    word_count INTEGER,
    compliance_score INTEGER,
    status VARCHAR(20) DEFAULT 'draft',
    author VARCHAR(100),
    reviewer VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_draft_status CHECK (status IN ('draft','review','approved','final'))
);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE orals_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_award_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons_learned ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaming_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_drafts ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for anon during development)
CREATE POLICY "mp_opportunities_all" ON opportunities FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_team_all" ON team_assignments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_compliance_all" ON compliance_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_clauses_all" ON contract_clauses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_competitors_all" ON competitors FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_pricing_all" ON pricing_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_approvals_all" ON ai_approvals FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_orals_all" ON orals_decks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_playbook_all" ON playbook_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_partner_all" ON partner_access FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_launch_all" ON launch_checklists FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_postaward_all" ON post_award_actions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_audit_all" ON audit_logs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_rfp_all" ON rfp_requirements FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_lessons_all" ON lessons_learned FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_themes_all" ON win_themes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_teaming_all" ON teaming_partners FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mp_drafts_all" ON proposal_drafts FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA (Demo Opportunities)
-- ============================================================

INSERT INTO opportunities (nickname, title, agency, ceiling, phase, pwin, days_to_due, priority, naics) VALUES
('DHA EHR Mod', 'DHA MHS GENESIS Cloud Migration', 'DHA', 98450210, 'Pink Team', 72, 37, 'P-0', '541512'),
('VA Claims AI', 'VA Enterprise Claims Processing', 'VA', 45000000, 'Blue Team', 58, 82, 'P-1', '541511'),
('CMS Analytics', 'CMS Data Analytics Platform', 'CMS', 125000000, 'Red Team', 68, 21, 'P-0', '541519'),
('IHS Telehealth', 'IHS Telehealth Expansion', 'IHS', 32000000, 'Capture', 55, 156, 'P-1', '541512');

-- Sample Compliance Items
INSERT INTO compliance_items (opportunity_id, req_id, description, section, type, status, owner) VALUES
(1, 'L.1.1', 'Technical Approach Overview', 'Volume I', 'L', 'complete', 'Sarah C.'),
(1, 'L.1.2', 'Staffing Plan', 'Volume I', 'L', 'in_progress', 'Amanda F.'),
(1, 'M.1.1', 'Past Performance Citations', 'Volume II', 'M', 'pending', 'Lisa M.'),
(1, 'M.2.1', 'Key Personnel Resumes', 'Volume II', 'M', 'in_progress', 'David C.');

-- Sample Competitors
INSERT INTO competitors (opportunity_id, name, strengths, weaknesses, threat, incumbent) VALUES
(1, 'Leidos', 'Incumbent, deep agency relationships', 'Slow innovation cycle', 'HIGH', true),
(1, 'Booz Allen', 'Strong analytics capability', 'Higher rates', 'MEDIUM', false),
(1, 'GDIT', 'Cloud expertise', 'Weak healthcare background', 'LOW', false);

-- Sample Pricing Items
INSERT INTO pricing_items (opportunity_id, lcat, rate, hours, wrap, period) VALUES
(1, 'Program Manager', 185.00, 2080, 1.85, 'Base'),
(1, 'Sr Software Engineer', 165.00, 4160, 1.85, 'Base'),
(1, 'Data Scientist', 155.00, 2080, 1.85, 'Base'),
(1, 'Cloud Architect', 175.00, 1040, 1.85, 'Base');

-- Sample HITL Queue
INSERT INTO ai_approvals (opportunity_id, type, title, agent, confidence, status) VALUES
(1, 'Section Review', 'Executive Summary Draft', 'Writer', 87, 'pending'),
(1, 'Compliance Check', 'FAR 52.212-4 Analysis', 'Compliance', 92, 'pending'),
(1, 'Price Analysis', 'LCAT Rate Validation', 'Pricing', 65, 'review');

-- Sample Win Themes
INSERT INTO win_themes (opportunity_id, theme, description, strength, category) VALUES
(1, 'Innovation Leadership', 'AI-powered automation reduces manual effort by 40%', 85, 'Technical'),
(1, 'Healthcare IT Expertise', '15+ years DHA/VA modernization experience', 90, 'Experience'),
(1, 'Cost Efficiency', 'Proven 20% cost savings through cloud migration', 75, 'Value');

-- Sample Playbook Items
INSERT INTO playbook_items (title, category, content, tags, score, uses) VALUES
('Executive Summary - DHA Win', 'Writing', 'Our team brings unmatched healthcare IT expertise...', ARRAY['executive summary', 'dha', 'healthcare'], 95, 47),
('Technical Innovation Theme', 'Strategy', 'AI-powered solutions that reduce manual effort...', ARRAY['win theme', 'innovation', 'ai'], 92, 38),
('Past Performance Narrative', 'Writing', 'Under Contract XYZ, our team delivered...', ARRAY['past performance', 'narrative'], 88, 52);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_opportunities_phase ON opportunities(phase);
CREATE INDEX idx_opportunities_agency ON opportunities(agency);
CREATE INDEX idx_compliance_opp ON compliance_items(opportunity_id);
CREATE INDEX idx_competitors_opp ON competitors(opportunity_id);
CREATE INDEX idx_pricing_opp ON pricing_items(opportunity_id);
CREATE INDEX idx_approvals_status ON ai_approvals(status);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_playbook_category ON playbook_items(category);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER tr_opportunities_updated BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_compliance_updated BEFORE UPDATE ON compliance_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_competitors_updated BEFORE UPDATE ON competitors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_orals_updated BEFORE UPDATE ON orals_decks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_themes_updated BEFORE UPDATE ON win_themes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_drafts_updated BEFORE UPDATE ON proposal_drafts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Count all tables
SELECT 
    'opportunities' as table_name, COUNT(*) as rows FROM opportunities
UNION ALL SELECT 'compliance_items', COUNT(*) FROM compliance_items
UNION ALL SELECT 'competitors', COUNT(*) FROM competitors
UNION ALL SELECT 'pricing_items', COUNT(*) FROM pricing_items
UNION ALL SELECT 'ai_approvals', COUNT(*) FROM ai_approvals
UNION ALL SELECT 'win_themes', COUNT(*) FROM win_themes
UNION ALL SELECT 'playbook_items', COUNT(*) FROM playbook_items;

-- ============================================================
-- MIGRATION COMPLETE
-- Expected: 18 tables, 4 opportunities, sample data seeded
-- ============================================================
