-- ============================================================
-- MISSIONPULSE PHASE 4 - SEED DATA
-- Run this in Supabase SQL Editor after deploying schema
-- ============================================================

-- First, let's ensure we have a test company
INSERT INTO companies (id, name, domain, cage_code, duns_number, naics_codes, set_aside_status, created_at)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'Mission Meets Tech',
  'missionmeetstech.com',
  '8ABC1',
  '123456789',
  ARRAY['541512', '541519', '541611', '541690'],
  ARRAY['SDVOSB', 'WOSB'],
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain;

-- ============================================================
-- SAMPLE OPPORTUNITIES - DHA, VA, CMS (from your demo data)
-- ============================================================

-- Opportunity 1: DHA Healthcare Data Platform
INSERT INTO opportunities (
  id, company_id, title, agency, solicitation_number, 
  contract_value, contract_type, naics_code,
  submission_deadline, shipley_phase, pwin, priority,
  completion_percent, status, description, created_at
) VALUES (
  'opp00000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Enterprise Healthcare Data Platform Modernization',
  'Defense Health Agency (DHA)',
  'HC1028-25-R-0042',
  95000000,
  'IDIQ',
  '541512',
  NOW() + INTERVAL '45 days',
  'proposal',
  72,
  'high',
  45,
  'active',
  'Modernize legacy healthcare data systems across the Military Health System (MHS). Includes cloud migration, AI/ML analytics, and interoperability with VA systems.',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  submission_deadline = EXCLUDED.submission_deadline;

-- Opportunity 2: VA EHR Integration
INSERT INTO opportunities (
  id, company_id, title, agency, solicitation_number,
  contract_value, contract_type, naics_code,
  submission_deadline, shipley_phase, pwin, priority,
  completion_percent, status, description, created_at
) VALUES (
  'opp00000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'Veterans EHR Interoperability Gateway',
  'Department of Veterans Affairs (VA)',
  'VA119-25-R-0156',
  42000000,
  'FFP',
  '541519',
  NOW() + INTERVAL '30 days',
  'review',
  65,
  'high',
  78,
  'active',
  'Build secure data exchange gateway between VA VistA systems and DoD MHS GENESIS. FHIR-compliant API development with real-time patient data synchronization.',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  submission_deadline = EXCLUDED.submission_deadline;

-- Opportunity 3: CMS Fraud Detection
INSERT INTO opportunities (
  id, company_id, title, agency, solicitation_number,
  contract_value, contract_type, naics_code,
  submission_deadline, shipley_phase, pwin, priority,
  completion_percent, status, description, created_at
) VALUES (
  'opp00000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'Medicare Fraud Detection AI Platform',
  'Centers for Medicare & Medicaid Services (CMS)',
  'CMS-2025-AI-0089',
  28000000,
  'T&M',
  '541690',
  NOW() + INTERVAL '60 days',
  'capture',
  55,
  'medium',
  22,
  'active',
  'Develop AI/ML-powered fraud detection system for Medicare claims processing. Real-time anomaly detection with explainable AI for audit compliance.',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  submission_deadline = EXCLUDED.submission_deadline;

-- Opportunity 4: IHS Telehealth Expansion
INSERT INTO opportunities (
  id, company_id, title, agency, solicitation_number,
  contract_value, contract_type, naics_code,
  submission_deadline, shipley_phase, pwin, priority,
  completion_percent, status, description, created_at
) VALUES (
  'opp00000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000001',
  'Indian Health Service Telehealth Platform',
  'Indian Health Service (IHS)',
  'IHS-ITG-25-0034',
  18500000,
  'FFP',
  '541512',
  NOW() + INTERVAL '21 days',
  'proposal',
  48,
  'medium',
  62,
  'active',
  'Deploy telehealth infrastructure across 170+ IHS facilities. Includes video consultation platform, remote patient monitoring, and mobile health units.',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  submission_deadline = EXCLUDED.submission_deadline;

-- Opportunity 5: HHS Data Analytics (Urgent)
INSERT INTO opportunities (
  id, company_id, title, agency, solicitation_number,
  contract_value, contract_type, naics_code,
  submission_deadline, shipley_phase, pwin, priority,
  completion_percent, status, description, created_at
) VALUES (
  'opp00000-0000-0000-0000-000000000005',
  'c0000000-0000-0000-0000-000000000001',
  'HHS Population Health Analytics Dashboard',
  'Department of Health and Human Services (HHS)',
  'HHS-OS-2025-0112',
  12000000,
  'CPFF',
  '541611',
  NOW() + INTERVAL '10 days',
  'review',
  78,
  'high',
  92,
  'active',
  'Build executive dashboard for population health metrics, pandemic preparedness indicators, and resource allocation optimization.',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  submission_deadline = EXCLUDED.submission_deadline;

-- Opportunity 6: CDC Surveillance System
INSERT INTO opportunities (
  id, company_id, title, agency, solicitation_number,
  contract_value, contract_type, naics_code,
  submission_deadline, shipley_phase, pwin, priority,
  completion_percent, status, description, created_at
) VALUES (
  'opp00000-0000-0000-0000-000000000006',
  'c0000000-0000-0000-0000-000000000001',
  'Disease Surveillance Modernization',
  'Centers for Disease Control (CDC)',
  'CDC-NCIRD-25-SOL-0067',
  55000000,
  'IDIQ',
  '541512',
  NOW() + INTERVAL '75 days',
  'qualify',
  42,
  'low',
  15,
  'active',
  'Modernize national disease surveillance infrastructure. Cloud-native architecture with real-time data ingestion from state/local health departments.',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  submission_deadline = EXCLUDED.submission_deadline;

-- ============================================================
-- CREATE TEST USER (linked to auth.users)
-- Note: Run this AFTER creating a user through Supabase Auth
-- Replace the UUID with your actual auth user ID
-- ============================================================

-- Example: Create admin user profile
-- First sign up via login.html, then get the user ID from Supabase Auth dashboard
-- Then run this with the correct ID:

/*
INSERT INTO users (
  id,
  company_id,
  email,
  full_name,
  role,
  is_active,
  created_at
) VALUES (
  'YOUR-AUTH-USER-UUID-HERE',  -- Replace with actual auth.users.id
  'c0000000-0000-0000-0000-000000000001',
  'mary@missionmeetstech.com',
  'Mary Womack',
  'CEO',
  true,
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;
*/

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check companies
SELECT id, name, domain, cage_code FROM companies;

-- Check opportunities
SELECT 
  title, 
  agency, 
  shipley_phase, 
  pwin, 
  priority,
  contract_value / 1000000 as value_millions,
  submission_deadline,
  EXTRACT(DAY FROM submission_deadline - NOW()) as days_until_deadline
FROM opportunities 
ORDER BY submission_deadline ASC;

-- Check users (run after creating auth user)
SELECT id, email, full_name, role, company_id FROM users;

-- ============================================================
-- SUMMARY
-- ============================================================
-- This script creates:
-- ✅ 1 Test Company (Mission Meets Tech)
-- ✅ 6 Sample Opportunities across different agencies/phases
-- 
-- After running this, you should:
-- 1. Sign up a user via login.html
-- 2. Get the auth user ID from Supabase Auth dashboard
-- 3. Run the INSERT INTO users query above with correct ID
-- 4. Refresh dashboard to see real data
-- ============================================================
