-- ============================================
-- MISSIONPULSE SEED DATA
-- Run this AFTER missionpulse-schema.sql
-- ============================================

-- ============================================
-- 1. INSERT SAMPLE COMPANY
-- ============================================
INSERT INTO companies (
  id, 
  name, 
  domain,
  duns_number,
  cage_code,
  sam_uei,
  naics_codes,
  certifications,
  plan,
  max_users,
  max_opportunities,
  settings
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Mission Meets Tech',
  'missionmeetstech.com',
  '123456789',
  'ABC12',
  'XYZABC123DEF',
  ARRAY['541511', '541512', '541519', '518210'],
  ARRAY['SDVOSB', 'ISO 9001', 'ISO 27001', 'CMMI Level 3'],
  'enterprise',
  50,
  100,
  '{"theme": "dark", "brand_color": "#00E5FA"}'
);

-- ============================================
-- 2. INSERT SAMPLE OPPORTUNITIES
-- ============================================

-- Opportunity 1: DHA EHR Modernization (High Priority - Proposal Phase)
INSERT INTO opportunities (
  id,
  company_id,
  title,
  nickname,
  description,
  agency,
  sub_agency,
  solicitation_number,
  notice_id,
  contract_type,
  contract_vehicle,
  estimated_value,
  price_to_win,
  release_date,
  questions_due,
  proposal_due,
  period_of_performance,
  phase,
  pwin,
  fit_score,
  priority,
  go_no_go,
  go_no_go_date,
  go_no_go_rationale,
  tags
) VALUES (
  'aaaa1111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'Electronic Health Record Modernization Support Services',
  'DHA EHR Mod',
  'Comprehensive support for MHS GENESIS rollout including training, data migration, and clinical workflow optimization across 50+ Military Treatment Facilities.',
  'Department of Defense',
  'Defense Health Agency (DHA)',
  'HT0015-24-R-0089',
  'SAM-2024-DHA-0089',
  'IDIQ',
  'CIO-SP4',
  85000000.00,
  78500000.00,
  '2024-11-15',
  '2025-01-20',
  '2025-02-28',
  '5 years (1 base + 4 option years)',
  'proposal',
  72,
  88,
  'critical',
  'go',
  '2024-12-10',
  'Strong past performance with MHS systems, existing relationships with DHA leadership, competitive labor rates, and SDVOSB status provides 10% evaluation advantage.',
  ARRAY['healthcare-it', 'ehr', 'dha', 'mhs-genesis', 'clinical-informatics']
);

-- Opportunity 2: VA Claims Processing (Medium Priority - Pursuit Phase)
INSERT INTO opportunities (
  id,
  company_id,
  title,
  nickname,
  description,
  agency,
  sub_agency,
  solicitation_number,
  notice_id,
  contract_type,
  contract_vehicle,
  estimated_value,
  price_to_win,
  release_date,
  questions_due,
  proposal_due,
  period_of_performance,
  phase,
  pwin,
  fit_score,
  priority,
  go_no_go,
  tags
) VALUES (
  'bbbb2222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Veterans Benefits Claims Processing Automation',
  'VA Claims AI',
  'AI/ML solution to reduce claims processing backlog through intelligent document processing, automated eligibility determination, and predictive analytics for appeals.',
  'Department of Veterans Affairs',
  'Veterans Benefits Administration (VBA)',
  'VA-VBA-25-Q-0156',
  'SAM-2025-VA-0156',
  'FFP',
  'T4NG2',
  42000000.00,
  38000000.00,
  '2025-01-10',
  '2025-03-15',
  '2025-04-30',
  '3 years (1 base + 2 option years)',
  'pursuit',
  58,
  75,
  'high',
  'pending',
  ARRAY['ai-ml', 'automation', 'va', 'claims-processing', 'rpa']
);

-- Opportunity 3: CMS Data Analytics (Lower Priority - Opportunity Phase)
INSERT INTO opportunities (
  id,
  company_id,
  title,
  nickname,
  description,
  agency,
  sub_agency,
  solicitation_number,
  contract_type,
  contract_vehicle,
  estimated_value,
  release_date,
  proposal_due,
  period_of_performance,
  phase,
  pwin,
  fit_score,
  priority,
  go_no_go,
  tags
) VALUES (
  'cccc3333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Medicare & Medicaid Data Analytics Platform',
  'CMS Analytics',
  'Enterprise data platform for population health analytics, fraud detection, and quality measure reporting across Medicare and Medicaid programs.',
  'Department of Health and Human Services',
  'Centers for Medicare & Medicaid Services (CMS)',
  'CMS-OAGM-25-R-0234',
  'T&M',
  'GSA MAS',
  28000000.00,
  '2025-02-01',
  '2025-06-15',
  '4 years (1 base + 3 option years)',
  'opportunity',
  45,
  68,
  'medium',
  'pending',
  ARRAY['data-analytics', 'cms', 'healthcare', 'population-health', 'fraud-detection']
);

-- Opportunity 4: IHS Telehealth (New - Opportunity Phase)
INSERT INTO opportunities (
  id,
  company_id,
  title,
  nickname,
  description,
  agency,
  sub_agency,
  solicitation_number,
  contract_type,
  estimated_value,
  release_date,
  proposal_due,
  period_of_performance,
  phase,
  pwin,
  fit_score,
  priority,
  go_no_go,
  tags
) VALUES (
  'dddd4444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'Indian Health Service Telehealth Expansion Program',
  'IHS Telehealth',
  'Deploy and support telehealth infrastructure across 170+ IHS facilities in rural and tribal communities, including equipment, training, and 24/7 technical support.',
  'Department of Health and Human Services',
  'Indian Health Service (IHS)',
  'IHS-ITG-25-RFP-0078',
  'CPFF',
  18500000.00,
  '2025-03-01',
  '2025-07-31',
  '5 years (1 base + 4 option years)',
  'opportunity',
  35,
  62,
  'low',
  'pending',
  ARRAY['telehealth', 'ihs', 'rural-health', 'tribal', 'infrastructure']
);

-- Opportunity 5: SSA IT Modernization (Submitted - Awaiting Award)
INSERT INTO opportunities (
  id,
  company_id,
  title,
  nickname,
  description,
  agency,
  sub_agency,
  solicitation_number,
  contract_type,
  estimated_value,
  price_to_win,
  release_date,
  questions_due,
  proposal_due,
  award_date,
  period_of_performance,
  phase,
  pwin,
  fit_score,
  priority,
  go_no_go,
  go_no_go_date,
  go_no_go_rationale,
  tags
) VALUES (
  'eeee5555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'Social Security Administration Legacy System Modernization',
  'SSA Legacy Mod',
  'Modernize COBOL-based disability determination systems to cloud-native microservices architecture using DevSecOps practices.',
  'Social Security Administration',
  'Office of Systems',
  'SSA-RFP-24-0045',
  'FFP',
  55000000.00,
  51000000.00,
  '2024-06-15',
  '2024-08-30',
  '2024-10-15',
  '2025-02-28',
  '5 years (1 base + 4 option years)',
  'submitted',
  65,
  82,
  'high',
  'go',
  '2024-07-20',
  'Strong COBOL modernization experience, competitive pricing through offshore development center, and existing FISMA-compliant cloud infrastructure.',
  ARRAY['modernization', 'ssa', 'cobol', 'cloud-native', 'devsecops']
);

-- Opportunity 6: Previously Won Contract (For Win/Loss Analytics)
INSERT INTO opportunities (
  id,
  company_id,
  title,
  nickname,
  description,
  agency,
  sub_agency,
  solicitation_number,
  contract_type,
  estimated_value,
  price_to_win,
  release_date,
  proposal_due,
  award_date,
  period_of_performance,
  phase,
  pwin,
  fit_score,
  priority,
  go_no_go,
  outcome,
  outcome_date,
  outcome_notes,
  tags
) VALUES (
  'ffff6666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  'DHA Clinical Decision Support Implementation',
  'DHA CDS',
  'Implement clinical decision support tools across 25 Military Treatment Facilities to improve patient safety and reduce diagnostic errors.',
  'Department of Defense',
  'Defense Health Agency (DHA)',
  'HT0015-23-R-0156',
  'IDIQ',
  32000000.00,
  29500000.00,
  '2023-08-01',
  '2023-11-15',
  '2024-02-28',
  '4 years (1 base + 3 option years)',
  'awarded',
  78,
  92,
  'high',
  'go',
  'won',
  '2024-02-28',
  'Won on technical superiority and past performance. Price was competitive but not lowest. Debrief noted our clinical informaticist approach was key discriminator.',
  ARRAY['healthcare-it', 'cds', 'dha', 'patient-safety', 'clinical-informatics']
);

-- ============================================
-- 3. INSERT SAMPLE COMPLIANCE REQUIREMENTS (For DHA EHR)
-- ============================================

INSERT INTO compliance_requirements (opportunity_id, company_id, requirement_id, requirement_text, source_section, requirement_type, evaluation_factor, priority)
VALUES 
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'L.3.1.a', 'The contractor shall demonstrate experience with MHS GENESIS implementation at 3+ MTFs within the past 5 years.', 'Section L', 'shall', 'Technical Approach', 'critical'),
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'L.3.1.b', 'The contractor shall provide a detailed staffing plan including clinical informaticists with CPHI or equivalent certification.', 'Section L', 'shall', 'Technical Approach', 'high'),
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'L.3.2.a', 'The contractor shall describe their approach to training at least 500 clinical staff per MTF within 90 days of go-live.', 'Section L', 'shall', 'Management', 'high'),
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'M.2.1', 'Technical Approach will be evaluated on understanding of MHS GENESIS architecture and interoperability requirements.', 'Section M', 'will', 'Technical Approach', 'critical'),
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'M.2.2', 'Past Performance will be evaluated for relevance, quality, and recency of healthcare IT implementations.', 'Section M', 'will', 'Past Performance', 'high'),
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'M.3.1', 'Price evaluation will consider total evaluated price including all CLINs and option years.', 'Section M', 'will', 'Price', 'medium');

-- ============================================
-- 4. INSERT SAMPLE LESSONS LEARNED
-- ============================================

INSERT INTO lessons_learned (company_id, opportunity_id, title, category, content, agency, tags, rating, is_approved)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'ffff6666-6666-6666-6666-666666666666', 'Clinical Informaticist Discriminator', 'discriminator', 'Embedding board-certified clinical informaticists (CPHI) directly into implementation teams was cited by DHA as a key differentiator. They specifically valued having clinicians who could bridge the gap between technical implementation and clinical workflows.', 'DHA', ARRAY['clinical-informatics', 'staffing', 'discriminator'], 5, true),
  ('11111111-1111-1111-1111-111111111111', 'ffff6666-6666-6666-6666-666666666666', 'MTF Champion Network Win Theme', 'win_theme', 'Our proposal highlighted establishing a "Champion Network" of super-users at each MTF before go-live. This proactive change management approach directly addressed DHA concerns about user adoption.', 'DHA', ARRAY['change-management', 'training', 'win-theme'], 5, true),
  ('11111111-1111-1111-1111-111111111111', NULL, 'SDVOSB Evaluation Advantage', 'proof_point', 'When competing on contracts with SDVOSB evaluation preference, our status provides approximately 10% price advantage in best-value tradeoffs. Always calculate price-to-win accounting for this factor.', 'DHA', ARRAY['sdvosb', 'pricing', 'small-business'], 4, true);

-- ============================================
-- SEED DATA COMPLETE
-- ============================================
-- Company: 1
-- Opportunities: 6
-- Compliance Requirements: 6
-- Lessons Learned: 3
