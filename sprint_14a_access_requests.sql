-- ============================================================
-- FILE: sprint_14a_access_requests.sql
-- ROLE: System
-- SECURITY: Public INSERT, Admin SELECT
-- SPRINT: 14A - Request Access Form
-- ============================================================

-- ============================================================
-- 1. CREATE ACCESS REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  source TEXT DEFAULT 'website', -- website, referral, demo, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);
CREATE INDEX IF NOT EXISTS idx_access_requests_created ON access_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_requests_company ON access_requests(company_name);

-- ============================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

-- Policy 1: Anyone can submit an access request (public)
CREATE POLICY "Anyone can request access"
ON access_requests FOR INSERT
WITH CHECK (true);

-- Policy 2: Only CEO, COO, and Admin roles can view requests
CREATE POLICY "Admins can view all access requests"
ON access_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('CEO', 'COO', 'Admin')
  )
);

-- Policy 3: Only CEO, COO, and Admin can update request status
CREATE POLICY "Admins can update access requests"
ON access_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('CEO', 'COO', 'Admin')
  )
);

-- Policy 4: Only CEO can delete requests (audit trail protection)
CREATE POLICY "CEO can delete access requests"
ON access_requests FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'CEO'
  )
);

-- ============================================================
-- 5. UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_access_requests_updated_at()
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
  EXECUTE FUNCTION update_access_requests_updated_at();

-- ============================================================
-- 6. NOTIFICATION FUNCTION (Called by Edge Function)
-- ============================================================
-- This function is called after insert to log for notification
CREATE OR REPLACE FUNCTION notify_new_access_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Log to Postgres notify channel for real-time subscriptions
  PERFORM pg_notify(
    'new_access_request',
    json_build_object(
      'id', NEW.id,
      'full_name', NEW.full_name,
      'email', NEW.email,
      'company_name', NEW.company_name,
      'created_at', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_access_request ON access_requests;
CREATE TRIGGER on_new_access_request
  AFTER INSERT ON access_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_access_request();

-- ============================================================
-- 7. GRANT PERMISSIONS
-- ============================================================
-- Allow anon (public) to insert
GRANT INSERT ON access_requests TO anon;

-- Allow authenticated users to select (RLS handles role check)
GRANT SELECT, UPDATE ON access_requests TO authenticated;

-- ============================================================
-- 8. CREATE SUMMARY VIEW FOR ADMIN DASHBOARD
-- ============================================================
CREATE OR REPLACE VIEW access_requests_summary AS
SELECT 
  status,
  COUNT(*) as count,
  MAX(created_at) as latest_request
FROM access_requests
GROUP BY status;

-- Grant view access to authenticated users
GRANT SELECT ON access_requests_summary TO authenticated;

-- ============================================================
-- FOOTER STACK
-- ============================================================
-- Architecture: New table with 4 RLS policies
-- Security: Public INSERT, Role-gated SELECT/UPDATE/DELETE
-- Cost: Minimal - ~100 bytes per request
-- Test: INSERT INTO access_requests (full_name, email, company_name) 
--       VALUES ('Test User', 'test@example.com', 'Test Corp');

-- AI GENERATED - REQUIRES HUMAN REVIEW
