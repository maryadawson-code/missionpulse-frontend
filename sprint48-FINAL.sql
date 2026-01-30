-- ============================================
-- SPRINT 48: FINAL MIGRATION (v4)
-- Includes nickname column (NOT NULL constraint)
-- Run in Supabase SQL Editor
-- MissionPulse - Mission Meets Tech
-- ============================================

-- =====================
-- STEP 1: INSERT DEMO OPPORTUNITIES
-- =====================
INSERT INTO opportunities (id, nickname, title)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'VA-EHR', 'VA EHR Modernization'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'DHA-MHS', 'DHA MHS GENESIS Support'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'CMS-QPP', 'CMS Quality Payment Program')
ON CONFLICT (id) DO NOTHING;

-- =====================
-- WIN THEMES TABLE
-- =====================
DROP INDEX IF EXISTS idx_win_themes_opp;
DROP INDEX IF EXISTS idx_win_themes_category;
DROP INDEX IF EXISTS idx_win_themes_priority;

DROP POLICY IF EXISTS "win_themes_select_policy" ON win_themes;
DROP POLICY IF EXISTS "win_themes_insert_policy" ON win_themes;
DROP POLICY IF EXISTS "win_themes_update_policy" ON win_themes;
DROP POLICY IF EXISTS "win_themes_delete_policy" ON win_themes;

DROP TABLE IF EXISTS win_themes CASCADE;

CREATE TABLE win_themes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    company_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
    category TEXT NOT NULL DEFAULT 'discriminator',
    theme_title TEXT NOT NULL,
    theme_statement TEXT,
    proof_points JSONB DEFAULT '[]',
    ghost_competitor TEXT,
    win_probability_impact INTEGER DEFAULT 5,
    priority TEXT DEFAULT 'high' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected', 'archived')),
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_win_themes_opp ON win_themes(opportunity_id);
CREATE INDEX idx_win_themes_category ON win_themes(category);
CREATE INDEX idx_win_themes_priority ON win_themes(priority);

ALTER TABLE win_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "win_themes_select_policy" ON win_themes FOR SELECT USING (true);
CREATE POLICY "win_themes_insert_policy" ON win_themes FOR INSERT WITH CHECK (true);
CREATE POLICY "win_themes_update_policy" ON win_themes FOR UPDATE USING (true);
CREATE POLICY "win_themes_delete_policy" ON win_themes FOR DELETE USING (true);

INSERT INTO win_themes (opportunity_id, category, theme_title, theme_statement, proof_points, ghost_competitor, win_probability_impact, priority, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'discriminator', 'Zero Downtime Migration', 'Unlike competitors who require system outages, our proven migration methodology ensures continuous operations during transition.', '["Migrated 47 VA facilities with 0 downtime", "Patented parallel-run technology", "24/7 war room support standard"]', 'Leidos Legacy Approach', 15, 'critical', 'approved'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'discriminator', 'FHIR-Native Architecture', 'Purpose-built for interoperability from day one, not retrofitted like incumbent solutions.', '["HL7 FHIR R4 certified", "Direct API integration with 340+ EHR systems", "Real-time data exchange vs batch processing"]', 'Oracle Cerner', 12, 'high', 'approved'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ghost', 'Incumbent Lock-In Risk', 'Counter the "switching costs" argument by highlighting our contract flexibility and transition support.', '["No proprietary data formats", "Free data export at any time", "Guaranteed transition support"]', 'Current Incumbent', 8, 'high', 'draft'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'discriminator', 'AI-First Clinical Decision Support', 'Embedded machine learning models trained on 50M+ patient encounters, reducing diagnostic errors.', '["FDA-cleared AI algorithms", "Johns Hopkins validation study", "42% reduction in adverse events"]', 'Epic MyChart', 18, 'critical', 'approved'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'price', 'Total Cost of Ownership', 'Despite higher initial investment, 5-year TCO is 23% lower than alternatives due to reduced maintenance.', '["No annual licensing escalators", "Self-healing infrastructure", "Predictive maintenance reduces support tickets 67%"]', 'All Competitors', 10, 'medium', 'draft');

-- =====================
-- ORALS DECKS TABLE
-- =====================
DROP INDEX IF EXISTS idx_orals_decks_opp;
DROP INDEX IF EXISTS idx_orals_decks_type;
DROP INDEX IF EXISTS idx_orals_decks_status;

DROP POLICY IF EXISTS "orals_decks_select_policy" ON orals_decks;
DROP POLICY IF EXISTS "orals_decks_insert_policy" ON orals_decks;
DROP POLICY IF EXISTS "orals_decks_update_policy" ON orals_decks;
DROP POLICY IF EXISTS "orals_decks_delete_policy" ON orals_decks;

DROP TABLE IF EXISTS orals_decks CASCADE;

CREATE TABLE orals_decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    company_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
    title TEXT NOT NULL,
    deck_type TEXT DEFAULT 'technical' CHECK (deck_type IN ('technical', 'management', 'past_performance', 'cost', 'overview')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'presented')),
    slides JSONB DEFAULT '[]',
    total_duration INTEGER DEFAULT 0,
    practice_sessions INTEGER DEFAULT 0,
    last_practice TIMESTAMPTZ,
    qa_scenarios JSONB DEFAULT '[]',
    presenter_id UUID,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orals_decks_opp ON orals_decks(opportunity_id);
CREATE INDEX idx_orals_decks_type ON orals_decks(deck_type);
CREATE INDEX idx_orals_decks_status ON orals_decks(status);

ALTER TABLE orals_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orals_decks_select_policy" ON orals_decks FOR SELECT USING (true);
CREATE POLICY "orals_decks_insert_policy" ON orals_decks FOR INSERT WITH CHECK (true);
CREATE POLICY "orals_decks_update_policy" ON orals_decks FOR UPDATE USING (true);
CREATE POLICY "orals_decks_delete_policy" ON orals_decks FOR DELETE USING (true);

INSERT INTO orals_decks (opportunity_id, title, deck_type, status, slides, total_duration, practice_sessions, last_practice, qa_scenarios) VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'VA EHR Modernization - Technical Approach',
    'technical',
    'draft',
    '[{"id":1,"title":"Executive Summary","content":"Mission Meets Tech brings 15+ years of VA healthcare IT experience...","speaker_notes":"Open with VA-specific credentials","duration":3},{"id":2,"title":"Technical Architecture","content":"Cloud-native, FHIR-compliant solution architecture...","speaker_notes":"Emphasize zero-downtime migration","duration":5},{"id":3,"title":"Implementation Timeline","content":"Phased rollout across 170 VA facilities...","speaker_notes":"Highlight lessons learned from previous VA work","duration":4}]',
    12,
    3,
    '2026-01-25T14:00:00Z',
    '["How do you handle legacy data migration?","What is your approach to 508 compliance?","Describe your incident response process"]'
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'VA EHR Modernization - Management Approach',
    'management',
    'approved',
    '[{"id":1,"title":"Program Management Office","content":"Dedicated PMO with VA clearances...","speaker_notes":"Introduce key personnel","duration":4},{"id":2,"title":"Risk Mitigation Strategy","content":"Proactive risk identification and response...","speaker_notes":"Reference past performance","duration":3},{"id":3,"title":"Quality Assurance","content":"CMMI Level 3 certified processes...","speaker_notes":"Emphasize continuous improvement","duration":3}]',
    10,
    5,
    '2026-01-27T16:00:00Z',
    '["How will you manage subcontractors?","What is your approach to knowledge transfer?"]'
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'DHA MHS GENESIS - Past Performance',
    'past_performance',
    'in_review',
    '[{"id":1,"title":"Relevant Experience","content":"Successful delivery of 12 DoD health IT contracts...","speaker_notes":"Focus on DHA relationships","duration":5},{"id":2,"title":"Case Study: Navy MEDCOI","content":"Modernized clinical operations for 23 MTFs...","speaker_notes":"Use specific metrics","duration":4}]',
    9,
    2,
    '2026-01-26T11:00:00Z',
    '["Describe a challenging project and how you overcame obstacles","What differentiates your approach from competitors?"]'
);

-- =====================
-- SUCCESS VERIFICATION
-- =====================
SELECT '✅ SUCCESS: Sprint 48 Migration Complete' as result
UNION ALL
SELECT '   opportunities: ' || COUNT(*) || ' records' FROM opportunities
UNION ALL
SELECT '   win_themes: ' || COUNT(*) || ' records' FROM win_themes
UNION ALL
SELECT '   orals_decks: ' || COUNT(*) || ' records' FROM orals_decks;
