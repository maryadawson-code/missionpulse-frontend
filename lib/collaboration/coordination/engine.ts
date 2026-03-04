/**
 * Cross-Document Coordination Engine
 * Sprint 30 (T-30.1) — Phase J v1.3
 *
 * Tracks dependencies between document types and cascades changes
 * when upstream documents are modified (pricing → cost narrative,
 * compliance → all volumes, personnel → management volume).
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'
import { DEPENDENCY_MAP, type DependencyEdge } from './dependency-map'

// ─── Types ──────────────────────────────────────────────────────

interface ChangeEvent {
  field: string
  oldValue: unknown
  newValue: unknown
  changedAt: string
  changedBy: string
}

interface AffectedSection {
  sectionId: string
  documentType: string
  reason: string
  flaggedAt: string
}

// ─── Coordination Engine ────────────────────────────────────────

export class CoordinationEngine {
  /**
   * When pricing data changes, cascade to cost narrative and related volumes.
   */
  async onPricingChange(
    opportunityId: string,
    change: ChangeEvent
  ): Promise<AffectedSection[]> {
    return this.cascadeChange(opportunityId, 'pricing', change)
  }

  /**
   * When compliance status changes, cascade to all volumes.
   */
  async onComplianceChange(
    opportunityId: string,
    change: ChangeEvent
  ): Promise<AffectedSection[]> {
    return this.cascadeChange(opportunityId, 'compliance', change)
  }

  /**
   * When a section is deleted, warn if referenced in other volumes.
   */
  async onSectionDelete(
    opportunityId: string,
    sectionId: string
  ): Promise<AffectedSection[]> {
    const supabase = await createClient()
    const affected: AffectedSection[] = []

    // Check if this section is referenced by coordination rules
    const { data: rules } = await supabase
      .from('coordination_rules')
      .select('*')
      .eq('is_active', true)

    if (!rules) return affected

    // Find sections in other documents that reference this section's doc type
    const { data: section } = await supabase
      .from('proposal_sections')
      .select('id, section_title, volume')
      .eq('id', sectionId)
      .single()

    if (!section) return affected

    const sourceDocType = section.volume ?? 'unknown'
    const edges = DEPENDENCY_MAP.filter(e => e.source === sourceDocType)

    for (const edge of edges) {
      const { data: downstreamSections } = await supabase
        .from('proposal_sections')
        .select('id, volume')
        .eq('opportunity_id', opportunityId)
        .eq('volume', edge.target)

      for (const ds of downstreamSections ?? []) {
        affected.push({
          sectionId: ds.id,
          documentType: ds.volume ?? edge.target,
          reason: `Referenced section "${section.section_title}" was deleted from ${sourceDocType}`,
          flaggedAt: new Date().toISOString(),
        })
      }
    }

    return affected
  }

  /**
   * Get the full dependency graph for an opportunity.
   */
  async getDependencyGraph(
    opportunityId: string
  ): Promise<{ edges: DependencyEdge[]; sections: Record<string, string[]> }> {
    const supabase = await createClient()

    const { data: sections } = await supabase
      .from('proposal_sections')
      .select('id, volume')
      .eq('opportunity_id', opportunityId)

    const sectionsByVolume: Record<string, string[]> = {}
    for (const s of sections ?? []) {
      const vol = s.volume ?? 'unassigned'
      if (!sectionsByVolume[vol]) sectionsByVolume[vol] = []
      sectionsByVolume[vol].push(s.id)
    }

    return { edges: DEPENDENCY_MAP, sections: sectionsByVolume }
  }

  // ─── Private ────────────────────────────────────────────────

  private async cascadeChange(
    opportunityId: string,
    sourceDocType: string,
    change: ChangeEvent
  ): Promise<AffectedSection[]> {
    const supabase = await createClient()
    const affected: AffectedSection[] = []
    const now = new Date().toISOString()

    // Find downstream dependencies
    const edges = DEPENDENCY_MAP.filter(e => e.source === sourceDocType)

    for (const edge of edges) {
      // Find sections in downstream document type
      const { data: downstreamSections } = await supabase
        .from('proposal_sections')
        .select('id, volume')
        .eq('opportunity_id', opportunityId)
        .eq('volume', edge.target)

      for (const ds of downstreamSections ?? []) {
        affected.push({
          sectionId: ds.id,
          documentType: ds.volume ?? edge.target,
          reason: `${sourceDocType} ${change.field} changed — needs review (${edge.relationship})`,
          flaggedAt: now,
        })
      }

      // Log the coordination event
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id ?? '')
        .single()

      if (profile?.company_id) {
        // Find matching coordination rule
        const { data: rules } = await supabase
          .from('coordination_rules')
          .select('id')
          .eq('company_id', profile.company_id)
          .eq('source_doc_type', sourceDocType)
          .eq('target_doc_type', edge.target)
          .eq('is_active', true)
          .limit(1)

        const ruleId = rules?.[0]?.id
        if (ruleId) {
          await supabase.from('coordination_log').insert({
            rule_id: ruleId,
            trigger_document_id: opportunityId,
            company_id: profile.company_id,
            affected_documents: JSON.parse(JSON.stringify(
              affected.map(a => ({ sectionId: a.sectionId, docType: a.documentType }))
            )),
            changes_applied: JSON.parse(JSON.stringify({
              field: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue,
            })),
            status: 'completed',
          })
        }
      }
    }

    return affected
  }
}
