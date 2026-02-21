/**
 * Proactive AI — Missing Section Detection
 *
 * Scans compliance matrix against proposal document tree.
 * Detects:
 * - Requirements with no assigned section
 * - Sections with no content
 * - Orphan sections not tied to any requirement
 *
 * Each gap creates a HITL queue item with suggested fix.
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ───────────────────────────────────────────────────

export type GapType = 'unassigned_requirement' | 'empty_section' | 'orphan_section'

export interface ComplianceGap {
  id: string
  type: GapType
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  requirement?: string
  section?: string
  suggestedFix: string
  opportunityId: string
  detectedAt: string
}

export interface GapReport {
  opportunityId: string
  opportunityTitle: string
  assessedAt: string
  totalRequirements: number
  totalSections: number
  gaps: ComplianceGap[]
  summary: {
    unassignedRequirements: number
    emptySections: number
    orphanSections: number
    overallComplianceScore: number // 0-100
  }
}

interface RequirementRow {
  id: string
  requirement_text: string
  section_id: string | null
  status: string | null
}

interface SectionRow {
  id: string
  title: string
  content: string | null
  requirement_ids: string[] | null
}

// ─── Gap Detection ───────────────────────────────────────────

/**
 * Scan an opportunity's compliance matrix against its proposal sections.
 */
export async function detectMissingSections(
  opportunityId: string,
  _companyId: string
): Promise<GapReport> {
  const supabase = await createClient()

  // Get opportunity details
  const { data: opp } = await supabase
    .from('opportunities')
    .select('id, title, metadata')
    .eq('id', opportunityId)
    .single()

  if (!opp) {
    return emptyReport(opportunityId, 'Unknown')
  }

  // Extract requirements and sections from metadata
  // (Stored by RFP Shredder in metadata.compliance_matrix and metadata.sections)
  const metadata = opp.metadata as Record<string, unknown> | null

  const requirements = (metadata?.compliance_matrix as RequirementRow[]) ?? []
  const sections = (metadata?.sections as SectionRow[]) ?? []

  if (requirements.length === 0 && sections.length === 0) {
    return emptyReport(opportunityId, opp.title)
  }

  const gaps: ComplianceGap[] = []
  const now = new Date().toISOString()

  // 1. Detect unassigned requirements (no section mapped)
  const assignedReqIds = new Set<string>()
  for (const section of sections) {
    if (section.requirement_ids) {
      for (const reqId of section.requirement_ids) {
        assignedReqIds.add(reqId)
      }
    }
  }

  for (const req of requirements) {
    const isAssigned = req.section_id || assignedReqIds.has(req.id)
    if (!isAssigned) {
      gaps.push({
        id: `gap_${req.id}`,
        type: 'unassigned_requirement',
        severity: 'high',
        title: `Requirement not assigned to any section`,
        description: `"${req.requirement_text?.slice(0, 200)}" has no proposal section mapped to it.`,
        requirement: req.requirement_text,
        suggestedFix: 'Assign this requirement to an existing proposal section or create a new section.',
        opportunityId,
        detectedAt: now,
      })
    }
  }

  // 2. Detect empty sections (no content written)
  for (const section of sections) {
    const hasContent = section.content && section.content.trim().length > 50
    if (!hasContent) {
      gaps.push({
        id: `gap_empty_${section.id}`,
        type: 'empty_section',
        severity: 'medium',
        title: `Section "${section.title}" has no content`,
        description: `This section exists in the proposal structure but has no substantive content.`,
        section: section.title,
        suggestedFix: 'Draft content for this section or use AI to generate an initial draft.',
        opportunityId,
        detectedAt: now,
      })
    }
  }

  // 3. Detect orphan sections (not tied to any requirement)
  const reqIds = new Set(requirements.map((r) => r.id))
  for (const section of sections) {
    const linkedReqs = (section.requirement_ids ?? []).filter((id) => reqIds.has(id))
    if (linkedReqs.length === 0 && requirements.length > 0) {
      gaps.push({
        id: `gap_orphan_${section.id}`,
        type: 'orphan_section',
        severity: 'low',
        title: `Section "${section.title}" has no linked requirements`,
        description: `This section is not mapped to any compliance requirements.`,
        section: section.title,
        suggestedFix: 'Link this section to relevant requirements or consider if it should be removed.',
        opportunityId,
        detectedAt: now,
      })
    }
  }

  // Sort by severity
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  gaps.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  // Calculate compliance score
  const totalReqs = requirements.length
  const assignedReqs = requirements.filter(
    (r) => r.section_id || assignedReqIds.has(r.id)
  ).length
  const complianceScore = totalReqs > 0 ? Math.round((assignedReqs / totalReqs) * 100) : 100

  return {
    opportunityId,
    opportunityTitle: opp.title,
    assessedAt: now,
    totalRequirements: requirements.length,
    totalSections: sections.length,
    gaps,
    summary: {
      unassignedRequirements: gaps.filter((g) => g.type === 'unassigned_requirement').length,
      emptySections: gaps.filter((g) => g.type === 'empty_section').length,
      orphanSections: gaps.filter((g) => g.type === 'orphan_section').length,
      overallComplianceScore: complianceScore,
    },
  }
}

/**
 * Create HITL queue items for detected gaps.
 */
export async function createGapAlerts(
  report: GapReport,
  companyId: string
): Promise<{ alertsCreated: number }> {
  const supabase = await createClient()
  let alertsCreated = 0

  for (const gap of report.gaps) {
    await supabase.from('activity_log').insert({
      company_id: companyId,
      action: 'compliance_gap_detected',
      entity_type: 'opportunity',
      entity_id: report.opportunityId,
      description: `[${gap.severity.toUpperCase()}] ${gap.title} — ${gap.description.slice(0, 200)}`,
      metadata: JSON.parse(JSON.stringify({
        gap_type: gap.type,
        severity: gap.severity,
        suggested_fix: gap.suggestedFix,
        requirement: gap.requirement?.slice(0, 200),
        section: gap.section,
      })),
    })
    alertsCreated++
  }

  return { alertsCreated }
}

/**
 * Batch scan: detect gaps for all active proposals in a company.
 */
export async function batchDetectGaps(
  companyId: string
): Promise<{ reports: GapReport[]; totalGaps: number }> {
  const supabase = await createClient()

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id')
    .eq('company_id', companyId)
    .in('phase', ['Capture Planning', 'Proposal Development'])

  if (!opportunities) return { reports: [], totalGaps: 0 }

  const reports: GapReport[] = []
  let totalGaps = 0

  for (const opp of opportunities) {
    const report = await detectMissingSections(opp.id, companyId)
    if (report.gaps.length > 0) {
      reports.push(report)
      totalGaps += report.gaps.length
    }
  }

  return { reports, totalGaps }
}

// ─── Helpers ─────────────────────────────────────────────────

function emptyReport(opportunityId: string, title: string): GapReport {
  return {
    opportunityId,
    opportunityTitle: title,
    assessedAt: new Date().toISOString(),
    totalRequirements: 0,
    totalSections: 0,
    gaps: [],
    summary: {
      unassignedRequirements: 0,
      emptySections: 0,
      orphanSections: 0,
      overallComplianceScore: 100,
    },
  }
}
