-- ============================================================================
-- Storage RLS Policies for the 'documents' bucket
-- Allows authenticated users to upload, read, update, and delete files.
-- App-level RBAC (invisible pattern) controls which users see the upload UI.
-- ============================================================================

-- Ensure RLS is enabled on storage.objects (should already be enabled by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload (INSERT) to the documents bucket
CREATE POLICY "authenticated_insert_documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to read/download (SELECT) from the documents bucket
CREATE POLICY "authenticated_select_documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

-- Allow authenticated users to update files in the documents bucket
CREATE POLICY "authenticated_update_documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents');

-- Allow authenticated users to delete files from the documents bucket
CREATE POLICY "authenticated_delete_documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');
