-- =============================================
-- FEB 2 AUTH TEST CHECKLIST
-- Run after Supabase maintenance ends
-- =============================================

-- 1. Verify test user exists and has CEO role
SELECT id, email, full_name, role FROM profiles WHERE email = 'maryadawson@gmail.com';

-- 2. If missing or wrong role, fix it:
UPDATE profiles SET role = 'CEO', full_name = 'Mary Womack' WHERE email = 'maryadawson@gmail.com';

-- 3. Verify all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected tables (18+):
-- access_requests, companies, competitor_intel_history, competitors, 
-- compliance_requirements, documents, gate_reviews, intel_recordings,
-- opportunities, opportunity_contacts, partners, playbook_lessons,
-- profiles, proposal_documents, team_members, user_invitations, users

-- 4. Verify storage bucket
SELECT * FROM storage.buckets WHERE id = 'proposal-documents';

-- 5. Count records in key tables
SELECT 'opportunities' as tbl, COUNT(*) as cnt FROM opportunities
UNION ALL SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL SELECT 'competitor_intel_history', COUNT(*) FROM competitor_intel_history
UNION ALL SELECT 'proposal_documents', COUNT(*) FROM proposal_documents
UNION ALL SELECT 'intel_recordings', COUNT(*) FROM intel_recordings;

-- 6. Test RLS is working (should return rows only for authenticated user)
-- Run this AFTER logging in via the app

-- 7. Verify trigger exists
SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname = 'trigger_sync_recording_intel';

-- =============================================
-- IF ANY ISSUES, RUN THESE FIXES:
-- =============================================

-- Fix missing profile for auth user:
-- INSERT INTO profiles (id, email, full_name, role)
-- SELECT id, email, raw_user_meta_data->>'full_name', 'User'
-- FROM auth.users
-- WHERE id NOT IN (SELECT id FROM profiles);

-- Grant permissions if missing:
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
