-- ============================================================================
-- MISSIONPULSE - ACCESS REQUESTS TABLE (SPRINT 14A)
-- ============================================================================
-- Stores early access / lead capture form submissions
-- Run in Supabase SQL Editor
-- 
-- Author: Mission Meets Tech
-- Generated: January 30, 2026
-- ============================================================================

-- Drop existing table and policies (safe cleanup)
DROP POLICY IF EXISTS "access_requests_insert_public" ON access_requests;
DROP POLICY IF EXISTS "access_requests_select_admin" ON access_requests;
DROP POLICY IF EXISTS "access_requests_update_admin" ON access_requests;
DROP POLICY IF EXISTS "access_requests_delete_admin" ON access_requests;
DROP INDEX IF EXISTS idx_access_requests_email;
DROP INDEX IF EXISTS idx_access_requests_status;
DROP INDEX IF EXISTS idx_access_requests_created;
DROP TABLE IF EXISTS access_requests CASCADE;

-- ============================================================================
-- CREATE TABLE
-- ============================================================================
CREATE TABLE access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contact Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- Company Information
    company VARCHAR(255) NOT NULL,
    title VARCHAR(150),
    company_size VARCHAR(50),
    contract_type VARCHAR(50),
    certifications TEXT[], -- Array of certifications (sdvosb, 8a, hubzone, etc.)
    annual_revenue VARCHAR(50),
    
    -- Qualification Data
    proposals_per_year VARCHAR(20),
    biggest_challenge TEXT,
    referral_source VARCHAR(100),
    
    -- Lead Management
    status VARCHAR(50) DEFAULT 'new',
    priority VARCHAR(20) DEFAULT 'normal',
    assigned_to UUID REFERENCES profiles(id),
    notes TEXT,
    
    -- Integration IDs
    hubspot_contact_id VARCHAR(100),
    hubspot_deal_id VARCHAR(100),
    
    -- Follow-up Tracking
    demo_scheduled BOOLEAN DEFAULT FALSE,
    demo_date TIMESTAMPTZ,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    converted_to_user BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES profiles(id),
    
    -- Audit Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_access_requests_email ON access_requests(email);
CREATE INDEX idx_access_requests_status ON access_requests(status);
CREATE INDEX idx_access_requests_created ON access_requests(created_at DESC);
CREATE INDEX idx_access_requests_company ON access_requests(company);
CREATE INDEX idx_access_requests_assigned ON access_requests(assigned_to);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an access request (public form)
CREATE POLICY "access_requests_insert_public" ON access_requests
    FOR INSERT
    WITH CHECK (true);

-- Only admins/CEO/COO can view access requests
CREATE POLICY "access_requests_select_admin" ON access_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('CEO', 'COO', 'Admin')
        )
    );

-- Only admins/CEO/COO can update access requests
CREATE POLICY "access_requests_update_admin" ON access_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('CEO', 'COO', 'Admin')
        )
    );

-- Only admins can delete access requests
CREATE POLICY "access_requests_delete_admin" ON access_requests
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Admin'
        )
    );

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_access_requests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS access_requests_updated_at ON access_requests;
CREATE TRIGGER access_requests_updated_at
    BEFORE UPDATE ON access_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_access_requests_timestamp();

-- ============================================================================
-- NOTIFICATIONS VIEW (for dashboard)
-- ============================================================================
CREATE OR REPLACE VIEW access_requests_pending AS
SELECT 
    id,
    first_name,
    last_name,
    email,
    company,
    title,
    company_size,
    proposals_per_year,
    certifications,
    status,
    priority,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS hours_since_request
FROM access_requests
WHERE status IN ('new', 'pending')
ORDER BY 
    CASE priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'normal' THEN 3 
        WHEN 'low' THEN 4 
    END,
    created_at ASC;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================
INSERT INTO access_requests (
    first_name, last_name, email, company, title, 
    company_size, contract_type, certifications, proposals_per_year,
    biggest_challenge, referral_source, status
) VALUES 
(
    'James', 'Thompson', 'james@sdvosbexample.com', 'Veteran Tech Solutions', 'Capture Manager',
    '11-50', 'prime', ARRAY['sdvosb'], '6-10',
    'We struggle with consistent win themes across proposal volumes.',
    'linkedin', 'new'
),
(
    'Sarah', 'Chen', 'sarah@healthitpartners.com', 'Health IT Partners', 'CEO',
    '51-200', 'both', ARRAY['wosb', '8a'], '11-25',
    'Our pricing estimates take too long and are often inaccurate.',
    'referral', 'new'
),
(
    'Michael', 'Rodriguez', 'mike@feddefense.io', 'Federal Defense Systems', 'VP Business Development',
    '201-500', 'prime', ARRAY['none'], '26-50',
    'We need better competitive intelligence on incumbents.',
    'conference', 'pending'
);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT SELECT, INSERT ON access_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON access_requests TO authenticated;
GRANT ALL ON access_requests_pending TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 
    'access_requests' as table_name,
    COUNT(*) as row_count
FROM access_requests;

-- Success message
SELECT '✅ Sprint 14A: Access Requests table created successfully!' as status;
