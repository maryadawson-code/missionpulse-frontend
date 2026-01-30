-- =============================================
-- PART 3: CREATE LABOR CATEGORIES TABLE
-- Run this AFTER Part 2 completes
-- =============================================

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

CREATE POLICY "labor_categories_read" ON labor_categories FOR SELECT USING (true);
CREATE POLICY "labor_categories_write" ON labor_categories FOR ALL USING (auth.uid() IS NOT NULL);

-- Get company ID and seed labor categories
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT id INTO v_company_id FROM companies WHERE name = 'Mission Meets Tech' LIMIT 1;

  -- Communications Consulting
  INSERT INTO labor_categories (company_id, family, level, level_name, years_experience, bill_rate_low, bill_rate_high, gsa_lcat, alt_lcats) VALUES
  (v_company_id, 'Communications Consulting', 1, 'Intern', 0, 0, 0, NULL, NULL),
  (v_company_id, 'Communications Consulting', 2, 'Associate', 3, 56.91, 62.32, 'Instructional Designer I', ARRAY['Technical Writer/Editor I', 'Trainer I']),
  (v_company_id, 'Communications Consulting', 3, 'Sr Associate', 5, 69.85, 90.00, 'Instructional Designer II', ARRAY['Technical Writer/Editor II', 'Trainer II']),
  (v_company_id, 'Communications Consulting', 4, 'Manager', 10, 67.26, 127.48, 'Trainer III', ARRAY['Technical Writer/Editor III']),
  (v_company_id, 'Communications Consulting', 5, 'Sr Manager', 12, 90.00, 150.00, NULL, NULL),
  (v_company_id, 'Communications Consulting', 6, 'Director', 15, 150.00, 200.00, NULL, NULL),
  (v_company_id, 'Communications Consulting', 7, 'Executive Director', 18, 200.00, 275.00, NULL, NULL);

  -- Technology Consulting
  INSERT INTO labor_categories (company_id, family, level, level_name, years_experience, bill_rate_low, bill_rate_high, gsa_lcat, alt_lcats) VALUES
  (v_company_id, 'Technology Consulting', 1, 'Intern', 0, 0, 0, NULL, NULL),
  (v_company_id, 'Technology Consulting', 2, 'Associate', 1, 39.67, 78.38, 'IT Systems Analyst I', NULL),
  (v_company_id, 'Technology Consulting', 3, 'Sr Associate', 5, 60.53, 113.32, 'IT Systems Analyst II', NULL),
  (v_company_id, 'Technology Consulting', 4, 'Manager', 7, 107.65, 133.58, 'IT Systems Analyst III', NULL),
  (v_company_id, 'Technology Consulting', 5, 'Sr Manager', 10, 168.15, 184.14, 'IT Subject Matter Expert III', NULL),
  (v_company_id, 'Technology Consulting', 6, 'Director', 15, 185.00, 225.00, NULL, NULL),
  (v_company_id, 'Technology Consulting', 7, 'Executive Director', 18, 225.00, 300.00, NULL, NULL);

  -- Clinical Informatics
  INSERT INTO labor_categories (company_id, family, level, level_name, years_experience, bill_rate_low, bill_rate_high, gsa_lcat, alt_lcats) VALUES
  (v_company_id, 'Clinical Informatics', 1, 'Intern', 0, 0, 0, NULL, NULL),
  (v_company_id, 'Clinical Informatics', 2, 'Associate', 2, 45.00, 65.00, 'Health IT Analyst I', NULL),
  (v_company_id, 'Clinical Informatics', 3, 'Sr Associate', 5, 75.00, 110.00, 'Health IT Analyst II', ARRAY['Clinical Informaticist I']),
  (v_company_id, 'Clinical Informatics', 4, 'Manager', 8, 115.00, 145.00, 'Health IT Analyst III', ARRAY['Clinical Informaticist II']),
  (v_company_id, 'Clinical Informatics', 5, 'Sr Manager', 12, 150.00, 185.00, 'Health IT SME', ARRAY['Clinical Informaticist III']),
  (v_company_id, 'Clinical Informatics', 6, 'Director', 15, 190.00, 240.00, NULL, NULL),
  (v_company_id, 'Clinical Informatics', 7, 'Executive Director', 18, 245.00, 325.00, NULL, NULL);

  -- Data & Analytics
  INSERT INTO labor_categories (company_id, family, level, level_name, years_experience, bill_rate_low, bill_rate_high, gsa_lcat, alt_lcats) VALUES
  (v_company_id, 'Data & Analytics', 1, 'Intern', 0, 0, 0, NULL, NULL),
  (v_company_id, 'Data & Analytics', 2, 'Associate', 2, 50.00, 75.00, 'Data Analyst I', ARRAY['Business Analyst I']),
  (v_company_id, 'Data & Analytics', 3, 'Sr Associate', 5, 80.00, 120.00, 'Data Analyst II', ARRAY['Business Analyst II', 'Data Engineer I']),
  (v_company_id, 'Data & Analytics', 4, 'Manager', 8, 125.00, 160.00, 'Data Analyst III', ARRAY['Data Engineer II', 'Data Scientist I']),
  (v_company_id, 'Data & Analytics', 5, 'Sr Manager', 12, 165.00, 200.00, 'Data Scientist II', ARRAY['Data Engineer III']),
  (v_company_id, 'Data & Analytics', 6, 'Director', 15, 205.00, 260.00, 'Data Scientist III', NULL),
  (v_company_id, 'Data & Analytics', 7, 'Executive Director', 18, 265.00, 350.00, NULL, NULL);

  -- Program Management
  INSERT INTO labor_categories (company_id, family, level, level_name, years_experience, bill_rate_low, bill_rate_high, gsa_lcat, alt_lcats) VALUES
  (v_company_id, 'Program Management', 1, 'Intern', 0, 0, 0, NULL, NULL),
  (v_company_id, 'Program Management', 2, 'Associate', 2, 45.00, 70.00, 'Program Analyst I', ARRAY['Project Coordinator']),
  (v_company_id, 'Program Management', 3, 'Sr Associate', 5, 75.00, 105.00, 'Program Analyst II', ARRAY['Project Manager I']),
  (v_company_id, 'Program Management', 4, 'Manager', 8, 110.00, 145.00, 'Program Analyst III', ARRAY['Project Manager II']),
  (v_company_id, 'Program Management', 5, 'Sr Manager', 12, 150.00, 190.00, 'Program Manager I', ARRAY['Project Manager III']),
  (v_company_id, 'Program Management', 6, 'Director', 15, 195.00, 250.00, 'Program Manager II', NULL),
  (v_company_id, 'Program Management', 7, 'Executive Director', 18, 255.00, 350.00, 'Program Manager III', NULL);

  RAISE NOTICE 'SUCCESS: Inserted 35 labor categories';
END $$;

-- Verify all data
SELECT 'Opportunities' AS data, COUNT(*) AS count FROM opportunities
UNION ALL
SELECT 'Labor Categories', COUNT(*) FROM labor_categories
UNION ALL
SELECT 'Companies', COUNT(*) FROM companies;

-- Show labor rate summary
SELECT family, level_name, bill_rate_low, bill_rate_high, gsa_lcat 
FROM labor_categories 
WHERE level BETWEEN 2 AND 5
ORDER BY family, level;
