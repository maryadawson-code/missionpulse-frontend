'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { extractPdfText } from '@/lib/utils/pdf-parser'
import { extractDocxText } from '@/lib/utils/docx-parser'
import JSZip from 'jszip'
import type { ActionResult } from '@/lib/types'

export async function uploadAndParseRfp(
  opportunityId: string,
  formData: FormData
): Promise<ActionResult<{ documentId: string }>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const file = formData.get('file') as File | null
  if (!file) return { success: false, error: 'No file provided' }

  if (file.size > 50 * 1024 * 1024) {
    return { success: false, error: 'File exceeds maximum size of 50MB' }
  }

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ]
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Unsupported file type. Upload PDF, DOCX, DOC, or TXT files.' }
  }

  // Upload to Supabase Storage
  const storagePath = `rfp/${opportunityId}/${Date.now()}_${file.name}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` }
  }

  // Extract text based on file type
  let extractedText = ''
  let uploadStatus = 'processed'

  try {
    if (file.type === 'application/pdf') {
      const parsed = await extractPdfText(buffer)
      extractedText = parsed.text
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      const parsed = await extractDocxText(buffer)
      extractedText = parsed.text
    } else {
      // text/plain
      extractedText = buffer.toString('utf-8')
    }
  } catch (err) {
    uploadStatus = 'extraction_failed'
    extractedText = err instanceof Error ? err.message : 'Extraction failed'
  }

  // Insert rfp_documents record
  const { data: doc, error: insertError } = await supabase
    .from('rfp_documents')
    .insert({
      opportunity_id: opportunityId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
      extracted_text: extractedText,
      upload_status: uploadStatus,
    })
    .select('id')
    .single()

  if (insertError) {
    return { success: false, error: `Failed to save document: ${insertError.message}` }
  }

  // Activity log
  await supabase.from('activity_log').insert({
    action: 'upload_rfp',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'rfp_document',
      entity_id: doc.id,
      opportunity_id: opportunityId,
      file_name: file.name,
      status: uploadStatus,
    },
  })

  // Audit log (immutable)
  await supabase.from('audit_logs').insert({
    action: 'upload_rfp',
    user_id: user.id,
    entity_type: 'rfp_document',
    entity_id: doc.id,
    details: { opportunity_id: opportunityId, file_name: file.name, upload_status: uploadStatus },
  })

  revalidatePath(`/pipeline/${opportunityId}/shredder`)
  return { success: true, data: { documentId: doc.id } }
}

// ─── ZIP Upload (SAM.gov packages) ────────────────────────────

const EXTRACTABLE_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt']

export async function uploadAndParseZip(
  opportunityId: string,
  formData: FormData
): Promise<ActionResult<{ count: number; fileNames: string[] }>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const file = formData.get('file') as File | null
  if (!file) return { success: false, error: 'No file provided' }

  if (file.size > 50 * 1024 * 1024) {
    return { success: false, error: 'ZIP file exceeds maximum size of 50MB' }
  }

  const arrayBuffer = await file.arrayBuffer()
  let zip: JSZip

  try {
    zip = await JSZip.loadAsync(arrayBuffer)
  } catch {
    return { success: false, error: 'Invalid or corrupted ZIP file' }
  }

  const processedFiles: string[] = []
  const entries = Object.entries(zip.files).filter(([name, entry]) => {
    if (entry.dir) return false
    // Skip macOS resource forks and hidden files
    if (name.startsWith('__MACOSX/') || name.startsWith('.')) return false
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase()
    return EXTRACTABLE_EXTENSIONS.includes(ext)
  })

  if (entries.length === 0) {
    return { success: false, error: 'ZIP contains no supported documents (PDF, DOCX, DOC, TXT)' }
  }

  for (const [name, entry] of entries) {
    const entryBuffer = Buffer.from(await entry.async('arraybuffer'))
    const fileName = name.includes('/') ? name.substring(name.lastIndexOf('/') + 1) : name
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()

    // Determine MIME type from extension
    let mimeType = 'text/plain'
    if (ext === '.pdf') mimeType = 'application/pdf'
    else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    else if (ext === '.doc') mimeType = 'application/msword'

    // Upload to storage
    const storagePath = `rfp/${opportunityId}/${Date.now()}_${fileName}`
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, entryBuffer, { contentType: mimeType, upsert: false })

    if (uploadError) continue

    // Extract text
    let extractedText = ''
    let uploadStatus = 'processed'

    try {
      if (ext === '.pdf') {
        const parsed = await extractPdfText(entryBuffer)
        extractedText = parsed.text
      } else if (ext === '.docx' || ext === '.doc') {
        const parsed = await extractDocxText(entryBuffer)
        extractedText = parsed.text
      } else {
        extractedText = entryBuffer.toString('utf-8')
      }
    } catch {
      uploadStatus = 'extraction_failed'
      extractedText = 'Extraction failed'
    }

    // Insert record
    const { data: doc } = await supabase
      .from('rfp_documents')
      .insert({
        opportunity_id: opportunityId,
        file_name: fileName,
        file_type: mimeType,
        file_size: entryBuffer.length,
        storage_path: storagePath,
        extracted_text: extractedText,
        upload_status: uploadStatus,
      })
      .select('id')
      .single()

    if (doc) {
      processedFiles.push(fileName)

      await supabase.from('activity_log').insert({
        action: 'upload_rfp',
        user_name: user.email ?? 'Unknown',
        details: {
          entity_type: 'rfp_document',
          entity_id: doc.id,
          opportunity_id: opportunityId,
          file_name: fileName,
          source: `zip:${file.name}`,
          status: uploadStatus,
        },
      })

      await supabase.from('audit_logs').insert({
        action: 'upload_rfp',
        user_id: user.id,
        entity_type: 'rfp_document',
        entity_id: doc.id,
        details: {
          opportunity_id: opportunityId,
          file_name: fileName,
          source_zip: file.name,
          upload_status: uploadStatus,
        },
      })
    }
  }

  revalidatePath(`/pipeline/${opportunityId}/shredder`)
  return {
    success: true,
    data: { count: processedFiles.length, fileNames: processedFiles },
  }
}

export async function deleteRfpDocument(
  documentId: string,
  opportunityId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Fetch storage path to delete file
  const { data: doc } = await supabase
    .from('rfp_documents')
    .select('storage_path, file_name')
    .eq('id', documentId)
    .single()

  if (doc?.storage_path) {
    await supabase.storage.from('documents').remove([doc.storage_path])
  }

  const { error } = await supabase
    .from('rfp_documents')
    .delete()
    .eq('id', documentId)

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'delete_rfp',
    user_name: user.email ?? 'Unknown',
    details: {
      entity_type: 'rfp_document',
      entity_id: documentId,
      opportunity_id: opportunityId,
      file_name: doc?.file_name,
    },
  })

  await supabase.from('audit_logs').insert({
    action: 'delete_rfp',
    user_id: user.id,
    entity_type: 'rfp_document',
    entity_id: documentId,
    details: { opportunity_id: opportunityId, file_name: doc?.file_name },
  })

  revalidatePath(`/pipeline/${opportunityId}/shredder`)
  return { success: true }
}
