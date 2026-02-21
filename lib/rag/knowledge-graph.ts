/**
 * Knowledge Graph Query Engine
 *
 * Queries across extracted entities from all proposals in a company.
 * Powers: "Show me every proposal where we mentioned FHIR integration"
 * and similar cross-document intelligence queries.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import type { EntityType, RelationshipType } from './entity-extractor'

// ─── Types ───────────────────────────────────────────────────

export interface KnowledgeGraphNode {
  name: string
  type: EntityType
  confidence: number
  documentIds: string[]
  documentNames: string[]
  occurrenceCount: number
}

export interface KnowledgeGraphEdge {
  source: string
  target: string
  type: RelationshipType
  strength: number
  documentId: string
}

export interface KnowledgeGraphQueryResult {
  nodes: KnowledgeGraphNode[]
  edges: KnowledgeGraphEdge[]
  totalDocuments: number
  query: string
}

export interface EntitySearchResult {
  entityName: string
  entityType: EntityType
  documents: Array<{
    documentId: string
    context: string
    confidence: number
  }>
}

// ─── Query Functions ─────────────────────────────────────────

/**
 * Search the knowledge graph for entities matching a query.
 * Example: "FHIR" → all proposals mentioning FHIR
 */
export async function searchKnowledgeGraph(
  query: string,
  companyId: string,
  entityType?: EntityType
): Promise<KnowledgeGraphQueryResult> {
  const supabase = await createClient()
  const normalizedQuery = query.toLowerCase().trim()

  // Fetch all entity extraction audit logs for this company
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('record_id, new_values, created_at')
    .eq('action', 'entity_extraction')
    .eq('user_id', companyId)
    .order('created_at', { ascending: false })
    .limit(500)

  if (!logs || logs.length === 0) {
    return { nodes: [], edges: [], totalDocuments: 0, query }
  }

  const nodeMap = new Map<string, KnowledgeGraphNode>()
  const edges: KnowledgeGraphEdge[] = []
  const documentIds = new Set<string>()

  for (const log of logs) {
    const values = log.new_values as Record<string, unknown> | null
    if (!values) continue

    const docId = log.record_id ?? ''
    documentIds.add(docId)

    const entities = (values.entities as Array<{
      name: string
      type: EntityType
      confidence: number
    }>) ?? []

    const relationships = (values.relationships as Array<{
      source: string
      target: string
      type: RelationshipType
    }>) ?? []

    // Filter and aggregate entities
    for (const entity of entities) {
      const matchesQuery = entity.name.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(entity.name.toLowerCase())
      const matchesType = !entityType || entity.type === entityType

      if (matchesQuery && matchesType) {
        const key = `${entity.type}:${entity.name.toLowerCase()}`
        const existing = nodeMap.get(key)

        if (existing) {
          existing.occurrenceCount++
          if (!existing.documentIds.includes(docId)) {
            existing.documentIds.push(docId)
          }
          existing.confidence = Math.max(existing.confidence, entity.confidence)
        } else {
          nodeMap.set(key, {
            name: entity.name,
            type: entity.type,
            confidence: entity.confidence,
            documentIds: [docId],
            documentNames: [],
            occurrenceCount: 1,
          })
        }
      }
    }

    // Collect relevant relationships
    for (const rel of relationships) {
      const sourceMatch = rel.source.toLowerCase().includes(normalizedQuery)
      const targetMatch = rel.target.toLowerCase().includes(normalizedQuery)

      if (sourceMatch || targetMatch) {
        edges.push({
          source: rel.source,
          target: rel.target,
          type: rel.type,
          strength: 0.5,
          documentId: docId,
        })
      }
    }
  }

  const nodes = Array.from(nodeMap.values())
  nodes.sort((a, b) => b.occurrenceCount - a.occurrenceCount)

  return {
    nodes,
    edges,
    totalDocuments: documentIds.size,
    query,
  }
}

/**
 * Get all entities of a specific type across proposals.
 * Example: all technologies mentioned across all proposals.
 */
export async function getEntitiesByType(
  companyId: string,
  entityType: EntityType,
  limit = 50
): Promise<KnowledgeGraphNode[]> {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('record_id, new_values')
    .eq('action', 'entity_extraction')
    .eq('user_id', companyId)
    .limit(500)

  if (!logs) return []

  const nodeMap = new Map<string, KnowledgeGraphNode>()

  for (const log of logs) {
    const values = log.new_values as Record<string, unknown> | null
    if (!values) continue

    const docId = log.record_id ?? ''
    const entities = (values.entities as Array<{
      name: string
      type: EntityType
      confidence: number
    }>) ?? []

    for (const entity of entities) {
      if (entity.type !== entityType) continue

      const key = entity.name.toLowerCase()
      const existing = nodeMap.get(key)

      if (existing) {
        existing.occurrenceCount++
        if (!existing.documentIds.includes(docId)) {
          existing.documentIds.push(docId)
        }
      } else {
        nodeMap.set(key, {
          name: entity.name,
          type: entity.type,
          confidence: entity.confidence,
          documentIds: [docId],
          documentNames: [],
          occurrenceCount: 1,
        })
      }
    }
  }

  const nodes = Array.from(nodeMap.values())
  nodes.sort((a, b) => b.occurrenceCount - a.occurrenceCount)
  return nodes.slice(0, limit)
}

/**
 * Find all documents containing a specific entity.
 * Powers: "Show me every proposal where we mentioned [X]"
 */
export async function findDocumentsWithEntity(
  companyId: string,
  entityName: string,
  entityType?: EntityType
): Promise<EntitySearchResult[]> {
  const result = await searchKnowledgeGraph(entityName, companyId, entityType)

  return result.nodes.map((node) => ({
    entityName: node.name,
    entityType: node.type,
    documents: node.documentIds.map((docId) => ({
      documentId: docId,
      context: '', // Context would need chunk-level lookup
      confidence: node.confidence,
    })),
  }))
}

/**
 * Get entity co-occurrence: which entities frequently appear together.
 * Useful for understanding common technology stacks, team compositions, etc.
 */
export async function getEntityCooccurrence(
  companyId: string,
  entityType1: EntityType,
  entityType2: EntityType,
  limit = 20
): Promise<Array<{ entity1: string; entity2: string; cooccurrenceCount: number }>> {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('new_values')
    .eq('action', 'entity_extraction')
    .eq('user_id', companyId)
    .limit(500)

  if (!logs) return []

  const pairCounts = new Map<string, { entity1: string; entity2: string; count: number }>()

  for (const log of logs) {
    const values = log.new_values as Record<string, unknown> | null
    if (!values) continue

    const entities = (values.entities as Array<{
      name: string
      type: EntityType
    }>) ?? []

    const type1Entities = entities.filter((e) => e.type === entityType1)
    const type2Entities = entities.filter((e) => e.type === entityType2)

    // Count co-occurrences within the same document
    for (const e1 of type1Entities) {
      for (const e2 of type2Entities) {
        const key = [e1.name.toLowerCase(), e2.name.toLowerCase()].sort().join('||')
        const existing = pairCounts.get(key)
        if (existing) {
          existing.count++
        } else {
          pairCounts.set(key, { entity1: e1.name, entity2: e2.name, count: 1 })
        }
      }
    }
  }

  const pairs = Array.from(pairCounts.values())
  pairs.sort((a, b) => b.count - a.count)

  return pairs.slice(0, limit).map((p) => ({
    entity1: p.entity1,
    entity2: p.entity2,
    cooccurrenceCount: p.count,
  }))
}

/**
 * Build a summary of the knowledge graph for AI context.
 * Used to enrich AI Chat responses with cross-proposal intelligence.
 */
export async function buildKnowledgeGraphContext(
  companyId: string,
  query: string
): Promise<string> {
  const result = await searchKnowledgeGraph(query, companyId)

  if (result.nodes.length === 0) {
    return ''
  }

  const entitySummaries = result.nodes.slice(0, 10).map((node) => {
    return `- ${node.name} (${node.type}): found in ${node.occurrenceCount} occurrence(s) across ${node.documentIds.length} document(s)`
  })

  return `Knowledge Graph Context for "${query}":
${entitySummaries.join('\n')}

Total documents analyzed: ${result.totalDocuments}
Related connections: ${result.edges.length}`
}
