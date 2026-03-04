/**
 * Static Dependency Map — Cross-Document Relationships
 * Sprint 30 (T-30.1) — Phase J v1.3
 *
 * Defines which document types affect which others.
 * Based on Product Spec volume relationships:
 * Technical → Management → Cost → Compliance
 *
 * © 2026 Mission Meets Tech
 */

export interface DependencyEdge {
  source: string
  target: string
  relationship: string
  description: string
}

/**
 * Static dependency map for proposal volume relationships.
 * When a source document changes, downstream targets need review.
 */
export const DEPENDENCY_MAP: DependencyEdge[] = [
  // Pricing cascades
  {
    source: 'pricing',
    target: 'cost_narrative',
    relationship: 'data_source',
    description: 'Pricing model feeds cost volume narrative sections',
  },
  {
    source: 'pricing',
    target: 'cost_volume',
    relationship: 'data_source',
    description: 'CLIN pricing updates must reflect in cost volume',
  },
  {
    source: 'pricing',
    target: 'management',
    relationship: 'reference',
    description: 'Management approach may reference pricing assumptions',
  },

  // Compliance cascades
  {
    source: 'compliance',
    target: 'technical',
    relationship: 'requirement',
    description: 'Compliance status changes affect technical approach validity',
  },
  {
    source: 'compliance',
    target: 'management',
    relationship: 'requirement',
    description: 'Compliance changes may impact management approach',
  },
  {
    source: 'compliance',
    target: 'cost_volume',
    relationship: 'requirement',
    description: 'New compliance requirements may have cost implications',
  },
  {
    source: 'compliance',
    target: 'past_performance',
    relationship: 'requirement',
    description: 'Compliance changes may require different past performance examples',
  },

  // Personnel cascades
  {
    source: 'personnel',
    target: 'management',
    relationship: 'data_source',
    description: 'Key personnel changes must reflect in management volume',
  },
  {
    source: 'personnel',
    target: 'technical',
    relationship: 'reference',
    description: 'Technical approach may reference key personnel expertise',
  },
  {
    source: 'personnel',
    target: 'cost_volume',
    relationship: 'data_source',
    description: 'Personnel changes affect labor categories and rates',
  },

  // Technical cascades
  {
    source: 'technical',
    target: 'management',
    relationship: 'reference',
    description: 'Management approach supports technical approach',
  },
  {
    source: 'technical',
    target: 'cost_volume',
    relationship: 'data_source',
    description: 'Technical changes may affect cost estimates',
  },

  // Management cascades
  {
    source: 'management',
    target: 'cost_volume',
    relationship: 'reference',
    description: 'Management structure changes affect cost volume',
  },
]

/**
 * Get all downstream document types affected by changes to a source type.
 */
export function getDownstreamTargets(sourceDocType: string): string[] {
  return DEPENDENCY_MAP
    .filter(e => e.source === sourceDocType)
    .map(e => e.target)
}

/**
 * Get all upstream document types that feed into a target type.
 */
export function getUpstreamSources(targetDocType: string): string[] {
  return DEPENDENCY_MAP
    .filter(e => e.target === targetDocType)
    .map(e => e.source)
}
