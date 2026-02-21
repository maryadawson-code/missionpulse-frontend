'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { buildDocumentPath, DOCUMENTS_BUCKET } from '@/lib/utils/storage'
import type { ActionResult } from '@/lib/types'

export async function uploadDocument(
  opportunityId: string,
  formData: FormData
): Promise<ActionResult<{ documentId: string }>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const file = formData.get('file') as File | null
  const category = formData.get('category') as string | null
  const description = formData.get('description') as string | null

  if (!file) return { success: false, error: 'No file provided' }

  if (file.size > 50 * 1024 * 1024) {
    return { success: false, error: 'File exceeds maximum size of 50MB' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const storagePath = buildDocumentPath(opportunityId, file.name)
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
      opportunity_id: opportunityId,
      company_id: profile?.company_id ?? null,
      document_name: file.name,
      document_type: category || 'Support',
      description: description || null,
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
    return { success: false, error: `Failed to save document: ${insertError.message}` }
  }

  // Create initial version record
  await supabase.from('document_versions').insert({
    document_id: doc.id,
    opportunity_id: opportunityId,
    company_id: profile?.company_id ?? null,
    version_number: 1,
    version_label: 'v1',
    file_url: storagePath,
    file_size: file.size,
    document_type: file.type,
    created_by: user.id,
    changes_summary: 'Initial upload',
  })

  await supabase.from('activity_log').insert({
    action: 'upload_document',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'document',
      entity_id: doc.id,
      opportunity_id: opportunityId,
      file_name: file.name,
    },
  })

  revalidatePath(`/pipeline/${opportunityId}/documents`)
  return { success: true, data: { documentId: doc.id } }
}

export async function reuploadDocument(
  documentId: string,
  opportunityId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const file = formData.get('file') as File | null
  if (!file) return { success: false, error: 'No file provided' }

  // Get current document
  const { data: doc } = await supabase
    .from('documents')
    .select('current_version, company_id')
    .eq('id', documentId)
    .single()

  if (!doc) return { success: false, error: 'Document not found' }

  const newVersion = (doc.current_version ?? 1) + 1
  const storagePath = buildDocumentPath(opportunityId, file.name)
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

  // Update document record
  const { error: updateError } = await supabase
    .from('documents')
    .update({
      file_url: storagePath,
      file_size: file.size,
      mime_type: file.type,
      current_version: newVersion,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Create version record
  await supabase.from('document_versions').insert({
    document_id: documentId,
    opportunity_id: opportunityId,
    company_id: doc.company_id,
    version_number: newVersion,
    version_label: `v${newVersion}`,
    file_url: storagePath,
    file_size: file.size,
    document_type: file.type,
    created_by: user.id,
    changes_summary: `Re-uploaded as v${newVersion}`,
  })

  await supabase.from('activity_log').insert({
    action: 'reupload_document',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'document',
      entity_id: documentId,
      opportunity_id: opportunityId,
      new_version: newVersion,
    },
  })

  revalidatePath(`/pipeline/${opportunityId}/documents`)
  return { success: true }
}

export async function deleteDocument(
  documentId: string,
  opportunityId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Soft delete by setting status to 'archived'
  const { error } = await supabase
    .from('documents')
    .update({
      status: 'archived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'delete_document',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'document',
      entity_id: documentId,
      opportunity_id: opportunityId,
    },
  })

  revalidatePath(`/pipeline/${opportunityId}/documents`)
  return { success: true }
}
