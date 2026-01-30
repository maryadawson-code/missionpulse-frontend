-- =====================================================
-- MISSIONPULSE SPRINT 17 MIGRATION (MINIMAL)
-- Handles existing schema gracefully
-- Date: January 27, 2026
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TEAM MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID,
    user_id UUID,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'PM',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_internal BOOLEAN DEFAULT true,
    access_level VARCHAR(20) DEFAULT 'standard',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- =====================================================
-- 2. COMPETITORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS competitors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID,
    opportunity_id UUID,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    business_size VARCHAR(50),
    strengths JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    discriminators JSONB DEFAULT '[]',
    ghost_themes JSONB DEFAULT '[]',
    incumbent BOOLEAN DEFAULT false,
    threat_level VARCHAR(20) DEFAULT 'Medium',
    estimated_pwin DECIMAL(5,2),
    is_teaming_partner BOOLEAN DEFAULT false,
    notes TEXT,
    counter_strategy TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. PRICING MODELS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS pricing_models (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID,
    opportunity_id UUID,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'Draft',
    contract_type VARCHAR(50),
    labor_categories JSONB DEFAULT '[]',
    total_direct_labor DECIMAL(15,2) DEFAULT 0,
    total_price DECIMAL(15,2) DEFAULT 0,
    base_period_months INTEGER DEFAULT 12,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. COMPLIANCE REQUIREMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance_requirements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID,
    opportunity_id UUID,
    requirement_id VARCHAR(50),
    section VARCHAR(50) DEFAULT 'L',
    requirement_text TEXT NOT NULL,
    requirement_type VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'Medium',
    response_status VARCHAR(50) DEFAULT 'Not Started',
    assigned_to UUID,
    is_compliant BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. PROPOSAL DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS proposal_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID,
    opportunity_id UUID,
    name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50),
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'Draft',
    file_url TEXT,
    content_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. ACTIVITY LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID,
    user_id UUID,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    opportunity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. AI INTERACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID,
    opportunity_id UUID,
    user_id UUID,
    user_email VARCHAR(255),
    agent_type VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT,
    tokens_input INTEGER,
    tokens_output INTEGER,
    user_rating INTEGER,
    saved_to_playbook BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ENABLE RLS & CREATE OPEN POLICIES
-- =====================================================
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Open policies for development
CREATE POLICY IF NOT EXISTS "open_select" ON team_members FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "open_insert" ON team_members FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "open_update" ON team_members FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "open_select" ON competitors FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "open_insert" ON competitors FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "open_update" ON competitors FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "open_select" ON pricing_models FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "open_insert" ON pricing_models FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "open_update" ON pricing_models FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "open_select" ON compliance_requirements FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "open_insert" ON compliance_requirements FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "open_update" ON compliance_requirements FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "open_select" ON proposal_documents FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "open_insert" ON proposal_documents FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "open_update" ON proposal_documents FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "open_select" ON activity_log FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "open_insert" ON activity_log FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "open_select" ON ai_interactions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "open_insert" ON ai_interactions FOR INSERT WITH CHECK (true);

-- =====================================================
-- SEED DEMO DATA
-- =====================================================

-- Get first opportunity ID
DO $$
DECLARE
    opp_id UUID;
BEGIN
    SELECT id INTO opp_id FROM opportunities LIMIT 1;
    
    -- Insert team members if empty
    IF NOT EXISTS (SELECT 1 FROM team_members LIMIT 1) THEN
        INSERT INTO team_members (email, full_name, title, role) VALUES
            ('mary.womack@mmt.com', 'Mary Womack', 'CEO', 'CEO'),
            ('sarah.chen@mmt.com', 'Sarah Chen', 'Capture Manager', 'CAP'),
            ('mike.johnson@mmt.com', 'Mike Johnson', 'Solutions Architect', 'SA'),
            ('lisa.wong@mmt.com', 'Lisa Wong', 'Pricing Analyst', 'FIN'),
            ('david.smith@mmt.com', 'David Smith', 'Contracts Manager', 'CON'),
            ('jennifer.davis@mmt.com', 'Jennifer Davis', 'Project Manager', 'PM');
    END IF;
    
    -- Insert competitors if empty and we have an opportunity
    IF opp_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM competitors LIMIT 1) THEN
        INSERT INTO competitors (opportunity_id, name, business_size, incumbent, threat_level, strengths, weaknesses) VALUES
            (opp_id, 'Acme Healthcare IT', 'Large', true, 'High', 
                '["Incumbent advantage", "Deep agency relationships"]'::jsonb,
                '["High overhead rates", "Slow to innovate"]'::jsonb),
            (opp_id, 'TechMed Solutions', 'Small', false, 'Medium',
                '["Competitive pricing", "Agile methodology"]'::jsonb,
                '["Limited scale", "No incumbent experience"]'::jsonb),
            (opp_id, 'Federal Health Partners', 'SDVOSB', false, 'Medium',
                '["Set-aside eligible", "Niche expertise"]'::jsonb,
                '["Limited contract vehicles", "Small workforce"]'::jsonb);
    END IF;
    
    -- Insert pricing model if empty
    IF opp_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pricing_models LIMIT 1) THEN
        INSERT INTO pricing_models (opportunity_id, name, contract_type, status, labor_categories, total_price) VALUES
            (opp_id, 'DHA Healthcare Platform Pricing', 'FFP', 'Draft',
                '[{"lcat": "Program Manager", "rate": 185}, {"lcat": "Senior Engineer", "rate": 165}, {"lcat": "Data Scientist", "rate": 175}]'::jsonb,
                3250000.00);
    END IF;
END $$;

-- =====================================================
-- VERIFY
-- =====================================================
SELECT 'Migration complete!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
