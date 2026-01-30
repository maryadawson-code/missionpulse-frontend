-- =============================================
-- PART 2: CREATE COMPANY AND SEED OPPORTUNITIES
-- Run this AFTER Part 1 completes successfully
-- =============================================

-- Create companies table if not exists
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create/get company and seed data
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
    RAISE NOTICE 'Created company with ID: %', v_company_id;
  ELSE
    RAISE NOTICE 'Using existing company ID: %', v_company_id;
  END IF;

  -- Update user's company
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET company_id = v_company_id WHERE id = v_user_id;
    RAISE NOTICE 'Updated user profile with company_id';
  END IF;

  -- Clear existing opportunities for this company
  DELETE FROM opportunities WHERE company_id = v_company_id;
  
  -- Also clear any NULL company opportunities
  DELETE FROM opportunities WHERE company_id IS NULL;

  RAISE NOTICE 'Cleared old opportunities. Now inserting 17 new ones...';

  -- P-0 MUST WIN
  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'DHA Data Governance', 'DHA Data Governance', 'DHA Data Gov', 'DHA', 'TBD', 'GSA MAS', 'Prime', 'WOSB', 2300000, 70, 'submitted', 'P-0', 'Zero-footprint architecture | $560K savings vs COTS', 'LMI', 'Prep oral presentation', 'Submitted per FAR 15.208(b)(1) | Escalation email damaged CO relationship', 'high', NOW());

  -- P-1 HIGH PRIORITY (10)
  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'DHA EIDS AOI 4 Data Apps', 'DHA EIDS AOI 4 Data Apps', 'EIDS AOI 4', 'DHA', 'HT0038-25-S-C001', 'OTA/CSO', 'Prime', 'Open', 3000000, 45, 'submitted', 'P-1', 'AMANDA Framework | AI/ML data applications', 'LMI', 'Await Phase I down-select', 'Rolling submissions through 7/1/26', 'high', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'VA OIP Task Order', 'VA OIP Task Order', 'VA OIP TO', 'VA', 'VA-25-00009735', 'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 4000000, 50, 'submitted', 'P-1', 'MHS GENESIS/Oracle Health expertise | SAFe delivery', 'A4V (HRS, Oxford, 4th Sector)', 'Schedule strategy call with Paul DeYoung', 'SAC VA-25-00009735 | 78 staff proposed | FFP Feature-based', 'high', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'VA IHT 2.0 General TOs', 'VA IHT 2.0 General TOs', 'IHT 2.0 TOs', 'VA', '36C10X25D0017', 'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 1400000000, 35, 'monitoring', 'P-1', 'Health informatics | Data governance', 'A4V', 'Daily SAM.gov monitoring', '$14B ceiling | Arrow Arc/Aptive PRIMARY THREAT', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'VA Suicide Prevention Analytics', 'VA Suicide Prevention Analytics', 'VA Suicide Prev', 'VA', 'TBD', 'TBD', 'Sub', 'Open', 5000000, 55, 'shaping', 'P-1', 'Program evaluation | Data analytics', 'LMI', 'Seth connect with Patrick team', 'Dr. Burnett DIRECTLY asked LMI for help (1/17/26)', 'high', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'DHA MHS GENESIS Post-Deploy', 'DHA MHS GENESIS Post-Deploy', 'MHS GENESIS Post', 'DHA', 'TBD', 'GSA MAS / OASIS+', 'Prime', 'WOSB', 8000000, 35, 'shaping', 'P-1', 'Adoption-First Methodology', 'LMI', 'Monitor draft RFP release', 'Documentation RFI Nov 2024 | CSO expected Q1 FY26', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'DHA OMNIBUS IV Task Orders', 'DHA OMNIBUS IV Task Orders', 'OMNIBUS IV TOs', 'DHA', 'Various', 'OMNIBUS IV', 'Sub', 'Open', 10000000, 45, 'teaming', 'P-1', 'Data analytics | Research support', 'LMI', 'Track LMI paperwork receipt', 'LMI adding rockITdata | $10B ceiling through 6/2032', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'DHA OPMED PAE', 'DHA OPMED PAE', 'OPMED PAE', 'DHA', 'TBD', 'MTEC OTA', 'Prime', 'Open', 5000000, 30, 'gated', 'P-1', 'Operational medicine | Human performance', 'LMI, iHuman', 'Clear iHuman license', 'MTEC OTA | iHuman partnership gated', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'DHA Analytics Recompete', 'DHA Analytics Recompete', 'DHA Analytics', 'DHA', 'TBD', 'GSA MAS', 'Prime', 'WOSB', 8000000, 45, 'shaping', 'P-1', 'Data governance | Analytics', 'LMI', 'Jack to start shaping', 'Kaihonua NHO 8(a) | MRDC ends Feb 2026', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'OASIS+ SB Phase II', 'OASIS+ SB Phase II', 'OASIS+ SB', 'GSA', 'N/A', 'OASIS+ SB', 'Prime', 'WOSB/SDVOSB', 0, 60, 'in_progress', 'P-1', 'Management & Advisory domain qualification', 'N/A', 'Complete J.P-3/J.P-6 forms', '27/36 credits | 9-credit gap', 'medium', NOW());

  -- P-2 PIPELINE (6)
  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'VHA Womens Health QI', 'VHA Womens Health QI', 'VHA Womens QI', 'VA', 'TBD', 'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 10300000, 30, 'expiring', 'P-2', 'Quality improvement | Data analytics', 'A4V', 'Monitor for recompete', 'AGENT IDENTIFIED | $10.3M | Expiring 2026', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'VA AI Pilot Program', 'VA AI Pilot Program', 'VA AI Pilot', 'VA', 'TBD', 'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 6800000, 30, 'expiring', 'P-2', 'AI governance | Pilot program support', 'A4V', 'Monitor for recompete', 'AGENT IDENTIFIED | $6.8M | Expiring 2026', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'VA Contact Center Migration', 'VA Contact Center Migration', 'VA Contact Ctr', 'VA', 'TBD', 'TBD', 'Sub', 'Open', 20000000, 35, 'pipeline', 'P-2', 'Contact center AI | Cloud migration', 'LMI', 'Seth explore scope', 'LMI migrating 60 VA contact centers', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'Veteran Crisis Line Support', 'Veteran Crisis Line Support', 'VCL Support', 'VA', 'TBD', 'TBD', 'Sub', 'Open', 10000000, 30, 'pipeline', 'P-2', 'Crisis line analytics | AI support', 'LMI', 'Explore workshare scope', 'LMI is prime', 'medium', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'VA OHT Support Recompete', 'VA OHT Support Recompete', 'VA OHT Recomp', 'VA', 'TBD', 'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 45000000, 20, 'unconfirmed', 'P-2', 'Program management | OHT transformation', 'A4V', 'Validate via direct outreach', 'NO CONFIRMED RFP | Aptive incumbent', 'low', NOW());

  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'Army H2FMS', 'Army H2FMS', 'Army H2FMS', 'Army', 'W81XWH-24-S-HPC1', 'MTEC OTA', 'Prime', 'Open', 8000000, 20, 'evaluation', 'P-2', 'Human performance | H2F analytics', 'LMI, iHuman', 'Await evaluation', 'White paper CLOSED 9/16/25', 'low', NOW());

  -- P-3 WATCH (1)
  INSERT INTO opportunities (id, company_id, name, title, nickname, agency, solicitation_number, contract_vehicle, role, set_aside, ceiling, pwin, stage, priority, win_themes, teaming_partners, next_action, key_intel, confidence, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'NAII AI Policy Assessment', 'NAII AI Policy Assessment', 'NAII AI Policy', 'VA', 'TBD', 'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 10000000, 10, 'not_found', 'P-3', 'AI governance | M-25-21 compliance', 'A4V', 'Monitor IHT 2.0 TOs', 'NO standalone procurement found', 'low', NOW());

  RAISE NOTICE 'SUCCESS: Inserted 17 opportunities for company %', v_company_id;

END $$;

-- Verify
SELECT priority, name, agency, ceiling, pwin, stage FROM opportunities ORDER BY priority, pwin DESC;
