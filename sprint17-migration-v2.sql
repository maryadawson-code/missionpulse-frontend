-- =====================================================
-- MISSIONPULSE SPRINT 17 MIGRATION (CORRECTED)
-- Run this in Supabase SQL Editor
-- Date: January 27, 2026
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. COMPANIES TABLE (Required first)
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    duns_number VARCHAR(20),
    cage_code VARCHAR(10),
    naics_codes TEXT[],
    business_size VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default company if none exists
INSERT INTO companies (id, name, short_name, business_size)
SELECT 
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Mission Meets Tech',
    'MMT',
    'Small'
WHERE NOT EXISTS (SELECT 1 FROM companies LIMIT 1);

-- =====================================================
-- 2. UPDATE OPPORTUNITIES TABLE (add company_id if missing)
-- =====================================================
DO $$
BEGIN
    -- Add company_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'opportunities' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE opportunities ADD COLUMN company_id UUID;
        
        -- Set default company for existing opportunities
        UPDATE opportunities 
        SET company_id = (SELECT id FROM companies LIMIT 1)
        WHERE company_id IS NULL;
    END IF;
END $$;

-- =====================================================
-- 3. TEAM MEMBERS TABLE
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

CREATE INDEX IF NOT EXISTS idx_team_members_company ON team_members(company_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

-- =====================================================
-- 4. COMPETITORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS competitors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID,
    opportunity_id UUID,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    duns_number VARCHAR(20),
    cage_code VARCHAR(10),
    business_size VARCHAR(50),
    naics_codes TEXT[],
    strengths JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    discriminators JSONB DEFAULT '[]',
    ghost_themes JSONB DEFAULT '[]',
    past_performance JSONB DEFAULT '[]',
    incumbent BOOLEAN DEFAULT false,
    threat_level VARCHAR(20) DEFAULT 'Medium',
    estimated_pwin DECIMAL(5,2),
    is_teaming_partner BOOLEAN DEFAULT false,
    teaming_status VARCHAR(50),
    nda_signed BOOLEAN DEFAULT false,
    ta_signed BOOLEAN DEFAULT false,
    notes TEXT,
    counter_strategy TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_competitors_opportunity ON competitors(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_competitors_company ON competitors(company_id);

-- =====================================================
-- 5. PRICING MODELS TABLE
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
    total_indirect_costs DECIMAL(15,2) DEFAULT 0,
    total_odcs DECIMAL(15,2) DEFAULT 0,
    total_subcontracts DECIMAL(15,2) DEFAULT 0,
    total_travel DECIMAL(15,2) DEFAULT 0,
    total_materials DECIMAL(15,2) DEFAULT 0,
    fee_percentage DECIMAL(5,2) DEFAULT 10.00,
    fee_amount DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    total_price DECIMAL(15,2) DEFAULT 0,
    base_period_months INTEGER DEFAULT 12,
    option_periods JSONB DEFAULT '[]',
    wrap_rates JSONB DEFAULT '{}',
    assumptions JSONB DEFAULT '[]',
    notes TEXT,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_pricing_models_opportunity ON pricing_models(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_pricing_models_company ON pricing_models(company_id);

-- =====================================================
-- 6. COMPLIANCE REQUIREMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance_requirements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID,
    opportunity_id UUID,
    requirement_id VARCHAR(50),
    section VARCHAR(50) NOT NULL DEFAULT 'L',
    requirement_text TEXT NOT NULL,
    requirement_type VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'Medium',
    response_status VARCHAR(50) DEFAULT 'Not Started',
    response_location VARCHAR(255),
    response_text TEXT,
    assigned_to UUID,
    reviewer UUID,
    page_limit INTEGER,
    word_limit INTEGER,
    current_page_count INTEGER,
    current_word_count INTEGER,
    is_compliant BOOLEAN,
    compliance_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_compliance_opportunity ON compliance_requirements(opportunity_id);

-- =====================================================
-- 7. PROPOSAL DOCUMENTS TABLE
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
    file_size INTEGER,
    file_type VARCHAR(50),
    content_text TEXT,
    content_summary TEXT,
    current_reviewer UUID,
    review_due_date TIMESTAMPTZ,
    review_comments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    last_modified_by UUID
);

CREATE INDEX IF NOT EXISTS idx_documents_opportunity ON proposal_documents(opportunity_id);

-- =====================================================
-- 8. ACTIVITY LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID,
    user_id UUID,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    user_role VARCHAR(50),
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    entity_name VARCHAR(255),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    opportunity_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_company ON activity_log(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- =====================================================
-- 9. AI INTERACTIONS TABLE
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
    response_time_ms INTEGER,
    user_rating INTEGER,
    user_feedback TEXT,
    saved_to_playbook BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_company ON ai_interactions(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent ON ai_interactions(agent_type);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE OPEN POLICIES (Development mode)
-- =====================================================
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['companies', 'team_members', 'competitors', 'pricing_models', 'compliance_requirements', 'proposal_documents', 'activity_log', 'ai_interactions'])
    LOOP
        -- Drop existing policies if they exist
        EXECUTE format('DROP POLICY IF EXISTS "Allow all select" ON %I', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow all insert" ON %I', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow all update" ON %I', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow all delete" ON %I', tbl);
        
        -- Create open policies for development
        EXECUTE format('CREATE POLICY "Allow all select" ON %I FOR SELECT USING (true)', tbl);
        EXECUTE format('CREATE POLICY "Allow all insert" ON %I FOR INSERT WITH CHECK (true)', tbl);
        EXECUTE format('CREATE POLICY "Allow all update" ON %I FOR UPDATE USING (true)', tbl);
        EXECUTE format('CREATE POLICY "Allow all delete" ON %I FOR DELETE USING (true)', tbl);
    END LOOP;
END $$;

-- =====================================================
-- SEED DEMO DATA
-- =====================================================
DO $$
DECLARE
    demo_company_id UUID;
    demo_opportunity_id UUID;
BEGIN
    -- Get first company
    SELECT id INTO demo_company_id FROM companies LIMIT 1;
    
    -- Get first opportunity
    SELECT id INTO demo_opportunity_id FROM opportunities LIMIT 1;
    
    IF demo_company_id IS NOT NULL THEN
        -- Insert demo team members (only if table is empty)
        IF NOT EXISTS (SELECT 1 FROM team_members LIMIT 1) THEN
            INSERT INTO team_members (company_id, email, full_name, title, role, is_active) VALUES
                (demo_company_id, 'mary.womack@missionmeetstech.com', 'Mary Womack', 'CEO', 'CEO', true),
                (demo_company_id, 'sarah.chen@missionmeetstech.com', 'Sarah Chen', 'Capture Manager', 'CAP', true),
                (demo_company_id, 'mike.johnson@missionmeetstech.com', 'Mike Johnson', 'Solutions Architect', 'SA', true),
                (demo_company_id, 'lisa.wong@missionmeetstech.com', 'Lisa Wong', 'Pricing Analyst', 'FIN', true),
                (demo_company_id, 'david.smith@missionmeetstech.com', 'David Smith', 'Contracts Manager', 'CON', true),
                (demo_company_id, 'jennifer.davis@missionmeetstech.com', 'Jennifer Davis', 'Project Manager', 'PM', true);
        END IF;
        
        -- Insert demo competitors if we have an opportunity
        IF demo_opportunity_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM competitors LIMIT 1) THEN
            INSERT INTO competitors (company_id, opportunity_id, name, business_size, incumbent, threat_level, strengths, weaknesses) VALUES
                (demo_company_id, demo_opportunity_id, 'Acme Healthcare IT', 'Large', true, 'High', 
                    '["Incumbent advantage", "Deep agency relationships", "Large talent pool"]'::jsonb,
                    '["High overhead rates", "Slow to innovate", "Recent contract performance issues"]'::jsonb),
                (demo_company_id, demo_opportunity_id, 'TechMed Solutions', 'Small', false, 'Medium',
                    '["Competitive pricing", "Agile methodology", "Strong past performance"]'::jsonb,
                    '["Limited scale", "No incumbent experience", "Key personnel availability"]'::jsonb),
                (demo_company_id, demo_opportunity_id, 'Federal Health Partners', 'SDVOSB', false, 'Medium',
                    '["Set-aside eligible", "Niche expertise", "Aggressive pricing"]'::jsonb,
                    '["Limited contract vehicles", "Small workforce", "Narrow experience base"]'::jsonb);
        END IF;
        
        -- Insert demo pricing model
        IF demo_opportunity_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pricing_models LIMIT 1) THEN
            INSERT INTO pricing_models (company_id, opportunity_id, name, contract_type, status, 
                labor_categories, total_direct_labor, total_price, base_period_months) VALUES
                (demo_company_id, demo_opportunity_id, 'DHA Healthcare Platform - Base Pricing', 'FFP', 'Draft',
                    '[
                        {"lcat": "Program Manager", "quantity": 1, "loaded_rate": 185.00},
                        {"lcat": "Senior Software Engineer", "quantity": 3, "loaded_rate": 165.00},
                        {"lcat": "Data Scientist", "quantity": 2, "loaded_rate": 175.00},
                        {"lcat": "Cloud Architect", "quantity": 1, "loaded_rate": 195.00},
                        {"lcat": "QA Engineer", "quantity": 2, "loaded_rate": 125.00}
                    ]'::jsonb,
                    2500000.00, 3250000.00, 12);
        END IF;
    END IF;
END $$;

-- =====================================================
-- VERIFY
-- =====================================================
SELECT 'Migration complete! Tables created:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
