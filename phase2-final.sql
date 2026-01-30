-- ============================================
-- MISSIONPULSE PHASE 2: BULLETPROOF SCHEMA
-- ============================================
-- Handles all existing table scenarios safely
-- ============================================

-- ============================================
-- STEP 1: FIX/EXTEND COMPANIES TABLE
-- ============================================
DO $$ 
BEGIN
    -- Create companies table if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        CREATE TABLE companies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            domain TEXT,
            subscription_tier TEXT DEFAULT 'starter',
            settings JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
    
    -- Add missing columns to existing companies table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'subscription_tier') THEN
        ALTER TABLE companies ADD COLUMN subscription_tier TEXT DEFAULT 'starter';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'settings') THEN
        ALTER TABLE companies ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'domain') THEN
        ALTER TABLE companies ADD COLUMN domain TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'updated_at') THEN
        ALTER TABLE companies ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- ============================================
-- STEP 2: ROLES LOOKUP TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_private BOOLEAN DEFAULT FALSE
);

INSERT INTO roles (name, description, is_private, permissions) VALUES
    ('CEO', 'Executive - Final Go/No-Go decisions', FALSE, '{"all": true}'),
    ('COO', 'Operations - Capture oversight', FALSE, '{"pipeline": true, "warroom": true, "compliance": true}'),
    ('CAP', 'Capture Manager - Win strategy lead', FALSE, '{"pipeline": true, "warroom": true, "strategy": true, "blackhat": true}'),
    ('PM', 'Program Manager - Schedule & execution', FALSE, '{"pipeline": true, "compliance": true, "scheduling": true}'),
    ('SA', 'Solutions Architect - Technical approach', FALSE, '{"compliance": true, "technical": true}'),
    ('FIN', 'Finance - Pricing & BOE', FALSE, '{"pricing": true, "boe": true}'),
    ('CON', 'Contracts - FAR/DFARS compliance', FALSE, '{"compliance": true, "irondome": true, "contracts": true}'),
    ('DEL', 'Delivery - Staffing & partners', FALSE, '{"staffing": true, "partners": true}'),
    ('QA', 'Quality Assurance - Review', FALSE, '{"review": true, "compliance": true}'),
    ('Partner', 'External Partner - Limited access', FALSE, '{"assigned_only": true}'),
    ('Admin', 'System Administrator', FALSE, '{"all": true, "admin": true}')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- STEP 3: FIX/EXTEND USERS TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company_id') THEN
        ALTER TABLE users ADD COLUMN company_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE users ADD COLUMN full_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login') THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'settings') THEN
        ALTER TABLE users ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;
END $$;

-- ============================================
-- STEP 4: INVITATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'User',
    invited_by UUID,
    token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 5: FIX/EXTEND OPPORTUNITIES TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'company_id') THEN
        ALTER TABLE opportunities ADD COLUMN company_id UUID;
    END IF;
END $$;

-- ============================================
-- STEP 6: AUTH AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS auth_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    event_type TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 7: TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID,
    name TEXT NOT NULL,
    role TEXT,
    labor_category TEXT,
    hourly_rate DECIMAL(10,2),
    hours_per_week DECIMAL(5,2) DEFAULT 40,
    start_date DATE,
    end_date DATE,
    is_key_personnel BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 8: PLAYBOOK LESSONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS playbook_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    tags TEXT[],
    is_golden BOOLEAN DEFAULT FALSE,
    opportunity_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 9: ROW LEVEL SECURITY
-- ============================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_lessons ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first (ignore errors)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "allow_all_companies" ON companies;
    DROP POLICY IF EXISTS "allow_all_invitations" ON invitations;
    DROP POLICY IF EXISTS "allow_all_auth_audit" ON auth_audit_log;
    DROP POLICY IF EXISTS "allow_all_team_members" ON team_members;
    DROP POLICY IF EXISTS "allow_all_playbook" ON playbook_lessons;
    DROP POLICY IF EXISTS "Users can view own company" ON companies;
    DROP POLICY IF EXISTS "Public read companies" ON companies;
    DROP POLICY IF EXISTS "Admins can manage invitations" ON invitations;
    DROP POLICY IF EXISTS "Public read invitations" ON invitations;
    DROP POLICY IF EXISTS "Users view own auth events" ON auth_audit_log;
    DROP POLICY IF EXISTS "Allow insert auth events" ON auth_audit_log;
    DROP POLICY IF EXISTS "Company can view team members" ON team_members;
    DROP POLICY IF EXISTS "Company can manage team members" ON team_members;
    DROP POLICY IF EXISTS "Authenticated users manage team members" ON team_members;
    DROP POLICY IF EXISTS "Company can view lessons" ON playbook_lessons;
    DROP POLICY IF EXISTS "Company can manage lessons" ON playbook_lessons;
    DROP POLICY IF EXISTS "Authenticated users manage lessons" ON playbook_lessons;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create simple open policies
CREATE POLICY "allow_all_companies" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_invitations" ON invitations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_auth_audit" ON auth_audit_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_team_members" ON team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_playbook" ON playbook_lessons FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- STEP 10: HELPER FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- STEP 11: SEED DATA (SAFE INSERT)
-- ============================================
DO $$
BEGIN
    -- Only insert if no company with this ID exists
    IF NOT EXISTS (SELECT 1 FROM companies WHERE id = 'c0000000-0000-0000-0000-000000000001') THEN
        INSERT INTO companies (id, name) VALUES ('c0000000-0000-0000-0000-000000000001', 'Mission Meets Tech');
    END IF;
    
    -- Update the company with additional fields if they exist
    UPDATE companies 
    SET 
        domain = 'missionmeetstech.com',
        subscription_tier = 'enterprise'
    WHERE id = 'c0000000-0000-0000-0000-000000000001';
END $$;

-- Update opportunities with company_id
UPDATE opportunities 
SET company_id = 'c0000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

-- ============================================
-- STEP 12: INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_company ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_auth_audit_user ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_opp ON team_members(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_playbook_company ON playbook_lessons(company_id);

-- ============================================
-- DONE! Should see "Success. No rows returned"
-- ============================================
