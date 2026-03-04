-- Add unique constraint on (opportunity_id, file_name) to prevent duplicate uploads.
-- Application-level dedup is already in place (actions.ts), this is the DB backstop.
-- If duplicates already exist, deduplicate first by keeping the most recent row.

-- Step 1: Remove duplicates (keep newest by created_at)
DELETE FROM rfp_documents a
USING rfp_documents b
WHERE a.opportunity_id = b.opportunity_id
  AND a.file_name = b.file_name
  AND a.created_at < b.created_at;

-- Step 2: Add the unique constraint
ALTER TABLE rfp_documents
  ADD CONSTRAINT rfp_documents_opportunity_file_unique
  UNIQUE (opportunity_id, file_name);
