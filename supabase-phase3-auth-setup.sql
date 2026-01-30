-- ============================================================
-- MissionPulse Phase 3: Authentication Setup
-- Run this in Supabase SQL Editor
-- ============================================================

-- Note: Supabase Auth users are created through the Auth API, not SQL.
-- This script sets up the supporting infrastructure.

-- 1. Create a profiles table to store additional user data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'viewer',
  company_id UUID,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SELECT 'profiles table created' AS status;
SELECT COUNT(*) AS profile_count FROM profiles;

-- ============================================================
-- IMPORTANT: CREATE TEST USER VIA SUPABASE DASHBOARD
-- ============================================================
-- 
-- 1. Go to Authentication → Users in Supabase Dashboard
-- 2. Click "Add user" → "Create new user"
-- 3. Enter:
--    Email: mwomack@missionmeetstech.com
--    Password: MissionPulse2026!
--    Auto-confirm: YES
--
-- 4. After creating, verify in SQL:
--    SELECT id, email, created_at FROM auth.users;
--
-- ============================================================
