-- ============================================================================
-- MISSIONPULSE - ORALS STUDIO TABLES (SPRINT 20)
-- ============================================================================
-- Tables for orals preparation: questions bank and practice sessions
-- Run in Supabase SQL Editor
-- 
-- Author: Mission Meets Tech
-- Generated: January 30, 2026
-- ============================================================================

-- ============================================================================
-- CLEANUP (Safe drops)
-- ============================================================================
DROP POLICY IF EXISTS "orals_questions_select_all" ON orals_questions;
DROP POLICY IF EXISTS "orals_questions_insert_auth" ON orals_questions;
DROP POLICY IF EXISTS "orals_questions_update_auth" ON orals_questions;
DROP POLICY IF EXISTS "orals_questions_delete_admin" ON orals_questions;
DROP POLICY IF EXISTS "orals_sessions_select_all" ON orals_sessions;
DROP POLICY IF EXISTS "orals_sessions_insert_auth" ON orals_sessions;
DROP POLICY IF EXISTS "orals_sessions_update_auth" ON orals_sessions;
DROP POLICY IF EXISTS "orals_attempts_select_all" ON orals_attempts;
DROP POLICY IF EXISTS "orals_attempts_insert_auth" ON orals_attempts;

DROP INDEX IF EXISTS idx_orals_questions_opp;
DROP INDEX IF EXISTS idx_orals_questions_category;
DROP INDEX IF EXISTS idx_orals_sessions_opp;
DROP INDEX IF EXISTS idx_orals_sessions_date;
DROP INDEX IF EXISTS idx_orals_attempts_question;
DROP INDEX IF EXISTS idx_orals_attempts_session;

DROP TABLE IF EXISTS orals_attempts CASCADE;
DROP TABLE IF EXISTS orals_sessions CASCADE;
DROP TABLE IF EXISTS orals_questions CASCADE;

-- ============================================================================
-- ORALS QUESTIONS TABLE (Q&A Bank)
-- ============================================================================
CREATE TABLE orals_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    company_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
    
    -- Question Content
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'technical', 'management', 'past_performance', 'staffing',
        'risk', 'pricing', 'transition', 'curveball'
    )),
    question TEXT NOT NULL,
    suggested_answer TEXT,
    
    -- Metadata
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    time_limit INTEGER DEFAULT 120, -- seconds
    tags TEXT[],
    source VARCHAR(100), -- e.g., "AI Generated", "Past Evaluation", "SME Input"
    
    -- Performance Tracking
    times_asked INTEGER DEFAULT 0,
    avg_score DECIMAL(3,2),
    last_practiced TIMESTAMPTZ,
    
    -- Audit
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ORALS SESSIONS TABLE (Practice Sessions)
-- ============================================================================
CREATE TABLE orals_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    company_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
    
    -- Session Info
    session_date TIMESTAMPTZ DEFAULT NOW(),
    session_type VARCHAR(50) DEFAULT 'practice' CHECK (session_type IN (
        'practice', 'mock_eval', 'dry_run', 'final_prep'
    )),
    
    -- Participants
    participants TEXT[], -- Array of names
    facilitator_id UUID REFERENCES profiles(id),
    
    -- Results
    questions_attempted INTEGER DEFAULT 0,
    total_questions INTEGER,
    avg_score DECIMAL(3,2),
    duration_minutes INTEGER,
    
    -- Notes & Feedback
    notes TEXT,
    strengths TEXT[],
    areas_for_improvement TEXT[],
    action_items TEXT[],
    
    -- Audit
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ORALS ATTEMPTS TABLE (Individual Question Attempts)
-- ============================================================================
CREATE TABLE orals_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES orals_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES orals_questions(id) ON DELETE CASCADE,
    
    -- Attempt Data
    responder_name VARCHAR(150),
    score INTEGER CHECK (score >= 1 AND score <= 5),
    time_used INTEGER, -- seconds
    
    -- Feedback
    evaluator_notes TEXT,
    response_summary TEXT,
    
    -- Timestamp
    attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_orals_questions_opp ON orals_questions(opportunity_id);
CREATE INDEX idx_orals_questions_category ON orals_questions(category);
CREATE INDEX idx_orals_questions_difficulty ON orals_questions(difficulty);
CREATE INDEX idx_orals_sessions_opp ON orals_sessions(opportunity_id);
CREATE INDEX idx_orals_sessions_date ON orals_sessions(session_date DESC);
CREATE INDEX idx_orals_attempts_question ON orals_attempts(question_id);
CREATE INDEX idx_orals_attempts_session ON orals_attempts(session_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE orals_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orals_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orals_attempts ENABLE ROW LEVEL SECURITY;

-- Questions: All authenticated users can view, auth can insert/update
CREATE POLICY "orals_questions_select_all" ON orals_questions
    FOR SELECT USING (true);

CREATE POLICY "orals_questions_insert_auth" ON orals_questions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "orals_questions_update_auth" ON orals_questions
    FOR UPDATE USING (true);

CREATE POLICY "orals_questions_delete_admin" ON orals_questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('CEO', 'COO', 'Admin')
        )
    );

-- Sessions: Similar permissions
CREATE POLICY "orals_sessions_select_all" ON orals_sessions
    FOR SELECT USING (true);

CREATE POLICY "orals_sessions_insert_auth" ON orals_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "orals_sessions_update_auth" ON orals_sessions
    FOR UPDATE USING (true);

-- Attempts: Track individual practice attempts
CREATE POLICY "orals_attempts_select_all" ON orals_attempts
    FOR SELECT USING (true);

CREATE POLICY "orals_attempts_insert_auth" ON orals_attempts
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_orals_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orals_questions_updated_at ON orals_questions;
CREATE TRIGGER orals_questions_updated_at
    BEFORE UPDATE ON orals_questions
    FOR EACH ROW EXECUTE FUNCTION update_orals_timestamp();

DROP TRIGGER IF EXISTS orals_sessions_updated_at ON orals_sessions;
CREATE TRIGGER orals_sessions_updated_at
    BEFORE UPDATE ON orals_sessions
    FOR EACH ROW EXECUTE FUNCTION update_orals_timestamp();

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Get first opportunity ID (or use placeholder)
DO $$
DECLARE
    opp_id UUID;
BEGIN
    SELECT id INTO opp_id FROM opportunities LIMIT 1;
    
    IF opp_id IS NOT NULL THEN
        -- Insert sample questions
        INSERT INTO orals_questions (opportunity_id, category, question, suggested_answer, difficulty, time_limit, tags, times_asked, avg_score)
        VALUES 
        (
            opp_id,
            'technical',
            'Walk us through your approach to migrating legacy health records while maintaining HIPAA compliance.',
            'Our approach follows a three-phase methodology: Discovery, Migration, and Validation. During Discovery, we conduct comprehensive data mapping and identify all PHI touchpoints. We use our proven ETL framework that has achieved 99.97% data integrity across 12 similar migrations. Migration occurs in parallel streams with real-time validation, and we maintain a complete rollback capability at all times.',
            'hard',
            180,
            ARRAY['migration', 'HIPAA', 'technical', 'healthcare'],
            3,
            4.2
        ),
        (
            opp_id,
            'management',
            'How will you ensure consistent communication with the government team throughout the project lifecycle?',
            'We establish a multi-tiered communication framework: Daily standups with technical leads, weekly status reports for program management, and monthly executive briefings. We use an integrated dashboard providing real-time visibility into all project metrics. Our dedicated Government Liaison ensures issues are escalated within 4 hours.',
            'medium',
            120,
            ARRAY['communication', 'PMO', 'stakeholder'],
            5,
            4.5
        ),
        (
            opp_id,
            'past_performance',
            'Describe a similar project where you faced significant technical challenges and how you overcame them.',
            'On our TRICARE modernization effort, we encountered unexpected data quality issues in legacy systems affecting 2.3 million records. We implemented an automated data cleansing pipeline using ML-based pattern recognition, correcting 94% of anomalies automatically. The remaining 6% were resolved through targeted SME review. We completed the migration 2 weeks ahead of schedule.',
            'medium',
            180,
            ARRAY['past performance', 'challenges', 'problem solving'],
            4,
            4.0
        ),
        (
            opp_id,
            'staffing',
            'Your proposed Program Manager recently left the company. How will you address this staffing change?',
            'We have identified two qualified internal candidates with comparable experience. Both have been briefed on this opportunity and are prepared to step in immediately. Additionally, we maintain partnership agreements with two staffing firms specializing in cleared PM talent, ensuring we can fulfill any key personnel requirement within 30 days.',
            'hard',
            120,
            ARRAY['staffing', 'contingency', 'key personnel'],
            2,
            3.8
        ),
        (
            opp_id,
            'curveball',
            'The government has just reduced the budget by 20%. What would you cut and why?',
            'We would prioritize core functionality over nice-to-have features. Specifically, we would phase the advanced analytics module to Year 2 while maintaining all compliance requirements and core operations. We would also propose a hybrid staffing model, increasing contractor-to-FTE ratio for non-critical functions. These changes preserve the mission-critical path while meeting the reduced budget.',
            'hard',
            120,
            ARRAY['budget', 'prioritization', 'negotiation'],
            1,
            NULL
        );
        
        RAISE NOTICE 'Inserted 5 sample questions for opportunity %', opp_id;
    ELSE
        RAISE NOTICE 'No opportunities found, skipping sample data';
    END IF;
END $$;

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT SELECT, INSERT, UPDATE ON orals_questions TO anon;
GRANT SELECT, INSERT, UPDATE ON orals_sessions TO anon;
GRANT SELECT, INSERT ON orals_attempts TO anon;
GRANT ALL ON orals_questions TO authenticated;
GRANT ALL ON orals_sessions TO authenticated;
GRANT ALL ON orals_attempts TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 
    'orals_questions' as table_name,
    COUNT(*) as row_count
FROM orals_questions
UNION ALL
SELECT 
    'orals_sessions' as table_name,
    COUNT(*) as row_count
FROM orals_sessions
UNION ALL
SELECT 
    'orals_attempts' as table_name,
    COUNT(*) as row_count
FROM orals_attempts;

-- Success message
SELECT '✅ Sprint 20: Orals Studio tables created successfully!' as status;
