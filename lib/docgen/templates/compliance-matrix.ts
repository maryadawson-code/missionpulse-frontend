/**
 * Compliance Matrix template — maps raw DB compliance_requirements
 * to the ComplianceRow structure for XLSX generation.
 */

import type { ComplianceRow } from '../xlsx-engine'

interface ComplianceRequirementRecord {
  reference: string | null
  requirement_text: string | null
  section: string | null
  priority: string | null
  status: string | null
  assigned_to?: string | null
  evidence_notes?: string | null
  eval_factor?: string | null
}

/**
 * Map DB compliance_requirements rows to export-ready ComplianceRows.
 */
export function buildComplianceRows(
  records: ComplianceRequirementRecord[]
): ComplianceRow[] {
  return records.map((r) => ({
    reference: r.reference ?? '',
    requirement_text: r.requirement_text ?? '',
    section: r.section ?? '',
    priority: normalizePriority(r.priority),
    status: r.status ?? 'not_started',
    assigned_to: r.assigned_to ?? undefined,
    evidence: r.evidence_notes ?? undefined,
    eval_factor: r.eval_factor ?? undefined,
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
