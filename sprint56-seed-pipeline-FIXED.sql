-- Sprint 56: Seed Pipeline Data for Mission Meets Tech Beta (FIXED)
-- Run this in Supabase SQL Editor
-- This version adds missing columns before seeding

-- ============================================
-- STEP 1: Add missing columns to opportunities table
-- ============================================
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS solicitation_number TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS contract_vehicle TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS set_aside TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS win_themes TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS teaming_partners TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS key_intel TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS confidence TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS pwin INTEGER;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS ceiling BIGINT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS stage TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS agency TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS nickname TEXT;

-- ============================================
-- STEP 2: Create companies table if not exists
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: Clear old data and seed new opportunities
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

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User maryadawson@gmail.com not found - creating company without user link';
  END IF;

  -- Get or create company
  SELECT id INTO v_company_id FROM companies WHERE name = 'Mission Meets Tech' LIMIT 1;
  
  IF v_company_id IS NULL THEN
    INSERT INTO companies (id, name, domain) 
    VALUES (gen_random_uuid(), 'Mission Meets Tech', 'missionmeetstech.com')
    RETURNING id INTO v_company_id;
    RAISE NOTICE 'Created company Mission Meets Tech with ID: %', v_company_id;
  END IF;

  -- Update user's company if user exists
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET company_id = v_company_id WHERE id = v_user_id;
  END IF;

  -- Clear existing opportunities for this company
  DELETE FROM opportunities WHERE company_id = v_company_id;
  
  -- Also clear any opportunities without company_id (legacy data)
  DELETE FROM opportunities WHERE company_id IS NULL;

  -- ============================================
  -- P-0 MUST WIN (1 opportunity)
  -- ============================================

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'DHA Data Governance', 'DHA Data Gov', 'DHA', 'TBD',
    'GSA MAS', 'Prime', 'WOSB', 2300000, 70, 'submitted',
    'P-0', 'Zero-footprint architecture | $560K savings vs COTS', 'LMI', 'Prep oral presentation',
    'Submitted per FAR 15.208(b)(1) | Escalation email damaged CO relationship | Kevin Clay on Platform One team', 'high', NOW()
  );

  -- ============================================
  -- P-1 HIGH PRIORITY (10 opportunities)
  -- ============================================

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'DHA EIDS AOI 4 Data Apps', 'EIDS AOI 4', 'DHA', 'HT0038-25-S-C001',
    'OTA/CSO', 'Prime', 'Open', 3000000, 45, 'submitted',
    'P-1', 'AMANDA Framework | AI/ML data applications', 'LMI', 'Await Phase I down-select',
    'Rolling submissions through 7/1/26 | Phase I down-select pending', 'high', NOW()
  );

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'VA OIP Task Order', 'VA OIP TO', 'VA', 'VA-25-00009735',
    'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 4000000, 50, 'submitted',
    'P-1', 'MHS GENESIS/Oracle Health expertise | SAFe delivery | Dual DoD/VA clinical informatics', 'A4V (HRS, Oxford, 4th Sector)', 'Schedule strategy call with Paul DeYoung (A4V)',
    'SAC VA-25-00009735 | PWS Oct 2025 | Clinical informatics for Oracle Health/VistA | 78 staff proposed | FFP Feature-based | SAFe methodology', 'high', NOW()
  );

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'VA IHT 2.0 General TOs', 'IHT 2.0 TOs', 'VA', '36C10X25D0017',
    'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 1400000000, 35, 'monitoring',
    'P-1', 'Health informatics | Data governance | Analytics', 'A4V (HRS, Oxford, 4th Sector)', 'Daily SAM.gov monitoring (36C10X25D00XX)',
    '$14B ceiling (Aug 2025-2035) | 61 capability areas | Arrow Arc/Aptive PRIMARY THREAT (91% of IHT 1.0 $804M)', 'medium', NOW()
  );

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'VA Suicide Prevention Analytics', 'VA Suicide Prev', 'VA', 'TBD',
    'TBD', 'Sub', 'Open', 5000000, 55, 'shaping',
    'P-1', 'Program evaluation | Data analytics | AMANDA Framework', 'LMI', 'Seth connect with Patrick team',
    'Dr. Burnett DIRECTLY asked LMI for help (1/17/26) | Program evaluation + data challenges | NOT secondhand intel', 'high', NOW()
  );

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'DHA MHS GENESIS Post-Deploy', 'MHS GENESIS Post', 'DHA', 'TBD',
    'GSA MAS / OASIS+', 'Prime', 'WOSB', 8000000, 35, 'shaping',
    'P-1', 'Adoption-First Methodology | MHS GENESIS experience', 'LMI', 'Monitor draft RFP release',
    'MHS GENESIS Documentation RFI (Nov 2024) | Customer Care Prototyping CSO expected Q1 FY26', 'medium', NOW()
  );

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'DHA OMNIBUS IV Task Orders', 'OMNIBUS IV TOs', 'DHA', 'Various',
    'OMNIBUS IV', 'Sub', 'Open', 10000000, 45, 'teaming',
    'P-1', 'Data analytics | Research support | Translational science', 'LMI', 'Track receipt of LMI paperwork',
    'LMI sending paperwork to add rockITdata | $10B ceiling through 6/2032 | 51 TOs awarded (>$600M)', 'medium', NOW()
  );

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'DHA OPMED PAE', 'OPMED PAE', 'DHA', 'TBD',
    'MTEC OTA', 'Prime', 'Open', 5000000, 30, 'gated',
    'P-1', 'Operational medicine | Human performance', 'LMI, iHuman', 'Clear iHuman license + federal exclusivity',
    'MTEC OTA | Blood Donor window CLOSED 1/30/26 | FY26 Multi-Topic RPP expected | iHuman partnership gated', 'medium', NOW()
  );

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'DHA Analytics Recompete', 'DHA Analytics', 'DHA', 'TBD',
    'GSA MAS', 'Prime', 'WOSB', 8000000, 45, 'shaping',
    'P-1', 'Data governance | Analytics | AMANDA Framework', 'LMI', 'Jack to start shaping; verify contract details',
    'Kaihonua is NHO 8(a) - status unclear | Jack to shape with LMI | MRDC contract ends Feb 2026', 'medium', NOW()
  );

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'OASIS+ SB Phase II', 'OASIS+ SB', 'GSA', 'N/A',
    'OASIS+ SB', 'Prime', 'WOSB/SDVOSB', 0, 60, 'in_progress',
    'P-1', 'Management & Advisory domain qualification', 'N/A', 'Complete J.P-3/J.P-6 forms to close 9-credit gap',
    '27/36 credits | 9-credit gap | PGDMA DHA needs J.P-3 | Merck/AbbVie need J.P-3 + J.P-6', 'medium', NOW()
  );

  -- ============================================
  -- P-2 PIPELINE (6 opportunities)
  -- ============================================

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'VHA Womens Health QI', 'VHA Womens QI', 'VA', 'TBD',
    'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 10300000, 30, 'expiring',
    'P-2', 'Quality improvement | Data analytics | Womens health', 'A4V', 'Monitor for recompete; validate scope fit',
    'AGENT IDENTIFIED | $10.3M TCV | 4 bidders on original | HIGH rockITdata fit | Expiring 2026', 'medium', NOW()
  );

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'VA AI Pilot Program', 'VA AI Pilot', 'VA', 'TBD',
    'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 6800000, 30, 'expiring',
    'P-2', 'AI governance | Pilot program support | AMANDA Framework', 'A4V', 'Monitor for recompete; AI governance scope',
    'AGENT IDENTIFIED | $6.8M TCV | 3 bidders on original | HIGH rockITdata fit | Expiring 2026', 'medium', NOW()
  );

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'VA Contact Center Migration', 'VA Contact Ctr', 'VA', 'TBD',
    'TBD', 'Sub', 'Open', 20000000, 35, 'pipeline',
    'P-2', 'Contact center AI | TRICARE experience | Cloud migration', 'LMI', 'Seth explore scope with Patrick team',
    'LMI migrating ALL 60 VA contact centers to Genesis platform | 26/60 done | Eddie Poole sponsors', 'medium', NOW()
  );

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'Veteran Crisis Line Support', 'VCL Support', 'VA', 'TBD',
    'TBD', 'Sub', 'Open', 10000000, 30, 'pipeline',
    'P-2', 'Crisis line analytics | AI support | Veteran care', 'LMI', 'Explore workshare scope with LMI',
    'LMI is prime | Analytics + AI support opportunity', 'medium', NOW()
  );

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'VA OHT Support Recompete', 'VA OHT Recomp', 'VA', 'TBD',
    'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 45000000, 20, 'unconfirmed',
    'P-2', 'Program management | OHT transformation | PACT Act', 'A4V', 'Direct outreach to validate; contact OHT program office',
    'DOWNGRADED: Agent found NO CONFIRMED RFP | $45M TCV UNVERIFIED | Aptive incumbent (65% rewin)', 'low', NOW()
  );

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'Army H2FMS', 'Army H2FMS', 'Army', 'W81XWH-24-S-HPC1',
    'MTEC OTA', 'Prime', 'Open', 8000000, 20, 'evaluation',
    'P-2', 'Human performance | H2F analytics | AMANDA Framework', 'LMI, iHuman', 'Sean map vehicle options; await eval',
    'White paper window CLOSED 9/16/25 | In evaluation | iHuman partnership gated', 'low', NOW()
  );

  -- ============================================
  -- P-3 WATCH (1 opportunity)
  -- ============================================

  INSERT INTO opportunities (
    id, company_id, title, nickname, agency, solicitation_number,
    contract_vehicle, role, set_aside, ceiling, pwin, stage,
    priority, win_themes, teaming_partners, next_action, 
    key_intel, confidence, created_at
  ) VALUES (
    gen_random_uuid(), v_company_id, 
    'NAII AI Policy Assessment', 'NAII AI Policy', 'VA', 'TBD',
    'IHT 2.0 IDIQ', 'Sub', 'SDVOSB', 10000000, 10, 'not_found',
    'P-3', 'AI governance | M-25-21 compliance | Policy assessment', 'A4V', 'Monitor IHT 2.0 TOs with AI scope',
    'DOWNGRADED: Agent found NO standalone procurement | AI work appears EMBEDDED in existing contracts', 'low', NOW()
  );

  RAISE NOTICE 'SUCCESS: Inserted 17 opportunities for Mission Meets Tech (company_id: %)', v_company_id;

END $$;

-- ============================================
-- VERIFY SEED DATA
-- ============================================
SELECT 
  priority,
  title,
  agency,
  CASE 
    WHEN ceiling >= 1000000000 THEN '$' || ROUND(ceiling/1000000000.0, 1) || 'B'
    WHEN ceiling >= 1000000 THEN '$' || ROUND(ceiling/1000000.0, 1) || 'M'
    WHEN ceiling >= 1000 THEN '$' || ROUND(ceiling/1000.0, 0) || 'K'
    WHEN ceiling > 0 THEN '$' || ceiling
    ELSE 'TBD'
  END AS value,
  pwin || '%' AS win_prob,
  stage,
  confidence
FROM opportunities 
ORDER BY priority, pwin DESC;
