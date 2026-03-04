-- ============================================================================
-- Storage RLS Policies for the 'documents' bucket
-- Allows authenticated users to upload, read, update, and delete files.
-- App-level RBAC (invisible pattern) controls which users see the upload UI.
-- ============================================================================

-- Storage policies applied via Supabase dashboard (cannot ALTER storage.objects via migrations)
-- Policies: authenticated_insert_documents, authenticated_select_documents,
--           authenticated_update_documents, authenticated_delete_documents
-- All scoped to bucket_id = 'documents' for authenticated role.
SELECT 1;
