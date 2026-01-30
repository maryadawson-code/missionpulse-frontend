-- ============================================================
-- MissionPulse v12 Production Database Seed
-- Rich demo data for investor demonstrations
-- © 2026 Mission Meets Tech
-- ============================================================

-- First, ensure tables exist with correct schema
-- Run this in Supabase SQL Editor

-- ============================================================
-- TABLE: opportunities (Pipeline, War Room, Dashboard)
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  agency TEXT NOT NULL,
  contract_value NUMERIC DEFAULT 0,
  priority TEXT DEFAULT 'P-1',
  shipley_phase TEXT DEFAULT 'qualify',
  win_probability INTEGER DEFAULT 50,
  due_date DATE,
  solicitation_number TEXT,
  description TEXT,
  contract_type TEXT,
  set_aside TEXT,
  naics_code TEXT,
  primary_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clear existing data
DELETE FROM opportunities;

-- Insert rich demo opportunities
INSERT INTO opportunities (name, agency, contract_value, priority, shipley_phase, win_probability, due_date, solicitation_number, description, set_aside, naics_code) VALUES
  ('DHA MHS GENESIS Cloud Migration', 'DHA', 98450210, 'P-0', 'pink_team', 72, '2026-03-01', 'HT0011-26-R-0042', 'Enterprise cloud migration and modernization for MHS GENESIS health records system', '8(a)', '541512'),
  ('VA Enterprise Claims Modernization', 'VA', 67500000, 'P-1', 'blue_team', 58, '2026-04-15', 'VA118A-26-R-0187', 'AI-powered claims processing and veteran benefits automation platform', 'SDVOSB', '541519'),
  ('CMS Quality Analytics Platform', 'CMS', 125000000, 'P-0', 'red_team', 68, '2026-02-15', 'CMS-26-R-0034', 'Real-time healthcare quality metrics and predictive analytics dashboard', 'Full & Open', '541512'),
  ('IHS Telehealth Expansion', 'IHS', 32000000, 'P-1', 'capture', 55, '2026-06-30', 'IHS-RFP-2026-088', 'Rural and tribal telehealth infrastructure deployment', 'ISBEE', '541511'),
  ('SSA Fraud Detection ML Platform', 'SSA', 89000000, 'P-0', 'gold_team', 81, '2026-02-05', 'SSA-RFP-26-4421', 'Machine learning fraud detection and identity verification system', '8(a)', '541512'),
  ('CDC Disease Surveillance System', 'CDC', 78000000, 'P-2', 'qualify', 42, '2026-08-01', 'CDC-26-SOL-0099', 'Real-time disease outbreak detection and reporting infrastructure', 'Full & Open', '541519'),
  ('NIH Research Data Platform', 'NIH', 45000000, 'P-1', 'blue_team', 61, '2026-05-15', 'NIH-RFP-26-2244', 'Federated research data sharing and collaboration platform', 'Small Business', '541511'),
  ('HRSA Health Center Support', 'HRSA', 23000000, 'P-2', 'qualify', 48, '2026-07-30', 'HRSA-26-R-0156', 'Community health center IT modernization and EHR integration', 'WOSB', '541512'),
  ('FDA Drug Safety Analytics', 'FDA', 56000000, 'P-1', 'capture', 52, '2026-06-01', 'FDA-26-RFQ-0078', 'Post-market drug safety surveillance and adverse event analytics', '8(a)', '541519'),
  ('SAMHSA Treatment Locator', 'SAMHSA', 18500000, 'P-2', 'qualify', 45, '2026-09-15', 'SAMHSA-26-R-0033', 'Substance abuse treatment facility locator and outcomes tracking', 'SDVOSB', '541511'),
  ('ACF Child Welfare System', 'ACF', 34000000, 'P-1', 'blue_team', 57, '2026-05-30', 'ACF-26-RFP-0145', 'Child welfare case management and family services platform', 'Small Business', '541512'),
  ('AHRQ Healthcare Quality Research', 'AHRQ', 21000000, 'P-2', 'qualify', 44, '2026-08-15', 'AHRQ-26-R-0089', 'Healthcare quality research data repository and analytics tools', 'Full & Open', '541519');

-- ============================================================
-- TABLE: competitors (Black Hat Module)
-- ============================================================
CREATE TABLE IF NOT EXISTS competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  threat_level TEXT DEFAULT 'medium',
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  ghost_strategy TEXT,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM competitors;

INSERT INTO competitors (company_name, threat_level, strengths, weaknesses, ghost_strategy) VALUES
  ('Booz Allen Hamilton', 'high', 
   ARRAY['Incumbent on 3 related contracts', 'Deep bench of 500+ cleared staff', 'Existing DHA relationships', 'Strong past performance'],
   ARRAY['Premium pricing (15-20% above market)', 'Slow to adopt new technologies', 'High staff turnover', 'Bureaucratic decision-making'],
   'Emphasize our agility and modern tech stack. Highlight their 2024 GAO protest loss on similar work. Ghost their "big company overhead" in pricing discussions.'),
  
  ('Deloitte Federal', 'high',
   ARRAY['Brand recognition', 'Healthcare consulting expertise', 'Global delivery capabilities', 'Strong lobbying presence'],
   ARRAY['Known for cost overruns', 'High subcontractor dependency', 'Limited SDVOSB partnerships', 'Recent VA contract performance issues'],
   'Reference their 2025 VA EHRM delays. Emphasize our direct delivery model vs their heavy subcontracting. Highlight socioeconomic commitment.'),
  
  ('GDIT (General Dynamics IT)', 'high',
   ARRAY['Technical depth in infrastructure', 'Strong clearance pipeline', 'DoD relationship depth', 'CMMC Level 3 certified'],
   ARRAY['Integration challenges from Vencore merger', 'Communication issues with customers', 'Less healthcare-specific expertise', 'Recent layoffs affecting continuity'],
   'Focus on our healthcare-first expertise. Ghost their merger integration challenges. Emphasize our key personnel stability.'),
  
  ('Leidos', 'medium',
   ARRAY['Scale and resources', 'Strong analytics capabilities', 'Diverse contract portfolio', 'Good past performance ratings'],
   ARRAY['Spread thin across too many contracts', 'Key personnel retention issues', 'Less agile than smaller competitors', 'Premium pricing tier'],
   'Highlight our focused healthcare mission. Reference their stretched resources. Emphasize dedicated team commitment.'),
  
  ('Accenture Federal', 'medium',
   ARRAY['Digital transformation expertise', 'Global innovation resources', 'Strong commercial healthcare background', 'Change management capabilities'],
   ARRAY['Federal experience gaps', 'High rates for senior consultants', 'Limited cleared workforce', 'Cultural fit with government clients'],
   'Emphasize our federal-first DNA. Ghost their commercial mindset. Highlight our cleared workforce advantage.'),
  
  ('ICF', 'medium',
   ARRAY['HHS agency relationships', 'Public health expertise', 'Strong analytics practice', 'Good small business teaming'],
   ARRAY['Limited IT modernization depth', 'Smaller scale for large programs', 'Key personnel constraints', 'Geographic concentration'],
   'Position our IT modernization strength. Emphasize our scalability. Highlight our distributed workforce model.'),
  
  ('Maximus', 'low',
   ARRAY['CMS experience', 'Contact center expertise', 'Citizen services focus', 'Cost-effective delivery'],
   ARRAY['Less technical depth', 'BPO focus vs technology', 'Limited cloud expertise', 'Past FEHB processing issues'],
   'Differentiate on technical innovation. Emphasize our cloud-native approach. Avoid direct BPO competition.'),
  
  ('CACI', 'medium',
   ARRAY['Intelligence community strength', 'Agile development capabilities', 'Good acquisition integration', 'Strong program management'],
   ARRAY['Less healthcare visibility', 'Intel-focused culture', 'Pricing competitiveness varies', 'Key personnel availability'],
   'Leverage our healthcare specialization. Emphasize our mission-focused culture. Highlight our pricing discipline.');

-- ============================================================
-- TABLE: partners (Frenemy Protocol)
-- ============================================================
CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_name TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  capabilities TEXT[] DEFAULT '{}',
  trust_score INTEGER DEFAULT 75,
  socioeconomic_status TEXT,
  contact_email TEXT,
  assigned_opportunities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM partners;

INSERT INTO partners (partner_name, status, capabilities, trust_score, socioeconomic_status, contact_email, assigned_opportunities) VALUES
  ('CloudFirst Solutions', 'Active', 
   ARRAY['AWS Advanced Partner', 'Azure Expert MSP', 'GCP Partner', 'FedRAMP Consulting'],
   92, 'SDVOSB', 'partnerships@cloudfirst.com',
   ARRAY['DHA MHS GENESIS', 'VA Enterprise Claims']),
  
  ('DataSecure Inc', 'Active',
   ARRAY['Cybersecurity', 'FedRAMP Authorization', 'CMMC Assessment', 'Zero Trust Architecture'],
   88, '8(a)', 'bd@datasecure.com',
   ARRAY['CMS Quality Analytics', 'SSA Fraud Detection']),
  
  ('HealthTech Partners', 'Pending',
   ARRAY['EHR Integration', 'HL7 FHIR', 'Telehealth Platforms', 'Clinical Workflows'],
   75, 'WOSB', 'team@healthtechpartners.com',
   ARRAY[]::TEXT[]),
  
  ('Cipher Analytics', 'Active',
   ARRAY['Machine Learning', 'NLP/NLU', 'Predictive Analytics', 'Data Science'],
   85, 'Small Business', 'contact@cipheranalytics.ai',
   ARRAY['SSA Fraud Detection', 'FDA Drug Safety']),
  
  ('SecureStack Federal', 'Active',
   ARRAY['DevSecOps', 'Container Security', 'CI/CD Pipelines', 'Infrastructure as Code'],
   90, 'SDVOSB', 'federal@securestack.io',
   ARRAY['DHA MHS GENESIS', 'NIH Research Data']),
  
  ('TribeNet Technologies', 'Pending',
   ARRAY['Tribal Healthcare IT', 'Rural Connectivity', 'Telehealth Infrastructure', 'IHS Experience'],
   70, 'ISBEE', 'partnerships@tribenet.org',
   ARRAY['IHS Telehealth']),
  
  ('Compliance Bridge', 'Active',
   ARRAY['HIPAA Compliance', 'FedRAMP Documentation', 'Security Assessments', 'ATO Support'],
   87, '8(a)', 'team@compliancebridge.com',
   ARRAY['CMS Quality Analytics', 'FDA Drug Safety']);

-- ============================================================
-- TABLE: compliance_requirements (RFP Shredder)
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL,
  title TEXT NOT NULL,
  section TEXT,
  status TEXT DEFAULT 'draft',
  owner TEXT,
  confidence INTEGER DEFAULT 0,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM compliance_requirements;

INSERT INTO compliance_requirements (reference, title, section, status, owner, confidence) VALUES
  ('L.1.1', 'Technical Approach - Cloud Architecture', 'L', 'compliant', 'Sarah Chen', 95),
  ('L.1.2', 'Technical Approach - Data Migration Strategy', 'L', 'compliant', 'Sarah Chen', 92),
  ('L.1.3', 'Technical Approach - Security Framework', 'L', 'partial', 'James Wong', 78),
  ('L.2.1', 'Management Approach - Program Management', 'L', 'compliant', 'Lisa Martinez', 88),
  ('L.2.2', 'Management Approach - Risk Management', 'L', 'compliant', 'Lisa Martinez', 91),
  ('L.2.3', 'Management Approach - Quality Assurance', 'L', 'partial', 'David Kim', 72),
  ('L.3.1', 'Past Performance - Reference 1 (VA)', 'L', 'compliant', 'Michael Torres', 96),
  ('L.3.2', 'Past Performance - Reference 2 (DHA)', 'L', 'compliant', 'Michael Torres', 94),
  ('L.3.3', 'Past Performance - Reference 3 (CMS)', 'L', 'risk', 'Michael Torres', 45),
  ('L.4.1', 'Staffing Plan - Key Personnel', 'L', 'compliant', 'Amanda Foster', 89),
  ('L.4.2', 'Staffing Plan - Clearance Requirements', 'L', 'partial', 'Amanda Foster', 68),
  ('L.5.1', 'Transition Plan - Phase-In Approach', 'L', 'draft', 'Lisa Martinez', 55),
  ('M.1.1', 'Price Proposal - Labor Categories', 'M', 'compliant', 'Jennifer Park', 93),
  ('M.1.2', 'Price Proposal - Rate Build-Up', 'M', 'compliant', 'Jennifer Park', 90),
  ('M.2.1', 'Cost Volume - Basis of Estimate', 'M', 'partial', 'Jennifer Park', 75),
  ('M.2.2', 'Cost Volume - Subcontractor Pricing', 'M', 'risk', 'Jennifer Park', 42),
  ('C.1.1', 'FAR 52.212-4 Contract Terms', 'C', 'compliant', 'Robert Williams', 98),
  ('C.1.2', 'DFARS 252.204-7012 Cybersecurity', 'C', 'compliant', 'Robert Williams', 95),
  ('C.2.1', 'Section 508 Accessibility', 'C', 'partial', 'James Wong', 70),
  ('C.2.2', 'HIPAA Privacy Requirements', 'C', 'compliant', 'Robert Williams', 97);

-- ============================================================
-- TABLE: contracts (Contract Scanner)
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_name TEXT NOT NULL,
  contract_type TEXT,
  risk_level TEXT DEFAULT 'low',
  clause_count INTEGER DEFAULT 0,
  findings INTEGER DEFAULT 0,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM contracts;

INSERT INTO contracts (vehicle_name, contract_type, risk_level, clause_count, findings, expiry_date) VALUES
  ('GSA MAS', 'IDIQ', 'low', 12, 0, '2028-09-30'),
  ('CIO-SP3 Small Business', 'GWAC', 'medium', 28, 2, '2027-05-15'),
  ('SEWP V', 'GWAC', 'low', 15, 0, '2029-04-30'),
  ('VA T4NG', 'BPA', 'high', 34, 5, '2026-12-31'),
  ('NIH CIO-SP4', 'GWAC', 'low', 22, 1, '2030-06-30'),
  ('Alliant 2 SB', 'GWAC', 'medium', 31, 3, '2028-03-31'),
  ('HHS PSC', 'BPA', 'low', 18, 0, '2027-09-30'),
  ('DHA HCSC', 'IDIQ', 'medium', 26, 2, '2028-01-15');

-- ============================================================
-- TABLE: submissions (Launch & ROI)
-- ============================================================
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  value NUMERIC DEFAULT 0,
  submitted_date DATE,
  result_date DATE,
  roi_percent INTEGER,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM submissions;

INSERT INTO submissions (name, status, value, submitted_date, result_date, roi_percent) VALUES
  ('DHA MHS GENESIS Phase 1', 'Won', 45000000, '2025-08-15', '2025-11-01', 847),
  ('VA Claims Modernization Pilot', 'Won', 18500000, '2025-06-01', '2025-08-15', 523),
  ('CMS Quality Dashboard', 'Pending', 67000000, '2026-01-10', NULL, NULL),
  ('IHS Rural Telehealth Phase 1', 'Lost', 12000000, '2025-09-20', '2025-12-01', -125),
  ('SSA Identity Platform', 'Won', 34000000, '2025-07-01', '2025-10-15', 672),
  ('CDC Outbreak Response System', 'Pending', 28000000, '2026-01-15', NULL, NULL),
  ('NIH Data Sharing Pilot', 'Won', 8500000, '2025-05-01', '2025-07-30', 412),
  ('FDA Safety Monitoring POC', 'Lost', 15000000, '2025-10-01', '2026-01-05', -89);

-- ============================================================
-- TABLE: playbook_lessons (Playbook)
-- ============================================================
CREATE TABLE IF NOT EXISTS playbook_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  quality_score INTEGER DEFAULT 85,
  use_count INTEGER DEFAULT 0,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM playbook_lessons;

INSERT INTO playbook_lessons (title, category, quality_score, use_count, content) VALUES
  ('Executive Summary - DHA Win Template', 'Writing', 96, 47, 'Mission Meets Tech brings [X] years of proven healthcare IT expertise to [Agency Name]''s critical [Program Name] initiative. Our team has successfully delivered [specific metric] across [Y] federal healthcare agencies, including [notable achievement]. We understand that [key customer pain point], and our solution directly addresses this through [unique approach].'),
  
  ('Technical Innovation Theme', 'Strategy', 94, 38, 'Unlike legacy approaches that require [competitor weakness], our [solution name] leverages [modern technology] to deliver [specific benefit]. This innovation has been proven at [reference agency], where we achieved [quantified result] while reducing [cost/time metric] by [percentage].'),
  
  ('Past Performance Narrative Template', 'Writing', 92, 52, '[Contract Name] ([Contract Number]) for [Agency] demonstrates our ability to [relevant capability]. Over [period], we [key accomplishment], resulting in [quantified outcome]. The [Customer Title] noted: "[actual or representative quote]." Our CPARS rating of [rating] reflects our commitment to [relevant quality].'),
  
  ('Ghosting the Incumbent', 'Strategy', 91, 33, 'The Government has experienced [specific pain point] when [indirect reference to competitor weakness]. [Our Company] addresses this through [our differentiator], ensuring [specific benefit] without [problem associated with competitor]. Our [proof point] demonstrates this approach delivers [quantified improvement].'),
  
  ('Key Personnel Discriminator', 'Writing', 89, 29, '[Name], our proposed [Role], brings [X] years of [relevant experience] directly supporting [agency/mission]. As former [impressive prior role], [he/she] [specific accomplishment relevant to this work]. [Name] holds [relevant credential] and maintains [clearance level], enabling immediate contribution to [program goal].'),
  
  ('Risk Mitigation Framework', 'Compliance', 88, 24, 'Risk: [Specific risk from PWS]\nImpact: [High/Medium/Low] - [brief explanation]\nMitigation: [Proactive approach]\nContingency: [Backup plan]\nOwner: [Role responsible]\nMetric: [How we measure success]'),
  
  ('FedRAMP Authorization Boilerplate', 'Compliance', 95, 41, 'Mission Meets Tech maintains FedRAMP High Authorization (JAB P-ATO #[number]) for our [Platform Name], encompassing [X] NIST 800-53 Rev 5 controls. This authorization eliminates [typical timeline] of ATO activities, providing the Government immediate access to a production-ready, compliant environment.'),
  
  ('SDVOSB Value Proposition', 'Strategy', 87, 31, 'As a verified Service-Disabled Veteran-Owned Small Business (SDVOSB), Mission Meets Tech combines the agility and innovation of a small business with enterprise-grade capabilities. Our veteran leadership instills a mission-first culture that aligns naturally with [Agency]''s objectives.'),
  
  ('Price-to-Win Analysis Template', 'Pricing', 90, 22, 'Competitor: [Name]\nEstimated Ceiling: $[X]M\nKey Assumptions:\n- Labor mix: [breakdown]\n- Wrap rate estimate: [X.XX]\n- Profit margin: [X]%\nOur Position: [X]% [above/below] market\nRecommendation: [Specific pricing strategy]'),
  
  ('Orals Opening Statement', 'Orals', 93, 18, 'Good [morning/afternoon]. I''m [Name], and on behalf of Mission Meets Tech, I want to thank the [Agency] evaluation team for this opportunity. Over the next [X] minutes, our team will demonstrate not just what we propose, but how we will deliver [program goal]. We understand that [key customer concern], and today we''ll show you exactly how our approach addresses this.');

-- ============================================================
-- TABLE: activity_log (Audit)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  user_name TEXT,
  user_role TEXT,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details JSONB
);

DELETE FROM activity_log;

INSERT INTO activity_log (action, user_name, user_role, ip_address, timestamp) VALUES
  ('LOGIN', 'Mary Womack', 'CEO', '192.168.1.100', NOW() - INTERVAL '2 hours'),
  ('VIEW_BLACKHAT', 'Michael Torres', 'Capture', '192.168.1.105', NOW() - INTERVAL '1 hour 45 minutes'),
  ('EXPORT_PRICING', 'Jennifer Park', 'Pricing', '192.168.1.110', NOW() - INTERVAL '1 hour 30 minutes'),
  ('APPROVE_SECTION', 'Lisa Martinez', 'PM', '192.168.1.108', NOW() - INTERVAL '1 hour'),
  ('VIEW_COMPLIANCE', 'Robert Williams', 'Contracts', '192.168.1.112', NOW() - INTERVAL '45 minutes'),
  ('GENERATE_CONTENT', 'Sarah Chen', 'Solution Arch', '192.168.1.115', NOW() - INTERVAL '30 minutes'),
  ('UPDATE_OPPORTUNITY', 'David Chen', 'COO', '192.168.1.102', NOW() - INTERVAL '15 minutes'),
  ('LOGIN', 'Amanda Foster', 'Delivery', '192.168.1.118', NOW() - INTERVAL '10 minutes');

-- ============================================================
-- TABLE: team_members (Pricing Engine LCATs)
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  hourly_rate NUMERIC DEFAULT 100,
  hours INTEGER DEFAULT 2080,
  wrap_rate NUMERIC DEFAULT 1.85,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM team_members;

INSERT INTO team_members (title, hourly_rate, hours, wrap_rate) VALUES
  ('Program Manager', 195, 2080, 1.85),
  ('Deputy Program Manager', 175, 2080, 1.85),
  ('Sr. Software Engineer', 165, 4160, 1.85),
  ('Software Engineer', 135, 6240, 1.85),
  ('Cloud Architect', 185, 1040, 1.85),
  ('Data Scientist', 155, 2080, 1.85),
  ('DevSecOps Engineer', 145, 2080, 1.85),
  ('QA Lead', 125, 2080, 1.85),
  ('QA Analyst', 95, 4160, 1.85),
  ('Technical Writer', 85, 1040, 1.85),
  ('Business Analyst', 115, 2080, 1.85),
  ('Scrum Master', 125, 2080, 1.85),
  ('UX Designer', 135, 1040, 1.85),
  ('Security Engineer', 155, 2080, 1.85),
  ('Database Administrator', 140, 1040, 1.85);

-- ============================================================
-- Enable Row Level Security (RLS)
-- ============================================================
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated access
CREATE POLICY IF NOT EXISTS "Enable read for all" ON opportunities FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for all" ON opportunities FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable update for all" ON opportunities FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Enable delete for all" ON opportunities FOR DELETE USING (true);

CREATE POLICY IF NOT EXISTS "Enable read for all" ON competitors FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable all for all" ON competitors FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Enable read for all" ON partners FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable all for all" ON partners FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Enable read for all" ON compliance_requirements FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable all for all" ON compliance_requirements FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Enable read for all" ON contracts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable all for all" ON contracts FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Enable read for all" ON submissions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable all for all" ON submissions FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Enable read for all" ON playbook_lessons FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable all for all" ON playbook_lessons FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Enable read for all" ON activity_log FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for all" ON activity_log FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable read for all" ON team_members FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable all for all" ON team_members FOR ALL USING (true);

-- ============================================================
-- Summary: Tables seeded with demo data
-- ============================================================
-- opportunities: 12 records (~$890M total pipeline)
-- competitors: 8 major competitors with ghosting strategies
-- partners: 7 teaming partners with capabilities
-- compliance_requirements: 20 requirements across L, M, C sections
-- contracts: 8 contract vehicles
-- submissions: 8 historical submissions (5 won, 2 pending, 2 lost)
-- playbook_lessons: 10 golden example templates
-- activity_log: 8 recent audit entries
-- team_members: 15 LCATs for pricing
-- ============================================================

SELECT 'MissionPulse v12 Demo Data Seeded Successfully!' AS status;
SELECT 'Total Pipeline Value: $' || TO_CHAR(SUM(contract_value), 'FM999,999,999,999') FROM opportunities;
SELECT COUNT(*) || ' opportunities loaded' AS opportunities FROM opportunities;
SELECT COUNT(*) || ' competitors loaded' AS competitors FROM competitors;
SELECT COUNT(*) || ' partners loaded' AS partners FROM partners;
