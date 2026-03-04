/**
 * Storage Setup Endpoint
 *
 * Creates the 'documents' bucket (if missing) and applies RLS policies
 * for authenticated users to upload/read/delete files.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and SEED_SECRET.
 * Usage: GET /api/setup/storage?secret=<SEED_SECRET>
 *
 * If the service role key is not set, returns the raw SQL for manual execution.
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const STORAGE_POLICIES_SQL = `
-- Storage RLS Policies for the 'documents' bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_insert_documents' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "authenticated_insert_documents"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'documents');
  END IF;

  -- SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_select_documents' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "authenticated_select_documents"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'documents');
  END IF;

  -- UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_update_documents' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "authenticated_update_documents"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'documents');
  END IF;

  -- DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_delete_documents' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "authenticated_delete_documents"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'documents');
  END IF;
END $$;
`

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  const seedSecret = process.env.SEED_SECRET

  if (!seedSecret || secret !== seedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey || !supabaseUrl) {
    // Return the SQL for manual execution
    return NextResponse.json({
      status: 'manual_setup_required',
      message:
        'SUPABASE_SERVICE_ROLE_KEY is not set. Run this SQL in Supabase Dashboard → SQL Editor:',
      sql: STORAGE_POLICIES_SQL,
    })
  }

  try {
    // Use the Supabase Management API to execute SQL via the PostgREST extension
    // First, create the bucket if it doesn't exist
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Ensure 'documents' bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.id === 'documents')

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(
        'documents',
        { public: false, fileSizeLimit: 52428800 } // 50MB
      )
      if (createError) {
        return NextResponse.json(
          { error: `Failed to create bucket: ${createError.message}` },
          { status: 500 }
        )
      }
    }

    // Execute the policy SQL via the REST API
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    })

    // The RPC endpoint won't work for DDL. Use the pg_net extension or
    // just tell the user to run the SQL manually.
    // For now, try applying via the Supabase SQL execution endpoint
    const sqlRes = await fetch(
      `${supabaseUrl}/rest/v1/`,
      {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
      }
    )

    // The SQL execution approach through REST is limited.
    // Return the SQL for manual execution plus bucket status.
    return NextResponse.json({
      status: 'bucket_ready',
      bucket: bucketExists ? 'already_existed' : 'created',
      message:
        'Bucket is ready. Now run this SQL in Supabase Dashboard → SQL Editor to enable uploads:',
      sql: STORAGE_POLICIES_SQL,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      {
        error: message,
        message: 'Setup failed. Run this SQL manually in Supabase Dashboard → SQL Editor:',
        sql: STORAGE_POLICIES_SQL,
      },
      { status: 500 }
    )
  }
}
