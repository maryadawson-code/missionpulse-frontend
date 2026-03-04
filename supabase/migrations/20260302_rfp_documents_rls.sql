-- Fix RLS policies for rfp_documents table
-- The table has no company_id column — policies join through
-- opportunity_id → opportunities to enforce access control.
--
-- Uses two layers of INSERT policies (permissive OR):
-- 1. Company-scoped: opportunity belongs to user's company
-- 2. Owner-scoped: opportunity is owned by the current user
-- This handles opportunities with NULL company_id (e.g. imports).

-- Drop ALL existing policies to start clean
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'rfp_documents'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.rfp_documents', pol.policyname);
  END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.rfp_documents ENABLE ROW LEVEL SECURITY;

-- SELECT: users can view documents for opportunities they can access
CREATE POLICY "rfp_docs_select_company"
  ON public.rfp_documents FOR SELECT
  USING (
    opportunity_id IN (
      SELECT id FROM public.opportunities
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
      OR owner_id = auth.uid()
    )
  );

-- INSERT: users can add documents to opportunities they can access
CREATE POLICY "rfp_docs_insert_company"
  ON public.rfp_documents FOR INSERT
  WITH CHECK (
    opportunity_id IN (
      SELECT id FROM public.opportunities
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
      OR owner_id = auth.uid()
    )
  );

-- UPDATE: users can update documents for opportunities they can access
CREATE POLICY "rfp_docs_update_company"
  ON public.rfp_documents FOR UPDATE
  USING (
    opportunity_id IN (
      SELECT id FROM public.opportunities
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
      OR owner_id = auth.uid()
    )
  );

-- DELETE: users can delete documents for opportunities they can access
CREATE POLICY "rfp_docs_delete_company"
  ON public.rfp_documents FOR DELETE
  USING (
    opportunity_id IN (
      SELECT id FROM public.opportunities
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
      OR owner_id = auth.uid()
    )
  );
