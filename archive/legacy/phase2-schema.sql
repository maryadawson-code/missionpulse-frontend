-- ============================================
-- MISSIONPULSE PHASE 2: DATABASE SCHEMA
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Click "New query"
-- 3. Paste this entire file
-- 4. Click "Run" (or Ctrl+Enter)
-- 5. You should see "Success. No rows returned"
--
-- This creates all tables needed for MissionPulse auth
-- ============================================

-- 1. COMPANIES TABLE (Tenants)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT,
    subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'growth', 'enterprise')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ROLES LOOKUP TABLE
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_private BOOLEAN DEFAULT FALSE
);

-- Insert Shipley roles
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

-- 3. USERS TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    role_id INTEGER REFERENCES roles(id) DEFAULT 11,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    invited_by UUID REFERENCES users(id),
    token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ADD company_id TO OPPORTUNITIES (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'opportunities' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE opportunities ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;
END $$;

-- 6. AUTH AUDIT LOG
CREATE TABLE IF NOT EXISTS auth_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TEAM MEMBERS TABLE (for BOE/Pricing)
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
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

-- 8. PLAYBOOK LESSONS TABLE
CREATE TABLE IF NOT EXISTS playbook_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    tags TEXT[],
    is_golden BOOLEAN DEFAULT FALSE,
    opportunity_id UUID REFERENCES opportunities(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Users can view own company" ON companies;
DROP POLICY IF EXISTS "Users can view company members" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage invitations" ON invitations;
DROP POLICY IF EXISTS "Users view own auth events" ON auth_audit_log;
DROP POLICY IF EXISTS "Company can view team members" ON team_members;
DROP POLICY IF EXISTS "Company can manage team members" ON team_members;
DROP POLICY IF EXISTS "Company can view lessons" ON playbook_lessons;
DROP POLICY IF EXISTS "Company can manage lessons" ON playbook_lessons;

-- Companies: Users can only see their own company
CREATE POLICY "Users can view own company" ON companies
    FOR SELECT USING (
        id IN (SELECT company_id FROM users WHERE id = auth.uid())
    );

-- Users: Can view users in same company
CREATE POLICY "Users can view company members" ON users
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
        OR id = auth.uid()
    );

-- Users: Can update own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Invitations: Company admins can manage
CREATE POLICY "Admins can manage invitations" ON invitations
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM users 
            WHERE id = auth.uid() 
            AND role_id IN (SELECT id FROM roles WHERE name IN ('Admin', 'CEO'))
        )
    );

-- Auth audit: Users can view own events
CREATE POLICY "Users view own auth events" ON auth_audit_log
    FOR SELECT USING (user_id = auth.uid());

-- Team members: Company isolation
CREATE POLICY "Company can view team members" ON team_members
    FOR SELECT USING (
        opportunity_id IN (
            SELECT id FROM opportunities 
            WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Company can manage team members" ON team_members
    FOR ALL USING (
        opportunity_id IN (
            SELECT id FROM opportunities 
            WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
        )
    );

-- Playbook lessons: Company isolation
CREATE POLICY "Company can view lessons" ON playbook_lessons
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Company can manage lessons" ON playbook_lessons
    FOR ALL USING (
        company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get current user's company
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
    SELECT r.name FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(permission_key TEXT)
RETURNS BOOLEAN AS $$
    SELECT COALESCE(
        (SELECT r.permissions->permission_key = 'true' OR r.permissions->'all' = 'true'
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = auth.uid()),
        FALSE
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SEED DATA
-- ============================================

-- Create Mission Meets Tech company
INSERT INTO companies (id, name, domain, subscription_tier)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'Mission Meets Tech',
    'missionmeetstech.com',
    'enterprise'
) ON CONFLICT DO NOTHING;

-- Update existing opportunities with company_id
UPDATE opportunities 
SET company_id = 'c0000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_opportunities_company ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_auth_audit_user ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_opp ON team_members(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_playbook_company ON playbook_lessons(company_id);

-- ============================================
-- DONE! 
-- ============================================
-- You should see "Success. No rows returned"
-- Your database is now ready for MissionPulse auth!
