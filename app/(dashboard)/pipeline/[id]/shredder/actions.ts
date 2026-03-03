'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'
import { runComplianceExtraction } from '@/lib/ai/agents/compliance'
import { parseExtractedRequirements } from '@/lib/ai/agents/parsers'

// ─── Helper: extract PDF text using pdfjs-dist directly ─────
// pdfjs-dist is externalized via serverComponentsExternalPackages in
// next.config.mjs so webpack keeps it as a native require() instead of
// bundling the browser build (which needs DOMMatrix, a browser-only API).
async function extractPdfTextInline(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise

  try {
    const pages: string[] = []
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items
        .filter((item: Record<string, unknown>) => 'str' in item)
        .map((item: Record<string, unknown>) => item.str as string)
        .join(' ')
      pages.push(pageText)
    }
    return pages.join('\n')
  } finally {
    await doc.destroy()
  }
}

// ─── Helper: extract text from a buffer based on MIME type ──────
async function extractText(buffer: Buffer, mimeType: string): Promise<{ text: string; status: string }> {
  try {
    if (mimeType === 'application/pdf') {
      const text = await extractPdfTextInline(buffer)
      return { text, status: 'processed' }
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
    const msg = err instanceof Error ? err.message : 'Extraction failed'
    console.error('[extractText] FAILED for', mimeType, ':', msg)
    return {
      text: msg,
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

    // Ensure opportunity has company_id for RLS (fixes NULL company_id)
    await ensureOpportunityCompanyId(supabase, opportunityId, user.id)

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
): Promise<ActionResult<{ count: number; fileNames: string[]; documentIds: string[] }>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Ensure opportunity has company_id for RLS (fixes NULL company_id)
    await ensureOpportunityCompanyId(supabase, opportunityId, user.id)

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
    const documentIds: string[] = []

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
        documentIds.push(doc.id)

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
      data: { count: processedFiles.length, fileNames: processedFiles, documentIds },
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

// ─── Shred: AI extraction on a single document ──────────────────

export async function shredDocument(
  documentId: string,
  opportunityId: string
): Promise<ActionResult<{ requirementCount: number }>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Fetch document text
    const { data: doc, error: docError } = await supabase
      .from('rfp_documents')
      .select('id, extracted_text, file_name, upload_status')
      .eq('id', documentId)
      .single()

    if (docError || !doc) {
      return { success: false, error: 'Document not found' }
    }

    if (!doc.extracted_text || doc.extracted_text.length < 50) {
      await supabase
        .from('rfp_documents')
        .update({ upload_status: 'shred_failed' })
        .eq('id', documentId)
      return { success: false, error: 'Insufficient extracted text (less than 50 characters)' }
    }

    // Mark as shredding
    await supabase
      .from('rfp_documents')
      .update({ upload_status: 'shredding' })
      .eq('id', documentId)

    // Run AI extraction
    const response = await runComplianceExtraction({
      sourceText: doc.extracted_text.slice(0, 8000),
      opportunityId,
    })

    // Detect AI pipeline fallback (model_used === 'none' means the AI call failed)
    if (response.model_used === 'none') {
      await supabase
        .from('rfp_documents')
        .update({ upload_status: 'shred_failed' })
        .eq('id', documentId)
      // Surface the ACTUAL error from the AI pipeline — don't swallow it
      const errorMsg = response.content.startsWith('AI processing failed: ')
        ? response.content.replace('AI processing failed: ', '')
        : response.content
      return { success: false, error: errorMsg }
    }

    // Parse requirements from AI response
    const parsed = parseExtractedRequirements(response.content)

    if (parsed.length === 0) {
      await supabase
        .from('rfp_documents')
        .update({ upload_status: 'shred_failed' })
        .eq('id', documentId)
      return { success: false, error: 'AI could not extract any requirements from this document' }
    }

    // Get existing requirement count for REQ numbering
    const { count: existingCount } = await supabase
      .from('compliance_requirements')
      .select('id', { count: 'exact', head: true })
      .eq('opportunity_id', opportunityId)

    const startIdx = (existingCount ?? 0) + 1

    // Get user's company_id for the insert
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    // Bulk insert requirements
    // DB CHECK constraints use specific allowed values — omit section to avoid constraint
    // mismatches (users can set section manually; column is nullable)
    const VALID_PRIORITIES = ['critical', 'high', 'medium', 'low'] as const
    const rows = parsed.map((req, i) => {
      const priorityLower = req.priority.toLowerCase()
      return {
        opportunity_id: opportunityId,
        company_id: profile?.company_id ?? null,
        reference: `REQ-${String(startIdx + i).padStart(3, '0')}`,
        requirement: req.requirement,
        priority: VALID_PRIORITIES.includes(priorityLower as typeof VALID_PRIORITIES[number])
          ? priorityLower
          : 'medium',
        status: 'not_started',
        notes: `Auto-extracted from ${doc.file_name} | Section: ${req.section} | Confidence: ${req.confidence} | ${req.because}`,
      }
    })

    const { error: insertError } = await supabase
      .from('compliance_requirements')
      .insert(rows)

    if (insertError) {
      await supabase
        .from('rfp_documents')
        .update({ upload_status: 'shred_failed' })
        .eq('id', documentId)
      return { success: false, error: `Failed to save requirements: ${insertError.message}` }
    }

    // Mark as shredded
    await supabase
      .from('rfp_documents')
      .update({ upload_status: 'shredded' })
      .eq('id', documentId)

    // Audit trail
    await supabase.from('activity_log').insert({
      action: 'shred_document',
      user_name: user.email ?? 'Unknown',
      details: {
        entity_type: 'rfp_document',
        entity_id: documentId,
        opportunity_id: opportunityId,
        file_name: doc.file_name,
        requirements_extracted: parsed.length,
      },
    })

    await supabase.from('audit_logs').insert({
      action: 'shred_document',
      user_id: user.id,
      entity_type: 'rfp_document',
      entity_id: documentId,
      details: {
        opportunity_id: opportunityId,
        file_name: doc.file_name,
        requirements_extracted: parsed.length,
        model_used: response.model_used,
        tokens_in: response.tokens_in,
        tokens_out: response.tokens_out,
      },
    })

    revalidatePath(`/pipeline/${opportunityId}/shredder`)
    revalidatePath(`/pipeline/${opportunityId}/shredder/requirements`)
    revalidatePath(`/pipeline/${opportunityId}/compliance`)

    return { success: true, data: { requirementCount: parsed.length } }
  } catch (err) {
    // Attempt to mark failure
    try {
      const supabase = await createClient()
      await supabase
        .from('rfp_documents')
        .update({ upload_status: 'shred_failed' })
        .eq('id', documentId)
    } catch { /* best-effort */ }

    const message = err instanceof Error ? err.message : 'Shredding failed'
    return { success: false, error: message }
  }
}

// ─── Helper: ensure opportunity has company_id ──────────────────
// If the opportunity's company_id is NULL (e.g. imported without one),
// set it to the current user's company_id so RLS policies pass.

async function ensureOpportunityCompanyId(
  supabase: ReturnType<typeof createClient>,
  opportunityId: string,
  userId: string
) {
  const { data: opp } = await supabase
    .from('opportunities')
    .select('company_id')
    .eq('id', opportunityId)
    .single()

  if (opp?.company_id) return // Already set

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .single()

  if (!profile?.company_id) return // User has no company either

  await supabase
    .from('opportunities')
    .update({ company_id: profile.company_id })
    .eq('id', opportunityId)
}
