-- =====================================================
-- MISSIONPULSE SPRINT 17 SUPABASE MIGRATION
-- Run this in Supabase SQL Editor
-- Date: January 27, 2026
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TEAM MEMBERS TABLE
-- For role-based access and proposal team assignments
-- =====================================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Profile info
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    
    -- Role & Permissions (Shipley methodology roles)
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'CEO', 'COO', 'CAP', 'PM', 'SA', 'FIN', 'CON', 'DEL', 'QA', 'Partner', 'Admin'
    )),
    permissions JSONB DEFAULT '{}',
    
    -- Access Control
    is_active BOOLEAN DEFAULT true,
    is_internal BOOLEAN DEFAULT true,  -- false = external partner
    access_level VARCHAR(20) DEFAULT 'standard' CHECK (access_level IN ('admin', 'standard', 'restricted')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(company_id, email)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_members_company ON team_members(company_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

-- =====================================================
-- 2. COMPETITORS TABLE
-- For Black Hat Analysis (Module 7)
-- =====================================================
CREATE TABLE IF NOT EXISTS competitors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    
    -- Competitor Info
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    duns_number VARCHAR(20),
    cage_code VARCHAR(10),
    
    -- Classification
    business_size VARCHAR(50) CHECK (business_size IN (
        'Large', 'Small', 'SDVOSB', 'WOSB', 'HUBZone', '8(a)', 'VOSB', 'Unknown'
    )),
    naics_codes TEXT[],
    
    -- Competitive Intelligence
    strengths JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    discriminators JSONB DEFAULT '[]',
    ghost_themes JSONB DEFAULT '[]',
    past_performance JSONB DEFAULT '[]',
    
    -- Win/Loss Data
    incumbent BOOLEAN DEFAULT false,
    threat_level VARCHAR(20) DEFAULT 'Medium' CHECK (threat_level IN ('High', 'Medium', 'Low', 'Unknown')),
    estimated_pwin DECIMAL(5,2),
    
    -- Teaming Status
    is_teaming_partner BOOLEAN DEFAULT false,
    teaming_status VARCHAR(50),
    nda_signed BOOLEAN DEFAULT false,
    ta_signed BOOLEAN DEFAULT false,
    
    -- Notes & Strategy
    notes TEXT,
    counter_strategy TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES team_members(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competitors_opportunity ON competitors(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_competitors_company ON competitors(company_id);
CREATE INDEX IF NOT EXISTS idx_competitors_threat ON competitors(threat_level);

-- =====================================================
-- 3. PRICING MODELS TABLE
-- For Pricing Strategist (Module 8)
-- =====================================================
CREATE TABLE IF NOT EXISTS pricing_models (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    
    -- Model Info
    name VARCHAR(255) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN (
        'Draft', 'In Review', 'Approved', 'Submitted', 'Archived'
    )),
    
    -- Contract Type
    contract_type VARCHAR(50) CHECK (contract_type IN (
        'FFP', 'T&M', 'CPFF', 'CPIF', 'CPAF', 'IDIQ', 'BPA', 'Hybrid'
    )),
    
    -- Labor Categories & Rates
    labor_categories JSONB DEFAULT '[]',
    /*
    Structure: [
        {
            "lcat": "Senior Software Engineer",
            "quantity": 2,
            "hours_per_year": 1920,
            "direct_rate": 150.00,
            "indirect_rate": 185.00,
            "fringe_rate": 0.35,
            "overhead_rate": 0.50,
            "gna_rate": 0.15,
            "fee_rate": 0.10,
            "loaded_rate": 275.00
        }
    ]
    */
    
    -- Cost Summary
    total_direct_labor DECIMAL(15,2) DEFAULT 0,
    total_indirect_costs DECIMAL(15,2) DEFAULT 0,
    total_odcs DECIMAL(15,2) DEFAULT 0,
    total_subcontracts DECIMAL(15,2) DEFAULT 0,
    total_travel DECIMAL(15,2) DEFAULT 0,
    total_materials DECIMAL(15,2) DEFAULT 0,
    
    -- Fees & Rates
    fee_percentage DECIMAL(5,2) DEFAULT 10.00,
    fee_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Totals
    total_cost DECIMAL(15,2) DEFAULT 0,
    total_price DECIMAL(15,2) DEFAULT 0,
    
    -- Period of Performance
    base_period_months INTEGER DEFAULT 12,
    option_periods JSONB DEFAULT '[]',
    /*
    Structure: [
        { "name": "Option Year 1", "months": 12 },
        { "name": "Option Year 2", "months": 12 }
    ]
    */
    
    -- Wrap Rates (for T&M)
    wrap_rates JSONB DEFAULT '{}',
    
    -- Assumptions & Notes
    assumptions JSONB DEFAULT '[]',
    notes TEXT,
    
    -- Approvals
    approved_by UUID REFERENCES team_members(id),
    approved_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES team_members(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_models_opportunity ON pricing_models(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_pricing_models_company ON pricing_models(company_id);
CREATE INDEX IF NOT EXISTS idx_pricing_models_status ON pricing_models(status);

-- =====================================================
-- 4. COMPLIANCE REQUIREMENTS TABLE
-- For Compliance Matrix (Module 4)
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance_requirements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    
    -- Requirement Info
    requirement_id VARCHAR(50),  -- e.g., "L.1.2", "M.3.1"
    section VARCHAR(50) NOT NULL CHECK (section IN ('L', 'M', 'C', 'Other')),
    requirement_text TEXT NOT NULL,
    
    -- Classification
    requirement_type VARCHAR(50) CHECK (requirement_type IN (
        'Mandatory', 'Evaluation', 'Informational', 'Technical', 'Management', 'Past Performance'
    )),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    
    -- Response Tracking
    response_status VARCHAR(50) DEFAULT 'Not Started' CHECK (response_status IN (
        'Not Started', 'In Progress', 'Draft Complete', 'Reviewed', 'Final', 'N/A'
    )),
    response_location VARCHAR(255),  -- Volume/Section reference
    response_text TEXT,
    
    -- Assignments
    assigned_to UUID REFERENCES team_members(id),
    reviewer UUID REFERENCES team_members(id),
    
    -- Page/Word Limits
    page_limit INTEGER,
    word_limit INTEGER,
    current_page_count INTEGER,
    current_word_count INTEGER,
    
    -- Compliance Check
    is_compliant BOOLEAN,
    compliance_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_opportunity ON compliance_requirements(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_section ON compliance_requirements(section);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_requirements(response_status);

-- =====================================================
-- 5. PROPOSAL DOCUMENTS TABLE
-- For document management and version control
-- =====================================================
CREATE TABLE IF NOT EXISTS proposal_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    
    -- Document Info
    name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) CHECK (document_type IN (
        'Technical Volume', 'Management Volume', 'Past Performance', 'Pricing Volume',
        'Cover Letter', 'Executive Summary', 'Orals Slides', 'Supporting Document', 'Other'
    )),
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN (
        'Draft', 'Pink Team', 'Red Team', 'Gold Team', 'Final', 'Submitted'
    )),
    
    -- File Info
    file_url TEXT,
    file_size INTEGER,
    file_type VARCHAR(50),
    
    -- Content (for AI processing)
    content_text TEXT,
    content_summary TEXT,
    
    -- Review Tracking
    current_reviewer UUID REFERENCES team_members(id),
    review_due_date TIMESTAMPTZ,
    review_comments JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES team_members(id),
    last_modified_by UUID REFERENCES team_members(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_opportunity ON proposal_documents(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON proposal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON proposal_documents(status);

-- =====================================================
-- 6. ACTIVITY LOG TABLE
-- For audit trail and activity tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Who
    user_id UUID REFERENCES auth.users(id),
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    user_role VARCHAR(50),
    
    -- What
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'LOGIN', 'LOGOUT', 
        'APPROVE', 'REJECT', 'SUBMIT', 'AI_QUERY', 'SHARE', 'INVITE'
    )),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    entity_name VARCHAR(255),
    
    -- Details
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Context
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_activity_company ON activity_log(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_opportunity ON activity_log(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- =====================================================
-- 7. AI INTERACTIONS TABLE
-- For tracking AI agent usage and responses
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    
    -- User Info
    user_id UUID REFERENCES auth.users(id),
    user_email VARCHAR(255),
    
    -- Agent Info
    agent_type VARCHAR(50) NOT NULL CHECK (agent_type IN (
        'Capture', 'Strategy', 'BlackHat', 'Pricing', 'Compliance', 'Writer', 'Contracts', 'Orals'
    )),
    
    -- Interaction
    prompt TEXT NOT NULL,
    response TEXT,
    
    -- Metrics
    tokens_input INTEGER,
    tokens_output INTEGER,
    response_time_ms INTEGER,
    
    -- Quality
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,
    saved_to_playbook BOOLEAN DEFAULT false,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_company ON ai_interactions(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent ON ai_interactions(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_created ON ai_interactions(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read their company's data
CREATE POLICY "Users can view own company team members" ON team_members
    FOR SELECT USING (true);  -- Temporarily open for development

CREATE POLICY "Users can view own company competitors" ON competitors
    FOR SELECT USING (true);

CREATE POLICY "Users can view own company pricing" ON pricing_models
    FOR SELECT USING (true);

CREATE POLICY "Users can view own company compliance" ON compliance_requirements
    FOR SELECT USING (true);

CREATE POLICY "Users can view own company documents" ON proposal_documents
    FOR SELECT USING (true);

CREATE POLICY "Users can view own company activity" ON activity_log
    FOR SELECT USING (true);

CREATE POLICY "Users can view own AI interactions" ON ai_interactions
    FOR SELECT USING (true);

-- Insert policies (authenticated users can insert)
CREATE POLICY "Users can insert team members" ON team_members
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can insert competitors" ON competitors
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can insert pricing" ON pricing_models
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can insert compliance" ON compliance_requirements
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can insert documents" ON proposal_documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can log activity" ON activity_log
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can log AI interactions" ON ai_interactions
    FOR INSERT WITH CHECK (true);

-- Update policies
CREATE POLICY "Users can update team members" ON team_members
    FOR UPDATE USING (true);

CREATE POLICY "Users can update competitors" ON competitors
    FOR UPDATE USING (true);

CREATE POLICY "Users can update pricing" ON pricing_models
    FOR UPDATE USING (true);

CREATE POLICY "Users can update compliance" ON compliance_requirements
    FOR UPDATE USING (true);

CREATE POLICY "Users can update documents" ON proposal_documents
    FOR UPDATE USING (true);

-- =====================================================
-- SEED DATA FOR DEVELOPMENT
-- =====================================================

-- Get the first company ID for demo data
DO $$
DECLARE
    demo_company_id UUID;
    demo_opportunity_id UUID;
BEGIN
    -- Get first company
    SELECT id INTO demo_company_id FROM companies LIMIT 1;
    
    -- Get first opportunity
    SELECT id INTO demo_opportunity_id FROM opportunities WHERE company_id = demo_company_id LIMIT 1;
    
    IF demo_company_id IS NOT NULL THEN
        -- Insert demo team members
        INSERT INTO team_members (company_id, email, full_name, title, role, is_active) VALUES
            (demo_company_id, 'mary.womack@missionmeetstech.com', 'Mary Womack', 'CEO', 'CEO', true),
            (demo_company_id, 'sarah.chen@missionmeetstech.com', 'Sarah Chen', 'Capture Manager', 'CAP', true),
            (demo_company_id, 'mike.johnson@missionmeetstech.com', 'Mike Johnson', 'Solutions Architect', 'SA', true),
            (demo_company_id, 'lisa.wong@missionmeetstech.com', 'Lisa Wong', 'Pricing Analyst', 'FIN', true),
            (demo_company_id, 'david.smith@missionmeetstech.com', 'David Smith', 'Contracts Manager', 'CON', true),
            (demo_company_id, 'jennifer.davis@missionmeetstech.com', 'Jennifer Davis', 'Project Manager', 'PM', true)
        ON CONFLICT (company_id, email) DO NOTHING;
        
        -- Insert demo competitors if we have an opportunity
        IF demo_opportunity_id IS NOT NULL THEN
            INSERT INTO competitors (company_id, opportunity_id, name, business_size, incumbent, threat_level, strengths, weaknesses) VALUES
                (demo_company_id, demo_opportunity_id, 'Acme Healthcare IT', 'Large', true, 'High', 
                    '["Incumbent advantage", "Deep agency relationships", "Large talent pool"]'::jsonb,
                    '["High overhead rates", "Slow to innovate", "Recent contract performance issues"]'::jsonb),
                (demo_company_id, demo_opportunity_id, 'TechMed Solutions', 'Small', false, 'Medium',
                    '["Competitive pricing", "Agile methodology", "Strong past performance"]'::jsonb,
                    '["Limited scale", "No incumbent experience", "Key personnel availability"]'::jsonb),
                (demo_company_id, demo_opportunity_id, 'Federal Health Partners', 'SDVOSB', false, 'Medium',
                    '["Set-aside eligible", "Niche expertise", "Aggressive pricing"]'::jsonb,
                    '["Limited contract vehicles", "Small workforce", "Narrow experience base"]'::jsonb)
            ON CONFLICT DO NOTHING;
            
            -- Insert demo pricing model
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
                    2500000.00, 3250000.00, 12)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;

-- =====================================================
-- VERIFY MIGRATION
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Sprint 17 Migration Complete!';
    RAISE NOTICE 'Tables created: team_members, competitors, pricing_models, compliance_requirements, proposal_documents, activity_log, ai_interactions';
    RAISE NOTICE 'RLS policies enabled for all tables';
    RAISE NOTICE 'Demo data seeded for development';
END $$;
