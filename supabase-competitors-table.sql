-- ============================================================
-- MISSIONPULSE SPRINT 4: COMPETITORS TABLE
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create competitors table
CREATE TABLE IF NOT EXISTS competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  opportunity_id UUID REFERENCES opportunities(id),
  name VARCHAR(255) NOT NULL,
  threat_level VARCHAR(20) DEFAULT 'MEDIUM' CHECK (threat_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  estimated_pwin INTEGER DEFAULT 50 CHECK (estimated_pwin >= 0 AND estimated_pwin <= 100),
  strength TEXT,
  weakness TEXT,
  strategy TEXT,
  is_incumbent BOOLEAN DEFAULT FALSE,
  contract_vehicle VARCHAR(255),
  past_performance_score INTEGER CHECK (past_performance_score >= 0 AND past_performance_score <= 100),
  price_position VARCHAR(20) CHECK (price_position IN ('LOW', 'COMPETITIVE', 'HIGH', 'UNKNOWN')),
  color VARCHAR(7) DEFAULT '#64748b',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_competitors_opportunity ON competitors(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_competitors_company ON competitors(company_id);

-- Enable Row Level Security
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

-- Create public read policy (same as opportunities)
CREATE POLICY "Allow public read access on competitors"
ON competitors
FOR SELECT
TO public
USING (true);

-- Insert demo competitors data
INSERT INTO competitors (name, threat_level, estimated_pwin, strength, weakness, is_incumbent, color) VALUES
('Leidos Health', 'HIGH', 68, 'Strong VA presence, extensive federal health IT portfolio', 'Limited DHA past performance, higher overhead rates', false, '#EF4444'),
('GDIT (General Dynamics)', 'HIGH', 62, 'Incumbent MHS GENESIS support, established DHA relationships', 'Higher cost structure, bureaucratic processes', true, '#F59E0B'),
('Accenture Federal', 'MEDIUM', 55, 'Cloud migration expertise, strong consulting brand', 'Lower SDVOSB percentage, less healthcare focus', false, '#3B82F6'),
('Booz Allen Hamilton', 'MEDIUM', 52, 'Analytics and AI capabilities, cleared workforce', 'Premium pricing, competing priorities', false, '#8B5CF6'),
('ManTech', 'LOW', 45, 'Cybersecurity expertise, good small biz partnerships', 'Limited health IT modernization experience', false, '#22C55E'),
('Peraton', 'MEDIUM', 48, 'Recent federal health wins, aggressive pricing', 'Integration challenges post-merger', false, '#06B6D4');

-- Verify insert
SELECT COUNT(*) as competitor_count FROM competitors;
