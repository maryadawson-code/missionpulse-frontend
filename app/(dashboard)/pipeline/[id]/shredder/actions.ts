'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'

// ─── Helper: extract text from a buffer based on MIME type ──────
async function extractText(buffer: Buffer, mimeType: string): Promise<{ text: string; status: string }> {
  try {
    if (mimeType === 'application/pdf') {
      const { extractPdfText } = await import('@/lib/utils/pdf-parser')
      const parsed = await extractPdfText(buffer)
      return { text: parsed.text, status: 'processed' }
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      const { extractDocxText } = await import('@/lib/utils/docx-parser')
      const parsed = await extractDocxText(buffer)
      return { text: parsed.text, status: 'processed' }
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel'
    ) {
      const { extractXlsxText } = await import('@/lib/utils/xlsx-text-extractor')
      const parsed = await extractXlsxText(buffer)
      return { text: parsed.text, status: 'processed' }
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      mimeType === 'application/vnd.ms-powerpoint'
    ) {
      const { extractPptxText } = await import('@/lib/utils/pptx-parser')
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

// ─── Upload + process a single file ─────────────────────────────
// File data comes in via FormData. Text is extracted on the server
// and saved to rfp_documents. No Supabase Storage dependency.

export async function uploadRfpFile(
  opportunityId: string,
  formData: FormData
): Promise<ActionResult<{ documentId: string }>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const file = formData.get('file') as File | null
    if (!file) return { success: false, error: 'No file provided' }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { text: extractedText, status: uploadStatus } = await extractText(buffer, file.type)

    const { data: doc, error: insertError } = await supabase
      .from('rfp_documents')
      .insert({
        opportunity_id: opportunityId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: null,
        extracted_text: extractedText,
        upload_status: uploadStatus,
      })
      .select('id')
      .single()

    if (insertError) {
      return { success: false, error: `Failed to save document: ${insertError.message}` }
    }

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

    await supabase.from('audit_logs').insert({
      action: 'upload_rfp',
      user_id: user.id,
      entity_type: 'rfp_document',
      entity_id: doc.id,
      details: { opportunity_id: opportunityId, file_name: file.name, upload_status: uploadStatus },
    })

    revalidatePath(`/pipeline/${opportunityId}/shredder`)
    return { success: true, data: { documentId: doc.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed'
    return { success: false, error: message }
  }
}

// ─── Upload + process a ZIP file ────────────────────────────────

const EXTRACTABLE_EXTENSIONS = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.txt']

export async function uploadRfpZip(
  opportunityId: string,
  formData: FormData
): Promise<ActionResult<{ count: number; fileNames: string[] }>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const file = formData.get('file') as File | null
    if (!file) return { success: false, error: 'No file provided' }

    const arrayBuffer = await file.arrayBuffer()
    const JSZip = (await import('jszip')).default
    let zip: InstanceType<typeof JSZip>

    try {
      zip = await JSZip.loadAsync(arrayBuffer)
    } catch {
      return { success: false, error: 'Invalid or corrupted ZIP file' }
    }

    const entries = Object.entries(zip.files).filter(([name, entry]) => {
      if (entry.dir) return false
      if (name.startsWith('__MACOSX/') || name.startsWith('.')) return false
      const ext = name.substring(name.lastIndexOf('.')).toLowerCase()
      return EXTRACTABLE_EXTENSIONS.includes(ext)
    })

    if (entries.length === 0) {
      return { success: false, error: 'ZIP contains no supported documents (PDF, DOCX, XLSX, PPTX, TXT)' }
    }

    const processedFiles: string[] = []

    for (const [name, entry] of entries) {
      const entryBuffer = Buffer.from(await entry.async('arraybuffer'))
      const fileName = name.includes('/') ? name.substring(name.lastIndexOf('/') + 1) : name
      const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
      const mimeType = mimeFromExt(ext)

      const { text: extractedText, status: uploadStatus } = await extractText(entryBuffer, mimeType)

      const { data: doc } = await supabase
        .from('rfp_documents')
        .insert({
          opportunity_id: opportunityId,
          file_name: fileName,
          file_type: mimeType,
          file_size: entryBuffer.length,
          storage_path: null,
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: doc } = await supabase
    .from('rfp_documents')
    .select('storage_path, file_name')
    .eq('id', documentId)
    .single()

  // Clean up Storage file if one exists (legacy uploads)
  if (doc?.storage_path) {
    await supabase.storage.from('documents').remove([doc.storage_path]).catch(() => {})
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
