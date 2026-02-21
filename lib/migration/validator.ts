/**
 * Data Migration Validator
 *
 * Validates imported records before committing to database.
 * Checks required fields, types, duplicates, and data integrity.
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ───────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  records: ValidatedRecord[]
  summary: {
    total: number
    valid: number
    warnings: number
    errors: number
    duplicates: number
  }
}

export interface ValidatedRecord {
  index: number
  data: Record<string, unknown>
  status: 'valid' | 'warning' | 'error'
  issues: ValidationIssue[]
}

export interface ValidationIssue {
  field: string
  type: 'error' | 'warning'
  message: string
}

export type ImportType = 'opportunities' | 'contacts' | 'past_performance'

// ─── Validation Rules ────────────────────────────────────────

const REQUIRED_FIELDS: Record<ImportType, string[]> = {
  opportunities: ['title'],
  contacts: ['full_name'],
  past_performance: ['title'],
}

const VALID_PHASES = [
  'Long Range',
  'Opportunity Assessment',
  'Capture Planning',
  'Proposal Development',
  'Post-Submission',
  'Awarded',
  'Lost',
  'No-Bid',
]

// ─── Validate Records ────────────────────────────────────────

/**
 * Validate an array of records before import.
 */
export async function validateRecords(
  records: Record<string, unknown>[],
  importType: ImportType,
  companyId: string
): Promise<ValidationResult> {
  const validatedRecords: ValidatedRecord[] = []
  let duplicateCount = 0

  // Check for duplicates within the batch
  const seenTitles = new Set<string>()

  // Check for existing records in the database
  const existingTitles = await getExistingTitles(importType, companyId)

  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    const issues: ValidationIssue[] = []

    // Required field checks
    for (const field of REQUIRED_FIELDS[importType]) {
      const value = record[field]
      if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
        issues.push({
          field,
          type: 'error',
          message: `Required field "${field}" is missing`,
        })
      }
    }

    // Type-specific validation
    if (importType === 'opportunities') {
      validateOpportunity(record, issues)
    } else if (importType === 'contacts') {
      validateContact(record, issues)
    } else if (importType === 'past_performance') {
      validatePastPerformance(record, issues)
    }

    // Duplicate detection — within batch
    const title = String(record.title ?? record.full_name ?? '').toLowerCase().trim()
    if (title && seenTitles.has(title)) {
      issues.push({
        field: 'title',
        type: 'warning',
        message: 'Duplicate record within this import batch',
      })
      duplicateCount++
    }
    seenTitles.add(title)

    // Duplicate detection — against database
    if (title && existingTitles.has(title)) {
      issues.push({
        field: 'title',
        type: 'warning',
        message: 'Record with this title already exists in MissionPulse',
      })
      duplicateCount++
    }

    const hasErrors = issues.some((i) => i.type === 'error')
    const hasWarnings = issues.some((i) => i.type === 'warning')

    validatedRecords.push({
      index: i,
      data: record,
      status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'valid',
      issues,
    })
  }

  const errorCount = validatedRecords.filter((r) => r.status === 'error').length
  const warningCount = validatedRecords.filter((r) => r.status === 'warning').length
  const validCount = validatedRecords.filter((r) => r.status === 'valid').length

  return {
    valid: errorCount === 0,
    records: validatedRecords,
    summary: {
      total: records.length,
      valid: validCount,
      warnings: warningCount,
      errors: errorCount,
      duplicates: duplicateCount,
    },
  }
}

// ─── Type-Specific Validation ────────────────────────────────

function validateOpportunity(record: Record<string, unknown>, issues: ValidationIssue[]) {
  // Ceiling must be a positive number
  if (record.ceiling !== null && record.ceiling !== undefined) {
    const ceiling = Number(record.ceiling)
    if (isNaN(ceiling)) {
      issues.push({ field: 'ceiling', type: 'error', message: 'Ceiling must be a number' })
    } else if (ceiling < 0) {
      issues.push({ field: 'ceiling', type: 'error', message: 'Ceiling cannot be negative' })
    }
  }

  // pWin must be 0-100
  if (record.pwin !== null && record.pwin !== undefined) {
    const pwin = Number(record.pwin)
    if (isNaN(pwin)) {
      issues.push({ field: 'pwin', type: 'error', message: 'pWin must be a number' })
    } else if (pwin < 0 || pwin > 100) {
      issues.push({ field: 'pwin', type: 'warning', message: 'pWin should be between 0 and 100' })
    }
  }

  // Phase validation
  if (record.phase && typeof record.phase === 'string') {
    if (!VALID_PHASES.includes(record.phase)) {
      issues.push({
        field: 'phase',
        type: 'warning',
        message: `Unknown phase "${record.phase}". Valid: ${VALID_PHASES.join(', ')}`,
      })
    }
  }

  // Deadline should be in the future
  if (record.deadline && typeof record.deadline === 'string') {
    const deadline = new Date(record.deadline)
    if (isNaN(deadline.getTime())) {
      issues.push({ field: 'deadline', type: 'error', message: 'Invalid date format' })
    } else if (deadline < new Date()) {
      issues.push({ field: 'deadline', type: 'warning', message: 'Deadline is in the past' })
    }
  }

  // NAICS code format (6 digits)
  if (record.naics_code && typeof record.naics_code === 'string') {
    if (!/^\d{6}$/.test(record.naics_code)) {
      issues.push({ field: 'naics_code', type: 'warning', message: 'NAICS code should be 6 digits' })
    }
  }

  // Contact email format
  if (record.contact_email && typeof record.contact_email === 'string') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.contact_email)) {
      issues.push({ field: 'contact_email', type: 'warning', message: 'Invalid email format' })
    }
  }
}

function validateContact(record: Record<string, unknown>, issues: ValidationIssue[]) {
  // Email validation
  if (record.email && typeof record.email === 'string') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
      issues.push({ field: 'email', type: 'error', message: 'Invalid email format' })
    }
  }

  // Phone format (basic check)
  if (record.phone && typeof record.phone === 'string') {
    const digits = record.phone.replace(/\D/g, '')
    if (digits.length < 10) {
      issues.push({ field: 'phone', type: 'warning', message: 'Phone number appears incomplete' })
    }
  }
}

function validatePastPerformance(record: Record<string, unknown>, issues: ValidationIssue[]) {
  // Value must be positive
  if (record.value !== null && record.value !== undefined) {
    const value = Number(record.value)
    if (isNaN(value)) {
      issues.push({ field: 'value', type: 'error', message: 'Value must be a number' })
    } else if (value < 0) {
      issues.push({ field: 'value', type: 'error', message: 'Value cannot be negative' })
    }
  }

  // Date range validation
  if (record.start_date && record.end_date) {
    const start = new Date(String(record.start_date))
    const end = new Date(String(record.end_date))
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
      issues.push({ field: 'end_date', type: 'error', message: 'End date is before start date' })
    }
  }
}

// ─── Database Helpers ────────────────────────────────────────

async function getExistingTitles(importType: ImportType, companyId: string): Promise<Set<string>> {
  const supabase = await createClient()
  const titles = new Set<string>()

  if (importType === 'opportunities') {
    const { data } = await supabase
      .from('opportunities')
      .select('title')
      .eq('company_id', companyId)
      .limit(1000)

    if (data) {
      for (const row of data) {
        titles.add((row.title ?? '').toLowerCase().trim())
      }
    }
  }

  return titles
}

// ─── Batch Import ────────────────────────────────────────────

/**
 * Import validated records into the database.
 * Returns batch ID for undo support.
 */
export async function importBatch(
  records: ValidatedRecord[],
  importType: ImportType,
  companyId: string,
  userId: string
): Promise<{ batchId: string; imported: number; error?: string }> {
  const supabase = await createClient()
  const batchId = crypto.randomUUID()
  const now = new Date().toISOString()

  // Filter to valid/warning records only (skip errors)
  const importable = records.filter((r) => r.status !== 'error')

  if (importable.length === 0) {
    return { batchId, imported: 0, error: 'No valid records to import' }
  }

  try {
    if (importType === 'opportunities') {
      const opps = importable.map((r) => ({
        title: String(r.data.title ?? 'Untitled'),
        agency: r.data.agency ? String(r.data.agency) : null,
        ceiling: r.data.ceiling ? Number(r.data.ceiling) : null,
        naics_code: r.data.naics_code ? String(r.data.naics_code) : null,
        phase: r.data.phase ? String(r.data.phase) : 'Long Range',
        pwin: r.data.pwin ? Number(r.data.pwin) : null,
        deadline: r.data.deadline ? String(r.data.deadline) : null,
        description: r.data.description ? String(r.data.description) : null,
        solicitation_number: r.data.solicitation_number ? String(r.data.solicitation_number) : null,
        set_aside: r.data.set_aside ? String(r.data.set_aside) : null,
        contact_name: r.data.contact_name ? String(r.data.contact_name) : null,
        contact_email: r.data.contact_email ? String(r.data.contact_email) : null,
        company_id: companyId,
        owner_id: userId,
        deal_source: 'import' as const,
        metadata: JSON.parse(JSON.stringify({
          import_batch_id: batchId,
          imported_at: now,
        })),
      }))

      const { error } = await supabase.from('opportunities').insert(opps)
      if (error) return { batchId, imported: 0, error: error.message }
    }

    // Log the import batch for undo support
    await supabase.from('audit_logs').insert({
      action: 'data_import',
      table_name: importType,
      record_id: batchId,
      user_id: userId,
      new_values: JSON.parse(JSON.stringify({
        batch_id: batchId,
        import_type: importType,
        record_count: importable.length,
        imported_at: now,
      })),
    })

    return { batchId, imported: importable.length }
  } catch (err) {
    return {
      batchId,
      imported: 0,
      error: err instanceof Error ? err.message : 'Import failed',
    }
  }
}

/**
 * Undo an import batch (delete all records from a batch).
 * Only allowed within 24 hours of import.
 */
export async function undoImportBatch(
  batchId: string,
  importType: ImportType,
  userId: string
): Promise<{ success: boolean; deleted: number; error?: string }> {
  const supabase = await createClient()

  // Verify batch exists and is within 24hr window
  const { data: auditLog } = await supabase
    .from('audit_logs')
    .select('created_at')
    .eq('record_id', batchId)
    .eq('action', 'data_import')
    .single()

  if (!auditLog) {
    return { success: false, deleted: 0, error: 'Import batch not found' }
  }

  const importedAt = new Date(auditLog.created_at)
  const hoursSinceImport = (Date.now() - importedAt.getTime()) / (1000 * 60 * 60)

  if (hoursSinceImport > 24) {
    return { success: false, deleted: 0, error: 'Undo window expired (24 hours)' }
  }

  if (importType === 'opportunities') {
    // Use RPC or direct delete with metadata filter
    const { data, error } = await supabase
      .from('opportunities')
      .delete()
      .contains('metadata', { import_batch_id: batchId })
      .select('id')

    if (error) return { success: false, deleted: 0, error: error.message }

    // Log the undo
    await supabase.from('audit_logs').insert({
      action: 'data_import_undo',
      table_name: importType,
      record_id: batchId,
      user_id: userId,
      new_values: JSON.parse(JSON.stringify({
        batch_id: batchId,
        records_deleted: data?.length ?? 0,
      })),
    })

    return { success: true, deleted: data?.length ?? 0 }
  }

  return { success: false, deleted: 0, error: `Undo not supported for ${importType}` }
}
