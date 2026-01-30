-- ============================================================
-- MISSIONPULSE SPRINT 5: COMPLIANCE + PRICING TABLES
-- Run in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- TABLE 1: COMPLIANCE REQUIREMENTS (Iron Dome)
-- ============================================================
DROP TABLE IF EXISTS compliance_requirements CASCADE;

CREATE TABLE compliance_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES opportunities(id),
  pws_ref VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  requirement_text TEXT,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('COMPLIANT', 'PARTIAL', 'HIGH_RISK', 'PENDING', 'NOT_APPLICABLE')),
  risk_level VARCHAR(10) DEFAULT 'GREEN' CHECK (risk_level IN ('GREEN', 'YELLOW', 'RED')),
  assigned_owner VARCHAR(100),
  section_volume VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on compliance_requirements"
ON compliance_requirements FOR SELECT TO public USING (true);

-- Insert demo compliance requirements
INSERT INTO compliance_requirements (pws_ref, title, requirement_text, status, risk_level, assigned_owner, section_volume) VALUES
('PWS 4.3.1', 'Health Data Interoperability', 'Contractor shall ensure all clinical data exchanges comply with HL7 FHIR Release 4 standards', 'HIGH_RISK', 'RED', 'James Wong, SA', 'Vol II - Technical'),
('PWS 4.3.2', 'FedRAMP Authorization', 'Cloud services must maintain FedRAMP High authorization', 'COMPLIANT', 'GREEN', 'Sarah Chen, SA', 'Vol II - Technical'),
('PWS 5.1.1', 'Key Personnel Qualifications', 'PM shall have minimum 10 years federal health IT experience', 'COMPLIANT', 'GREEN', 'Lisa Martinez, PM', 'Vol III - Management'),
('PWS 5.2.1', 'Staffing Plan', 'Provide detailed staffing plan with labor categories and FTE counts', 'PARTIAL', 'YELLOW', 'Amanda Foster, DEL', 'Vol III - Management'),
('PWS 6.1.1', 'Security Clearance Requirements', 'All personnel accessing PII/PHI must hold minimum Secret clearance', 'COMPLIANT', 'GREEN', 'Robert Kim, CON', 'Vol IV - Security'),
('PWS 6.2.1', 'HIPAA Compliance', 'Demonstrate HIPAA compliance with BAA execution', 'COMPLIANT', 'GREEN', 'Robert Kim, CON', 'Vol IV - Security'),
('PWS 7.1.1', 'Past Performance References', 'Provide 3 relevant past performance references within 5 years', 'COMPLIANT', 'GREEN', 'Michael Torres, CAP', 'Vol V - Past Performance'),
('PWS 7.2.1', 'CPARS Rating Requirement', 'All references must have CPARS rating of Satisfactory or higher', 'COMPLIANT', 'GREEN', 'Michael Torres, CAP', 'Vol V - Past Performance'),
('PWS 8.1.1', 'Cost Proposal Format', 'Cost proposal shall follow SF1411 format with fully burdened rates', 'PARTIAL', 'YELLOW', 'Jennifer Park, FIN', 'Vol VI - Pricing'),
('PWS 8.2.1', 'Price Realism', 'Demonstrate price realism through basis of estimate documentation', 'HIGH_RISK', 'RED', 'Jennifer Park, FIN', 'Vol VI - Pricing'),
('L.5.1', 'Page Limitations', 'Technical volume limited to 50 pages excluding resumes', 'COMPLIANT', 'GREEN', 'Lisa Martinez, PM', 'Section L'),
('L.5.2', 'Font Requirements', 'Use Times New Roman 12pt, 1-inch margins', 'COMPLIANT', 'GREEN', 'Kevin Walsh, QA', 'Section L'),
('M.1.1', 'Evaluation Factor 1', 'Technical Approach - Most Important', 'PENDING', 'YELLOW', 'Sarah Chen, SA', 'Section M'),
('M.1.2', 'Evaluation Factor 2', 'Past Performance - Important', 'PENDING', 'GREEN', 'Michael Torres, CAP', 'Section M'),
('M.1.3', 'Evaluation Factor 3', 'Price - Less Important than Technical', 'PENDING', 'GREEN', 'Jennifer Park, FIN', 'Section M');

-- ============================================================
-- TABLE 2: TEAM MEMBERS / LABOR (Pricing Studio)
-- ============================================================
DROP TABLE IF EXISTS team_members CASCADE;

CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  labor_category VARCHAR(100),
  role VARCHAR(100),
  hourly_rate DECIMAL(10,2),
  annual_salary DECIMAL(12,2),
  clearance_level VARCHAR(50),
  availability_percent INTEGER DEFAULT 100,
  start_date DATE,
  is_key_personnel BOOLEAN DEFAULT FALSE,
  years_experience INTEGER,
  certifications TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on team_members"
ON team_members FOR SELECT TO public USING (true);

-- Insert demo team members
INSERT INTO team_members (name, labor_category, role, hourly_rate, annual_salary, clearance_level, is_key_personnel, years_experience, certifications) VALUES
('Dr. Angela Reyes', 'Program Manager III', 'Program Manager', 185.00, 385000, 'TS/SCI', true, 18, 'PMP, ITIL v4, Six Sigma Black Belt'),
('James Wong', 'Solutions Architect III', 'Technical Lead', 165.00, 343000, 'Secret', true, 15, 'AWS Solutions Architect Pro, Azure Expert, TOGAF'),
('Sarah Mitchell', 'Senior Engineer', 'Lead Developer', 145.00, 302000, 'Secret', true, 12, 'AWS Developer, Kubernetes Admin, CISSP'),
('Marcus Johnson', 'Engineer II', 'Backend Developer', 115.00, 239000, 'Secret', false, 8, 'AWS Developer, Python Certified'),
('Emily Chen', 'Engineer II', 'Frontend Developer', 110.00, 229000, 'Secret', false, 6, 'React Certified, AWS Cloud Practitioner'),
('David Park', 'DevOps Engineer II', 'DevOps Lead', 135.00, 281000, 'Secret', false, 10, 'Kubernetes Admin, AWS DevOps Pro, Terraform'),
('Lisa Thompson', 'Business Analyst II', 'Requirements Lead', 105.00, 218000, 'Secret', false, 7, 'CBAP, Agile Certified'),
('Robert Kim', 'Cybersecurity Engineer III', 'Security Lead', 155.00, 322000, 'TS/SCI', true, 14, 'CISSP, CISM, CEH, Security+'),
('Jennifer Adams', 'QA Engineer II', 'Test Lead', 100.00, 208000, 'Secret', false, 6, 'ISTQB, AWS Certified'),
('Michael Brown', 'Technical Writer II', 'Documentation Lead', 85.00, 177000, 'Secret', false, 5, 'CPTC');

-- ============================================================
-- VERIFY BOTH TABLES
-- ============================================================
SELECT 'compliance_requirements' as table_name, COUNT(*) as row_count FROM compliance_requirements
UNION ALL
SELECT 'team_members' as table_name, COUNT(*) as row_count FROM team_members;
