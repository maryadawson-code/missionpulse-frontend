-- Sprint 41: Competitor Intel History & Trends
-- Run in Supabase Dashboard > SQL Editor

-- Table for tracking competitor intel over time
DROP TABLE IF EXISTS competitor_intel_history CASCADE;
CREATE TABLE competitor_intel_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    
    -- Snapshot data
    intel_date DATE NOT NULL DEFAULT CURRENT_DATE,
    estimated_price DECIMAL(15,2),
    pwin_estimate INTEGER CHECK (pwin_estimate >= 0 AND pwin_estimate <= 100),
    team_size_estimate INTEGER,
    key_personnel TEXT[],
    known_partners TEXT[],
    
    -- Intel categories
    intel_type TEXT CHECK (intel_type IN ('pricing', 'teaming', 'personnel', 'strategy', 'weakness', 'strength', 'rumor', 'confirmed')),
    intel_source TEXT,
    confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high', 'verified')),
    
    -- Content
    summary TEXT NOT NULL,
    details TEXT,
    evidence_links TEXT[],
    
    -- Metadata
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_intel_history_competitor ON competitor_intel_history(competitor_id);
CREATE INDEX idx_intel_history_opportunity ON competitor_intel_history(opportunity_id);
CREATE INDEX idx_intel_history_date ON competitor_intel_history(intel_date DESC);
CREATE INDEX idx_intel_history_type ON competitor_intel_history(intel_type);

-- RLS Policies
ALTER TABLE competitor_intel_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competitor intel" ON competitor_intel_history
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert intel" ON competitor_intel_history
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own intel" ON competitor_intel_history
    FOR UPDATE USING (created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('CEO', 'COO', 'Admin', 'CAP')
    ));

CREATE POLICY "Admins can delete intel" ON competitor_intel_history
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('CEO', 'COO', 'Admin')
    ));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_intel_history_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER intel_history_updated
    BEFORE UPDATE ON competitor_intel_history
    FOR EACH ROW
    EXECUTE FUNCTION update_intel_history_timestamp();

-- View for competitor trend analysis
CREATE OR REPLACE VIEW competitor_trends AS
SELECT 
    c.id as competitor_id,
    c.name as competitor_name,
    o.id as opportunity_id,
    o.title as opportunity_title,
    COUNT(cih.id) as intel_count,
    AVG(cih.pwin_estimate) as avg_pwin,
    MIN(cih.estimated_price) as min_price_seen,
    MAX(cih.estimated_price) as max_price_seen,
    MAX(cih.intel_date) as latest_intel_date,
    array_agg(DISTINCT cih.intel_type) FILTER (WHERE cih.intel_type IS NOT NULL) as intel_types
FROM competitors c
LEFT JOIN competitor_intel_history cih ON c.id = cih.competitor_id
LEFT JOIN opportunities o ON cih.opportunity_id = o.id
GROUP BY c.id, c.name, o.id, o.title;

-- Grant access
GRANT SELECT ON competitor_trends TO authenticated;
GRANT ALL ON competitor_intel_history TO authenticated;
