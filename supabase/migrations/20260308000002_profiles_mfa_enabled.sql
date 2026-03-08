-- Add mfa_enabled column to profiles.
-- Resolves: is_mfa_enabled() EXCEPTION handler silently returning FALSE.
-- This migration is safe to run — adds column with default false, no data loss.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mfa_enabled boolean NOT NULL DEFAULT false;

-- Replace the stub function with a real implementation
CREATE OR REPLACE FUNCTION public.is_mfa_enabled()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(mfa_enabled, false)
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$;
