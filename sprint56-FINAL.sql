-- Sprint 56 FINAL: Pipeline + Labor Categories Seed
-- Fixes: Populates BOTH name AND title columns
-- Run in Supabase SQL Editor

-- ============================================
-- STEP 1: Create labor_categories table
-- ============================================
DROP TABLE IF EXISTS labor_categories CASCADE;

CREATE TABLE labor_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  family TEXT NOT NULL,
  level INTEGER,
  level_name TEXT NOT NULL,
  years_experience INTEGER,
  bill_rate_low DECIMAL(10,2),
  bill_rate_high DECIMAL(10,2),
  gsa_lcat TEXT,
  alt_lcats TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE labor_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "labor_categories_company" ON labor_categories;
CREATE POLICY "labor_categories_company" ON labor_categories
  FOR ALL USING (
    company_id IS NULL OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = labor_categories.company_id
    )
  );

-- ============================================
-- STEP 2: Seed Labor Categories (from Excel)
-- ============================================

-- Communications Consulting
INSERT INTO labor_categories (family, level, level_name, years_experience, bill_rate_low, bill_rate_high, gsa_lcat, alt_lcats) VALUES
('Communications Consulting', 1, 'Intern', 0, 0, 0, NULL, NULL),
('Communications Consulting', 2, 'Associate', 3, 56.91, 62.32, 'Instructional Designer I', ARRAY['Technical Writer/Editor I', 'Trainer/Training Specialist I']),
('Communications Consulting', 3, 'Sr Associate', 5, 69.85, 90.00, 'Instructional Designer II', ARRAY['Technical Writer/Editor II', 'Trainer/Training Specialist II']),
('Communications Consulting', 4, 'Manager', 10, 67.26, 127.48, 'Trainer/Training Specialist III', ARRAY['Technical Writer/Editor III']),
('Communications Consulting', 5, 'Sr Manager', 12, 90.00, 150.00, NULL, NULL),
('Communications Consulting', 6, 'Director', 15, 150.00, 200.00, NULL, NULL),
('Communications Consulting', 7, 'Executive Director', 18, 200.00, 275.00, NULL, NULL);

-- Technology Consulting
INSERT INTO labor_categories (family, level, level_name, years_experience, bill_rate_low, bill_rate_high, gsa_lcat, alt_lcats) VALUES
('Technology Consulting', 1, 'Intern', 0, 0, 0, NULL, NULL),
('Technology Consulting', 2, 'Associate', 1, 39.67, 78.38, 'IT Systems Analyst I', NULL),
('Technology Consulting', 3, 'Sr Associate', 5, 60.53, 113.32, 'IT Systems Analyst II', NULL),
('Technology Consulting', 4, 'Manager', 7, 107.65, 133.58, 'IT Systems Analyst III', NULL),
('Technology Consulting', 5, 'Sr Manager', 10, 168.15, 184.14, 'IT Subject Matter Expert III', NULL),
('Technology Consulting', 6, 'Director', 15, 185.00, 225.00, NULL, NULL),
('Technology Consulting', 7, 'Executive Director', 18, 225.00, 300.00, NULL, NULL);

-- Clinical Informatics
INSERT INTO labor_categories (family, level, level_name, years_experience, bill_rate_low, bill_rate_high, gsa_lcat, alt_lcats) VALUES
('Clinical Informatics', 1, 'Intern', 0, 0, 0, NULL, NULL),
('Clinical Informatics', 2, 'Associate', 2, 45.00, 65.00, 'Health IT Analyst I', NULL),
('Clinical Informatics', 3, 'Sr Associate', 5, 75.00, 110.00, 'Health IT Analyst II', ARRAY['Clinical Informaticist I']),
('Clinical Informatics', 4, 'Manager', 8, 115.00, 145.00, 'Health IT Analyst III', ARRAY['Clinical Informaticist II']),
('Clinical Informatics', 5, 'Sr Manager', 12, 150.00, 185.00, 'Health IT SME', ARRAY['Clinical Informaticist III']),
('Clinical Informatics', 6, 'Director', 15, 190.00, 240.00, NULL, NULL),
('Clinical Informatics', 7, 'Executive Director', 18, 245.00, 325.00, NULL, NULL);

-- Data & Analytics
INSERT INTO labor_categories (family, level, level_name, years_experience, bill_rate_low, bill_rate_high, gsa_lcat, alt_lcats) VALUES
('Data & Analytics', 1, 'Intern', 0, 0, 0, NULL, NULL),
('Data & Analytics', 2, 'Associate', 2, 50.00, 75.00, 'Data Analyst I', ARRAY['Business Analyst I']),
('Data & Analytics', 3, 'Sr Associate', 5, 80.00, 120.00, 'Data Analyst II', ARRAY['Business Analyst II', 'Data Engineer I']),
('Data & Analytics', 4, 'Manager', 8, 125.00, 160.00, 'Data Analyst III', ARRAY['Data Engineer II', 'Data Scientist I']),
('Data & Analytics', 5, 'Sr Manager', 12, 165.00, 200.00, 'Data Scientist II', ARRAY['Data Engineer III']),
('Data & Analytics', 6, 'Director', 15, 205.00, 260.00, 'Data Scientist III', NULL),
('Data & Analytics', 7, 'Executive Director', 18, 265.00, 350.00, NULL, NULL);

-- Program Management
INSERT INTO labor_categories (family, level, level_name, years_experience, bill_rate_low, bill_rate_high, gsa_lcat, alt_lcats) VALUES
('Program Management', 1, 'Intern', 0, 0, 0, NULL, NULL),
('Program Management', 2, 'Associate', 2, 45.00, 70.00, 'Program Analyst I', ARRAY['Project Coordinator']),
('Program Management', 3, 'Sr Associate', 5, 75.00, 105.00, 'Program Analyst II', ARRAY['Project Manager I']),
('Program Management', 4, 'Manager', 8, 110.00, 145.00, 'Program Analyst III', ARRAY['Project Manager II']),
('Program Management', 5, 'Sr Manager', 12, 150.00, 190.00, 'Program Manager I', ARRAY['Project Manager III']),
('Program Management', 6, 'Director', 15, 195.00, 250.00, 'Program Manager II', NULL),
('Program Management', 7, 'Executive Director', 18, 255.00, 350.00, 'Program Manager III', NULL);

-- ============================================
-- STEP 3: Seed Opportunities (FIXED - includes name column)
-- ============================================
DO $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
BEGIN
  -- Get Mary's user ID
  SELECT id INTO v_user_id 
  FROM profiles 
  WHERE email = 'maryadawson@gmail.com' 
  LIMIT 1;

  -- Get or create company
  SELECT id INTO v_company_id FROM companies WHERE name = 'Mission Meets Tech' LIMIT 1;
  
  IF v_company_id IS NULL THEN
    INSERT INTO companies (id, name, domain) 
    VALUES (gen_random_uuid(), 'Mission Meets Tech', 'missionmeetstech.com')
    RETURNING id INTO v_company_id;
  END IF;

  -- Update user's company
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET company_id = v_company_id WHERE id = v_user_id;
  END IF;

  -- Update labor categories with company
  UPDATE labor_categories SET company_id = v_company_id WHERE company_id IS NULL;

  -- Clear existing opportunities
  DELETE FROM opportunities WHERE company_id = v_company_id;

  -- ============================================
  -- P-0 MUST WIN
  -- ============================================
  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'DHA Data Governance', 'DHA Data Governance', 'DHA Data Gov', 'DHA', 'TBD', 'GSA MAS', 'Prime', 'WOSB', 2300000, 70, 'submitted', 'P-0', 'Zero-footprint architecture | $560K savings vs COTS', 'LMI', 'Prep oral presentation', 'Submitted per FAR 15.208(b)(1) | Escalation email damaged CO relationship', 'high', NOW());

  -- ============================================
  -- P-1 HIGH PRIORITY
  -- ============================================
  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'DHA EIDS AOI 4 Data Apps', 'DHA EIDS AOI 4 Data Apps', 'EIDS AOI 4', 'DHA', 'HT0038-25-S-C001', 'OTA/CSO', 'Prime', 'Open', 3000000, 45, 'submitted', 'P-1', 'AMANDA Framework | AI/ML data applications', 'LMI', 'Await Phase I down-select', 'Rolling submissions through 7/1/26 | Phase I down-select pending', 'high', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'VA OIP Task Order', 'VA OIP Task Order', 'VA OIP TO', 'VA', 'VA-25-00009735', 'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 4000000, 50, 'submitted', 'P-1', 'MHS GENESIS/Oracle Health expertise | SAFe delivery', 'A4V (HRS, Oxford, 4th Sector)', 'Schedule strategy call with Paul DeYoung', 'SAC VA-25-00009735 | PWS Oct 2025 | 78 staff proposed | FFP Feature-based', 'high', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'VA IHT 2.0 General TOs', 'VA IHT 2.0 General TOs', 'IHT 2.0 TOs', 'VA', '36C10X25D0017', 'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 1400000000, 35, 'monitoring', 'P-1', 'Health informatics | Data governance | Analytics', 'A4V', 'Daily SAM.gov monitoring', '$14B ceiling | Arrow Arc/Aptive PRIMARY THREAT', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'VA Suicide Prevention Analytics', 'VA Suicide Prevention Analytics', 'VA Suicide Prev', 'VA', 'TBD', 'TBD', 'Sub', 'Open', 5000000, 55, 'shaping', 'P-1', 'Program evaluation | Data analytics | AMANDA Framework', 'LMI', 'Seth connect with Patrick team', 'Dr. Burnett DIRECTLY asked LMI for help (1/17/26)', 'high', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'DHA MHS GENESIS Post-Deploy', 'DHA MHS GENESIS Post-Deploy', 'MHS GENESIS Post', 'DHA', 'TBD', 'GSA MAS / OASIS+', 'Prime', 'WOSB', 8000000, 35, 'shaping', 'P-1', 'Adoption-First Methodology | MHS GENESIS experience', 'LMI', 'Monitor draft RFP release', 'Documentation RFI Nov 2024 | CSO expected Q1 FY26', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'DHA OMNIBUS IV Task Orders', 'DHA OMNIBUS IV Task Orders', 'OMNIBUS IV TOs', 'DHA', 'Various', 'OMNIBUS IV', 'Sub', 'Open', 10000000, 45, 'teaming', 'P-1', 'Data analytics | Research support', 'LMI', 'Track LMI paperwork receipt', 'LMI adding rockITdata | $10B ceiling through 6/2032', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'DHA OPMED PAE', 'DHA OPMED PAE', 'OPMED PAE', 'DHA', 'TBD', 'MTEC OTA', 'Prime', 'Open', 5000000, 30, 'gated', 'P-1', 'Operational medicine | Human performance', 'LMI, iHuman', 'Clear iHuman license', 'MTEC OTA | iHuman partnership gated', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'DHA Analytics Recompete', 'DHA Analytics Recompete', 'DHA Analytics', 'DHA', 'TBD', 'GSA MAS', 'Prime', 'WOSB', 8000000, 45, 'shaping', 'P-1', 'Data governance | Analytics | AMANDA Framework', 'LMI', 'Jack to start shaping', 'Kaihonua NHO 8(a) | MRDC contract ends Feb 2026', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'OASIS+ SB Phase II', 'OASIS+ SB Phase II', 'OASIS+ SB', 'GSA', 'N/A', 'OASIS+ SB', 'Prime', 'WOSB/SDVOSB', 0, 60, 'in_progress', 'P-1', 'Management & Advisory domain qualification', 'N/A', 'Complete J.P-3/J.P-6 forms', '27/36 credits | 9-credit gap', 'medium', NOW());

  -- ============================================
  -- P-2 PIPELINE
  -- ============================================
  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'VHA Womens Health QI', 'VHA Womens Health QI', 'VHA Womens QI', 'VA', 'TBD', 'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 10300000, 30, 'expiring', 'P-2', 'Quality improvement | Data analytics', 'A4V', 'Monitor for recompete', 'AGENT IDENTIFIED | $10.3M | Expiring 2026', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'VA AI Pilot Program', 'VA AI Pilot Program', 'VA AI Pilot', 'VA', 'TBD', 'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 6800000, 30, 'expiring', 'P-2', 'AI governance | Pilot program support', 'A4V', 'Monitor for recompete', 'AGENT IDENTIFIED | $6.8M | Expiring 2026', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'VA Contact Center Migration', 'VA Contact Center Migration', 'VA Contact Ctr', 'VA', 'TBD', 'TBD', 'Sub', 'Open', 20000000, 35, 'pipeline', 'P-2', 'Contact center AI | Cloud migration', 'LMI', 'Seth explore scope', 'LMI migrating 60 VA contact centers | 26/60 done', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'Veteran Crisis Line Support', 'Veteran Crisis Line Support', 'VCL Support', 'VA', 'TBD', 'TBD', 'Sub', 'Open', 10000000, 30, 'pipeline', 'P-2', 'Crisis line analytics | AI support', 'LMI', 'Explore workshare scope', 'LMI is prime | Analytics opportunity', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'VA OHT Support Recompete', 'VA OHT Support Recompete', 'VA OHT Recomp', 'VA', 'TBD', 'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 45000000, 20, 'unconfirmed', 'P-2', 'Program management | OHT transformation', 'A4V', 'Validate via direct outreach', 'NO CONFIRMED RFP | Aptive incumbent 65% rewin', 'low', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'Army H2FMS', 'Army H2FMS', 'Army H2FMS', 'Army', 'W81XWH-24-S-HPC1', 'MTEC OTA', 'Prime', 'Open', 8000000, 20, 'evaluation', 'P-2', 'Human performance | H2F analytics', 'LMI, iHuman', 'Await evaluation', 'White paper CLOSED 9/16/25 | iHuman gated', 'low', NOW());

  -- ============================================
  -- P-3 WATCH
  -- ============================================
  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'NAII AI Policy Assessment', 'NAII AI Policy Assessment', 'NAII AI Policy', 'VA', 'TBD', 'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 10000000, 10, 'not_found', 'P-3', 'AI governance | M-25-21 compliance', 'A4V', 'Monitor IHT 2.0 TOs', 'NO standalone procurement found', 'low', NOW());

  RAISE NOTICE 'SUCCESS: Seeded 17 opportunities + 35 labor categories for company %', v_company_id;

END $$;

-- ============================================
-- VERIFY
-- ============================================
SELECT 'Opportunities' AS table_name, COUNT(*) AS count FROM opportunities
UNION ALL
SELECT 'Labor Categories', COUNT(*) FROM labor_categories;

SELECT priority, name, agency, 
  CASE WHEN ceiling >= 1000000 THEN '$' || ROUND(ceiling/1000000.0, 1) || 'M' ELSE '$' || ceiling END AS value,
  pwin || '%' AS pwin, stage
FROM opportunities ORDER BY priority, pwin DESC;

SELECT family, level_name, bill_rate_low, bill_rate_high, gsa_lcat 
FROM labor_categories 
WHERE level BETWEEN 2 AND 5
ORDER BY family, level;
