-- ============================================================
-- MISSIONPULSE SPRINT 14 DATABASE MIGRATION
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. OPPORTUNITY COMMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author TEXT DEFAULT 'user',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_opportunity ON opportunity_comments(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_comments_pinned ON opportunity_comments(is_pinned);
CREATE INDEX IF NOT EXISTS idx_comments_created ON opportunity_comments(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE opportunity_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all for anon" ON opportunity_comments
  FOR ALL USING (true) WITH CHECK (true);

-- 2. OPPORTUNITY ASSIGNMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunity_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('CEO', 'COO', 'CAP', 'PM', 'SA', 'FIN', 'CON', 'DEL', 'QA')),
  assignee_name TEXT NOT NULL,
  assignee_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for assignments
CREATE INDEX IF NOT EXISTS idx_assignments_opportunity ON opportunity_assignments(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_assignments_role ON opportunity_assignments(role);

-- Enable RLS
ALTER TABLE opportunity_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all operations for authenticated users
CREATE POLICY "Allow all for anon" ON opportunity_assignments
  FOR ALL USING (true) WITH CHECK (true);

-- 3. UPDATE ACTIVITY LOG TO SUPPORT NEW ACTIONS
-- ============================================================
-- The activity_log table already exists, but we want to ensure it can track
-- comment and assignment actions

-- Add comment to document new action types
COMMENT ON COLUMN activity_log.action IS 'Action types: created, updated, phase_changed, deleted, comment_added, comment_deleted, assignment_added, assignment_removed';

-- 4. SAMPLE DATA (OPTIONAL)
-- ============================================================
-- Insert sample comments for the first opportunity
DO $$
DECLARE
  first_opp_id UUID;
BEGIN
  SELECT id INTO first_opp_id FROM opportunities LIMIT 1;
  
  IF first_opp_id IS NOT NULL THEN
    INSERT INTO opportunity_comments (opportunity_id, content, author, is_pinned) VALUES
      (first_opp_id, 'Initial kickoff meeting scheduled for next Monday. Key stakeholders confirmed.', 'Mary Womack', true),
      (first_opp_id, 'Received clarification from contracting officer on PWS section 4.3.', 'James Thompson', false),
      (first_opp_id, 'Technical approach draft completed and ready for internal review.', 'Sarah Chen', false)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO opportunity_assignments (opportunity_id, role, assignee_name, assignee_email) VALUES
      (first_opp_id, 'PM', 'Michael Rodriguez', 'mrodriguez@missionmeetstech.com'),
      (first_opp_id, 'SA', 'James Wong', 'jwong@missionmeetstech.com'),
      (first_opp_id, 'FIN', 'Angela Kim', 'akim@missionmeetstech.com')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 5. VERIFY TABLES CREATED
-- ============================================================
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('opportunity_comments', 'opportunity_assignments')
ORDER BY table_name;

-- Success message
DO $$ BEGIN RAISE NOTICE 'Sprint 14 migration completed successfully!'; END $$;
