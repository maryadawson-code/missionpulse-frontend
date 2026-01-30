-- ============================================================
-- SPRINT 49: PROPOSAL_SECTIONS TABLE (IRON DOME)
-- MissionPulse | Mission Meets Tech | CMMC Compliant
-- ============================================================

-- Drop existing objects to prevent conflicts
DROP INDEX IF EXISTS idx_proposal_sections_opp;
DROP INDEX IF EXISTS idx_proposal_sections_volume;
DROP POLICY IF EXISTS proposal_sections_select_policy ON proposal_sections;
DROP POLICY IF EXISTS proposal_sections_insert_policy ON proposal_sections;
DROP POLICY IF EXISTS proposal_sections_update_policy ON proposal_sections;
DROP POLICY IF EXISTS proposal_sections_delete_policy ON proposal_sections;
DROP TABLE IF EXISTS proposal_sections CASCADE;

-- Create proposal_sections table
CREATE TABLE proposal_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  volume TEXT NOT NULL CHECK (volume IN ('technical', 'management', 'past_performance', 'pricing', 'executive_summary')),
  section_number TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  word_count INTEGER DEFAULT 0,
  page_limit INTEGER,
  current_pages DECIMAL(4,1) DEFAULT 0,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'drafting', 'review', 'approved', 'locked')),
  assigned_to TEXT,
  ai_generated_percent INTEGER DEFAULT 0 CHECK (ai_generated_percent >= 0 AND ai_generated_percent <= 100),
  citations_count INTEGER DEFAULT 0,
  compliance_score INTEGER DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100),
  cui_marking TEXT DEFAULT 'UNCLASSIFIED',
  last_edited_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_proposal_sections_opp ON proposal_sections(opportunity_id);
CREATE INDEX idx_proposal_sections_volume ON proposal_sections(volume);
CREATE INDEX idx_proposal_sections_status ON proposal_sections(status);

-- Enable RLS
ALTER TABLE proposal_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY proposal_sections_select_policy ON proposal_sections
  FOR SELECT USING (true);

CREATE POLICY proposal_sections_insert_policy ON proposal_sections
  FOR INSERT WITH CHECK (true);

CREATE POLICY proposal_sections_update_policy ON proposal_sections
  FOR UPDATE USING (true);

CREATE POLICY proposal_sections_delete_policy ON proposal_sections
  FOR DELETE USING (true);

-- Insert demo data for DHA EHR Modernization (opportunity_id from your existing data)
INSERT INTO proposal_sections (opportunity_id, volume, section_number, title, content, word_count, page_limit, current_pages, status, assigned_to, ai_generated_percent, citations_count, compliance_score, cui_marking) VALUES
-- Technical Volume
('550e8400-e29b-41d4-a716-446655440001', 'technical', '1.0', 'Executive Summary', 'Our team brings unparalleled expertise in healthcare IT modernization, having successfully delivered 47 similar engagements across DHA, VA, and HHS...', 2847, 35, 11.5, 'review', 'Sarah Chen', 68, 12, 94, 'CUI//PROPIN'),
('550e8400-e29b-41d4-a716-446655440001', 'technical', '2.0', 'Technical Solution', 'The proposed architecture employs a microservices-based design pattern optimized for government cloud environments...', 4231, 50, 17.2, 'drafting', 'Michael Torres', 72, 8, 87, 'CUI//FEDCON'),
('550e8400-e29b-41d4-a716-446655440001', 'technical', '3.0', 'Quality Assurance', 'Our ISO 9001:2015 certified quality management system ensures consistent, high-quality deliverables...', 1856, 15, 7.5, 'approved', 'Lisa Wang', 61, 5, 98, 'UNCLASSIFIED'),
('550e8400-e29b-41d4-a716-446655440001', 'technical', '4.0', 'Security Framework', 'Security is embedded at every layer through our Defense in Depth strategy implementing zero-trust architecture...', 3124, 25, 12.6, 'drafting', 'James Park', 55, 9, 91, 'CUI//SP-CTI'),

-- Management Volume
('550e8400-e29b-41d4-a716-446655440001', 'management', '1.0', 'Program Management', 'Our Program Manager brings 18 years of federal healthcare IT experience and has successfully led programs totaling $450M...', 2156, 20, 8.7, 'review', 'Jennifer Adams', 45, 6, 96, 'CUI//PROPIN'),
('550e8400-e29b-41d4-a716-446655440001', 'management', '2.0', 'Staffing Plan', 'The proposed team structure includes 24 FTEs with an average of 12 years relevant experience...', 1890, 15, 7.6, 'approved', 'David Kim', 38, 4, 100, 'UNCLASSIFIED'),
('550e8400-e29b-41d4-a716-446655440001', 'management', '3.0', 'Risk Management', 'Our comprehensive risk management approach follows DoD Risk Management Guide principles...', 1450, 10, 5.9, 'not_started', NULL, 0, 0, 0, 'UNCLASSIFIED'),

-- Past Performance Volume
('550e8400-e29b-41d4-a716-446655440001', 'past_performance', '1.0', 'Relevant Contracts', 'Contract #1: DHA DHITS Program - $125M CPFF - Exceptional CPARS rating...', 3200, 30, 13.0, 'approved', 'Emily Rodriguez', 22, 15, 100, 'CUI//FEDCON'),
('550e8400-e29b-41d4-a716-446655440001', 'past_performance', '2.0', 'Key Personnel Experience', 'Our proposed key personnel have delivered similar capabilities across 23 federal engagements...', 2100, 20, 8.5, 'review', 'Robert Chang', 31, 8, 92, 'UNCLASSIFIED'),

-- Pricing Volume
('550e8400-e29b-41d4-a716-446655440001', 'pricing', '1.0', 'Pricing Narrative', 'Our pricing approach balances competitive rates with best-value staffing qualifications...', 1200, 10, 4.9, 'drafting', 'Finance Team', 15, 2, 88, 'CUI//PROPIN'),
('550e8400-e29b-41d4-a716-446655440001', 'pricing', '2.0', 'Basis of Estimate', 'Labor estimates derived from historical actuals across 12 similar task orders...', 2800, 25, 11.3, 'not_started', NULL, 0, 0, 0, 'CUI//PROPIN'),

-- Executive Summary
('550e8400-e29b-41d4-a716-446655440001', 'executive_summary', '1.0', 'Cover Letter', 'Mission Meets Tech is pleased to submit this proposal in response to solicitation...', 450, 2, 1.8, 'approved', 'Mary Womack', 25, 0, 100, 'UNCLASSIFIED');

-- ============================================================
-- COMPLIANCE_ITEMS TABLE (if not exists, enhance schema)
-- ============================================================
-- Note: compliance_items should already exist, but let's add any missing columns

-- Add columns if they don't exist (run separately if needed)
-- ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS section_ref TEXT;
-- ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS response_location TEXT;
-- ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

-- Verify demo data exists
INSERT INTO compliance_items (opportunity_id, requirement_text, requirement_ref, category, status, notes)
SELECT 
  '550e8400-e29b-41d4-a716-446655440001',
  requirement_text,
  requirement_ref,
  category,
  status,
  notes
FROM (VALUES
  ('Offeror shall demonstrate FedRAMP High authorization or equivalent', 'L.5.1.a', 'security', 'compliant', 'FedRAMP High ATO obtained 2024'),
  ('Key personnel shall hold active Secret clearance minimum', 'L.5.2.b', 'personnel', 'compliant', 'All KP cleared - verification attached'),
  ('System shall achieve 99.9% uptime SLA', 'C.3.2.1', 'performance', 'compliant', 'Architecture supports 99.95% - exceeds requirement'),
  ('Contractor shall comply with HIPAA Security Rule', 'H.8.1', 'compliance', 'compliant', 'BAA executed - HIPAA compliant'),
  ('Data shall be encrypted at rest using AES-256', 'L.5.1.c', 'security', 'compliant', 'FIPS 140-2 validated encryption'),
  ('Response time shall not exceed 2 seconds for 95% of transactions', 'C.3.2.4', 'performance', 'partial', 'Current: 2.1s - optimization in progress'),
  ('Offeror shall provide 24/7 helpdesk support', 'C.4.1.1', 'support', 'compliant', 'NOC staffed 24/7/365'),
  ('System shall integrate with existing MHS GENESIS', 'C.2.3.1', 'technical', 'compliant', 'HL7 FHIR integration tested'),
  ('Contractor shall maintain CMMC Level 2 certification', 'H.9.1', 'compliance', 'pending', 'Assessment scheduled Q2 2026'),
  ('All code shall undergo independent security review', 'L.5.3.a', 'security', 'not_compliant', 'Third-party review pending budget approval')
) AS v(requirement_text, requirement_ref, category, status, notes)
WHERE NOT EXISTS (
  SELECT 1 FROM compliance_items 
  WHERE opportunity_id = '550e8400-e29b-41d4-a716-446655440001' 
  AND requirement_ref = v.requirement_ref
);

-- ============================================================
-- VERIFICATION QUERY
-- ============================================================
-- SELECT 'proposal_sections' as table_name, COUNT(*) as count FROM proposal_sections
-- UNION ALL
-- SELECT 'compliance_items', COUNT(*) FROM compliance_items;
