-- ============================================================
-- MISSIONPULSE COMPLETE FIX SCRIPT (CORRECTED SCHEMA)
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- STEP 1: Disable ALL Row Level Security (for testing)
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements DISABLE ROW LEVEL SECURITY;
ALTER TABLE lessons_learned DISABLE ROW LEVEL SECURITY;

-- STEP 2: Get or create Mission Meets Tech company
INSERT INTO companies (name)
VALUES ('Mission Meets Tech')
ON CONFLICT DO NOTHING;

-- STEP 3: Update Mary's user record with correct company
UPDATE users 
SET 
    company_id = (SELECT id FROM companies WHERE name = 'Mission Meets Tech' LIMIT 1),
    full_name = 'Mary Womack',
    role = 'capture_manager'
WHERE id = 'b7921be2-bc28-4fa6-b2cc-cf7b0cb91f62';

-- STEP 4: Update ALL existing opportunities to belong to Mission Meets Tech
UPDATE opportunities 
SET company_id = (SELECT id FROM companies WHERE name = 'Mission Meets Tech' LIMIT 1)
WHERE company_id IS NULL OR company_id != (SELECT id FROM companies WHERE name = 'Mission Meets Tech' LIMIT 1);

-- STEP 5: Insert sample opportunities with CORRECT column names
INSERT INTO opportunities (
    title, 
    solicitation_number, 
    agency, 
    contract_type, 
    estimated_value,      -- was contract_value
    proposal_due,         -- was due_date
    phase,                -- was status
    pwin, 
    description, 
    company_id
)
SELECT * FROM (VALUES
    ('EHR Modernization Support', 'VA-EHR-2025-001', 'VA', 'IDIQ Task Order', 45000000::numeric, '2025-03-15'::date, 'capture', 72, 'Electronic Health Record modernization support services', (SELECT id FROM companies WHERE name = 'Mission Meets Tech')),
    ('MHS GENESIS Training', 'DHA-MHS-2025-042', 'DHA', 'Firm Fixed Price', 12500000::numeric, '2025-02-28'::date, 'proposal', 65, 'Military Health System training and change management', (SELECT id FROM companies WHERE name = 'Mission Meets Tech')),
    ('CMS Data Analytics Platform', 'CMS-DAP-2025-003', 'CMS', 'Cost Plus', 28000000::numeric, '2025-04-30'::date, 'qualification', 45, 'Healthcare data analytics and reporting platform', (SELECT id FROM companies WHERE name = 'Mission Meets Tech')),
    ('IHS Telehealth Expansion', 'IHS-TH-2025-017', 'IHS', 'BPA Call', 8500000::numeric, '2025-03-01'::date, 'capture', 58, 'Telehealth infrastructure for rural healthcare facilities', (SELECT id FROM companies WHERE name = 'Mission Meets Tech')),
    ('SSA Disability Claims Modernization', 'SSA-DCM-2025-008', 'SSA', 'GWAC Task Order', 35000000::numeric, '2025-05-15'::date, 'identification', 35, 'Disability claims processing system modernization', (SELECT id FROM companies WHERE name = 'Mission Meets Tech')),
    ('CDC Surveillance System', 'CDC-SS-2025-022', 'CDC', 'Firm Fixed Price', 18000000::numeric, '2025-04-01'::date, 'capture', 62, 'Public health surveillance and reporting system', (SELECT id FROM companies WHERE name = 'Mission Meets Tech'))
) AS new_opps(title, solicitation_number, agency, contract_type, estimated_value, proposal_due, phase, pwin, description, company_id)
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE solicitation_number = new_opps.solicitation_number);

-- STEP 6: Verify the fix
SELECT 'Companies' as table_name, COUNT(*) as count FROM companies
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Opportunities', COUNT(*) FROM opportunities;

-- STEP 7: Show opportunities with their company
SELECT title, agency, estimated_value, phase, pwin, company_id
FROM opportunities
ORDER BY estimated_value DESC;
