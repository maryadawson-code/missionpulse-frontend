'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractPdfText } from '@/lib/utils/pdf-parser'
import { extractDocxText } from '@/lib/utils/docx-parser'
import { extractXlsxText } from '@/lib/utils/xlsx-text-extractor'
import { extractPptxText } from '@/lib/utils/pptx-parser'
import JSZip from 'jszip'
import type { ActionResult } from '@/lib/types'

// ─── Helper: extract text from a buffer based on MIME type ──────
async function extractText(buffer: Buffer, mimeType: string): Promise<{ text: string; status: string }> {
  try {
    if (mimeType === 'application/pdf') {
      const parsed = await extractPdfText(buffer)
      return { text: parsed.text, status: 'processed' }
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      const parsed = await extractDocxText(buffer)
      return { text: parsed.text, status: 'processed' }
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel'
    ) {
      const parsed = await extractXlsxText(buffer)
      return { text: parsed.text, status: 'processed' }
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      mimeType === 'application/vnd.ms-powerpoint'
    ) {
      const parsed = await extractPptxText(buffer)
      return { text: parsed.text, status: 'processed' }
    } else {
      return { text: buffer.toString('utf-8'), status: 'processed' }
    }
  } catch (err) {
    return {
      text: err instanceof Error ? err.message : 'Extraction failed',
      status: 'extraction_failed',
    }
  }
}

// ─── Helper: MIME type from file extension ──────────────────────
function mimeFromExt(ext: string): string {
  switch (ext) {
    case '.pdf': return 'application/pdf'
    case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case '.doc': return 'application/msword'
    case '.xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case '.xls': return 'application/vnd.ms-excel'
    case '.pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    case '.ppt': return 'application/vnd.ms-powerpoint'
    default: return 'text/plain'
  }
}

// ─── Generate a signed upload URL (bypasses Storage RLS) ────────
// Client calls this first, then uploads directly to the signed URL.

export async function createSignedUploadUrl(
  opportunityId: string,
  fileName: string
): Promise<ActionResult<{ token: string; storagePath: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const admin = createAdminClient()
    const storagePath = `rfp/${opportunityId}/${Date.now()}_${fileName}`

    const { data, error } = await admin.storage
      .from('documents')
      .createSignedUploadUrl(storagePath)

    if (error || !data) {
      return { success: false, error: `Failed to create upload URL: ${error?.message ?? 'unknown'}` }
    }

    return { success: true, data: { token: data.token, storagePath } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create upload URL'
    return { success: false, error: message }
  }
}

// ─── Process a single file already uploaded to Storage ──────────
// The client uploads via signed URL (bypasses Vercel body limit + Storage RLS),
// then calls this action with only metadata to extract text and create records.

export async function processStoredFile(
  opportunityId: string,
  storagePath: string,
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<ActionResult<{ documentId: string }>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Download from storage for text extraction (admin client bypasses RLS)
    const admin = createAdminClient()
    const { data: blob, error: downloadError } = await admin.storage
      .from('documents')
      .download(storagePath)

    if (downloadError || !blob) {
      return { success: false, error: `Failed to read file: ${downloadError?.message ?? 'unknown'}` }
    }

    const buffer = Buffer.from(await blob.arrayBuffer())
    const { text: extractedText, status: uploadStatus } = await extractText(buffer, fileType)

    // Insert rfp_documents record
    const { data: doc, error: insertError } = await supabase
      .from('rfp_documents')
      .insert({
        opportunity_id: opportunityId,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
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
        file_name: fileName,
        status: uploadStatus,
      },
    })

    // Audit log (immutable)
    await supabase.from('audit_logs').insert({
      action: 'upload_rfp',
      user_id: user.id,
      entity_type: 'rfp_document',
      entity_id: doc.id,
      details: { opportunity_id: opportunityId, file_name: fileName, upload_status: uploadStatus },
    })

    revalidatePath(`/pipeline/${opportunityId}/shredder`)
    return { success: true, data: { documentId: doc.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed'
    return { success: false, error: message }
  }
}

// ─── Process a ZIP already uploaded to Storage ──────────────────

const EXTRACTABLE_EXTENSIONS = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.txt']

export async function processStoredZip(
  opportunityId: string,
  storagePath: string,
  zipFileName: string,
  fileSize: number
): Promise<ActionResult<{ count: number; fileNames: string[] }>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Download ZIP from storage (admin client bypasses RLS)
    const admin = createAdminClient()
    const { data: blob, error: downloadError } = await admin.storage
      .from('documents')
      .download(storagePath)

    if (downloadError || !blob) {
      return { success: false, error: `Failed to read ZIP: ${downloadError?.message ?? 'unknown'}` }
    }

    const arrayBuffer = await blob.arrayBuffer()
    let zip: JSZip

    try {
      zip = await JSZip.loadAsync(arrayBuffer)
    } catch {
      return { success: false, error: 'Invalid or corrupted ZIP file' }
    }

    const processedFiles: string[] = []
    const entries = Object.entries(zip.files).filter(([name, entry]) => {
      if (entry.dir) return false
      if (name.startsWith('__MACOSX/') || name.startsWith('.')) return false
      const ext = name.substring(name.lastIndexOf('.')).toLowerCase()
      return EXTRACTABLE_EXTENSIONS.includes(ext)
    })

    if (entries.length === 0) {
      return { success: false, error: 'ZIP contains no supported documents (PDF, DOCX, XLSX, PPTX, TXT)' }
    }

    for (const [name, entry] of entries) {
      const entryBuffer = Buffer.from(await entry.async('arraybuffer'))
      const fileName = name.includes('/') ? name.substring(name.lastIndexOf('/') + 1) : name
      const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
      const mimeType = mimeFromExt(ext)

      // Upload extracted file to storage (admin bypasses RLS)
      const entryPath = `rfp/${opportunityId}/${Date.now()}_${fileName}`
      const { error: uploadError } = await admin.storage
        .from('documents')
        .upload(entryPath, entryBuffer, { contentType: mimeType, upsert: false })

      if (uploadError) continue

      const { text: extractedText, status: uploadStatus } = await extractText(entryBuffer, mimeType)

      // Insert record
      const { data: doc } = await supabase
        .from('rfp_documents')
        .insert({
          opportunity_id: opportunityId,
          file_name: fileName,
          file_type: mimeType,
          file_size: entryBuffer.length,
          storage_path: entryPath,
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
            source: `zip:${zipFileName}`,
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
            source_zip: zipFileName,
            upload_status: uploadStatus,
          },
        })
      }
    }

    // Clean up the ZIP from storage (individual files are already stored)
    await admin.storage.from('documents').remove([storagePath])

    revalidatePath(`/pipeline/${opportunityId}/shredder`)
    return {
      success: true,
      data: { count: processedFiles.length, fileNames: processedFiles },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ZIP processing failed'
    return { success: false, error: message }
  }
}

// ─── Delete ─────────────────────────────────────────────────────

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
    const admin = createAdminClient()
    await admin.storage.from('documents').remove([doc.storage_path])
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
