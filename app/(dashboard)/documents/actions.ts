'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { buildCompanyDocumentPath, DOCUMENTS_BUCKET } from '@/lib/utils/storage'
import type { ActionResult } from '@/lib/types'

export async function uploadCompanyDocument(
  formData: FormData
): Promise<ActionResult<{ documentId: string }>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const file = formData.get('file') as File | null
  const category = formData.get('category') as string | null

  if (!file) return { success: false, error: 'No file provided' }

  if (file.size > 50 * 1024 * 1024) {
    return { success: false, error: 'File exceeds maximum size of 50MB' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const companyId = profile?.company_id ?? 'default'
  const storagePath = buildCompanyDocumentPath(companyId, file.name)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` }
  }

  const { data: doc, error: insertError } = await supabase
    .from('documents')
    .insert({
      company_id: profile?.company_id ?? null,
      document_name: file.name,
      document_type: category || 'Templates',
      file_url: storagePath,
      file_size: file.size,
      mime_type: file.type,
      status: 'draft',
      current_version: 1,
      uploaded_by: user.id,
    })
    .select('id')
    .single()

  if (insertError) {
    return { success: false, error: `Failed to save: ${insertError.message}` }
  }

  await supabase.from('activity_log').insert({
    action: 'upload_company_document',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'document',
      entity_id: doc.id,
      file_name: file.name,
      category,
    },
  })

  revalidatePath('/documents')
  return { success: true, data: { documentId: doc.id } }
}
