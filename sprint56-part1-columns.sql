-- =============================================
-- SPRINT 56 - RUN IN ORDER (3 PARTS)
-- =============================================
-- Run each section separately in Supabase SQL Editor
-- =============================================

-- =============================================
-- PART 1: ADD MISSING COLUMNS TO OPPORTUNITIES
-- Run this FIRST, then run Part 2
-- =============================================

-- Add company_id column
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS company_id UUID;

-- Add other columns that might be missing
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS solicitation_number TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS contract_vehicle TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS set_aside TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS win_themes TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS teaming_partners TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS key_intel TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS confidence TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'opportunities'
ORDER BY ordinal_position;
