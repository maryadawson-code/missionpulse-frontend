/**
 * Compliance Matrix template — maps raw DB compliance_requirements
 * to the ComplianceRow structure for XLSX generation.
 */

import type { ComplianceRow } from '../xlsx-engine'

interface ComplianceRequirementRecord {
  reference: string | null
  requirement: string | null
  section: string | null
  priority: string | null
  status: string | null
  assigned_to?: string | null
  notes?: string | null
  volume_reference?: string | null
}

/**
 * Map DB compliance_requirements rows to export-ready ComplianceRows.
 */
export function buildComplianceRows(
  records: ComplianceRequirementRecord[]
): ComplianceRow[] {
  return records.map((r) => ({
    reference: r.reference ?? '',
    requirement_text: r.requirement ?? '',
    section: r.section ?? '',
    priority: normalizePriority(r.priority),
    status: r.status ?? 'not_started',
    assigned_to: r.assigned_to ?? undefined,
    evidence: r.notes ?? undefined,
    eval_factor: r.volume_reference ?? undefined,
  }))
}

function normalizePriority(
  p: string | null
): 'critical' | 'high' | 'medium' | 'low' {
  const lower = (p ?? '').toLowerCase()
  if (lower === 'critical') return 'critical'
  if (lower === 'high') return 'high'
  if (lower === 'low') return 'low'
  return 'medium'
}
