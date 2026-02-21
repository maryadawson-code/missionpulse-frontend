/**
 * Entity Extraction from Proposal Documents
 *
 * Uses AI to extract structured entities from uploaded proposals:
 * agencies, contract vehicles, key personnel, technologies,
 * requirements, and past performance references.
 *
 * Extracted entities are stored in the knowledge graph for
 * cross-proposal querying.
 */
'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import { createClient } from '@/lib/supabase/server'

// ─── Types ───────────────────────────────────────────────────

export type EntityType =
  | 'agency'
  | 'contract_vehicle'
  | 'person'
  | 'technology'
  | 'requirement'
  | 'past_performance'

export type RelationshipType = 'appeared_in' | 'related_to' | 'succeeded_by'

export interface ExtractedEntity {
  name: string
  type: EntityType
  context: string // Surrounding text for reference
  confidence: number // 0-1 extraction confidence
  attributes: Record<string, string>
}

export interface EntityRelationship {
  sourceEntity: string
  targetEntity: string
  type: RelationshipType
  documentId: string
  strength: number // 0-1
}

export interface ExtractionResult {
  entities: ExtractedEntity[]
  relationships: EntityRelationship[]
  documentId: string
  processedChunks: number
}

// ─── Entity Extraction ───────────────────────────────────────

/**
 * Extract entities from a document's text content.
 * Processes in chunks to handle large documents.
 */
export async function extractEntities(
  content: string,
  documentId: string,
  documentName: string,
  companyId: string
): Promise<ExtractionResult> {
  const allEntities: ExtractedEntity[] = []
  const allRelationships: EntityRelationship[] = []

  // Split into manageable chunks (4000 chars each)
  const chunks = splitIntoChunks(content, 4000)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const extracted = await extractFromChunk(chunk, documentId, documentName)
    allEntities.push(...extracted.entities)
    allRelationships.push(...extracted.relationships)
  }

  // Deduplicate entities by name + type
  const deduped = deduplicateEntities(allEntities)

  // Store in knowledge graph
  await storeEntities(deduped, allRelationships, documentId, companyId)

  return {
    entities: deduped,
    relationships: allRelationships,
    documentId,
    processedChunks: chunks.length,
  }
}

/**
 * Extract entities from a single text chunk using AI.
 */
async function extractFromChunk(
  text: string,
  documentId: string,
  documentName: string
): Promise<{ entities: ExtractedEntity[]; relationships: EntityRelationship[] }> {
  const prompt = `Extract structured entities from this proposal document text.

DOCUMENT: ${documentName}

TEXT:
${text}

Extract these entity types:
1. **agency** — Government agencies mentioned (e.g., "DoD", "DHS", "VA")
2. **contract_vehicle** — Contract vehicles referenced (e.g., "OASIS", "SEWP V", "Alliant 2")
3. **person** — Key personnel named (e.g., "Dr. Jane Smith, Project Lead")
4. **technology** — Technologies, tools, standards mentioned (e.g., "FHIR", "AWS GovCloud", "Kubernetes")
5. **requirement** — Specific requirements or compliance standards (e.g., "FedRAMP High", "NIST 800-53", "Section 508")
6. **past_performance** — Past performance references (e.g., "VA EHR Modernization Contract")

For each entity, also identify relationships:
- **appeared_in**: Entity appears in this document
- **related_to**: Two entities are related (e.g., a person is associated with an agency)

Return ONLY a JSON object:
{
  "entities": [
    {"name": "...", "type": "agency|contract_vehicle|person|technology|requirement|past_performance", "context": "surrounding sentence", "confidence": 0.0-1.0, "attributes": {"role": "optional", "detail": "optional"}}
  ],
  "relationships": [
    {"source": "entity name", "target": "entity name", "type": "appeared_in|related_to|succeeded_by", "strength": 0.0-1.0}
  ]
}`

  const response = await aiRequest({
    taskType: 'classify',
    prompt,
    systemPrompt: 'You are a precision entity extraction engine for government proposal documents. Extract ONLY entities that are clearly present in the text. Output valid JSON only.',
  })

  if (!response.content) {
    return { entities: [], relationships: [] }
  }

  return parseExtractionResponse(response.content, documentId)
}

// ─── Response Parser ─────────────────────────────────────────

function parseExtractionResponse(
  content: string,
  documentId: string
): { entities: ExtractedEntity[]; relationships: EntityRelationship[] } {
  const jsonMatch = /\{[\s\S]*\}/.exec(content)
  if (!jsonMatch) return { entities: [], relationships: [] }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      entities?: Array<{
        name: string
        type: string
        context?: string
        confidence?: number
        attributes?: Record<string, string>
      }>
      relationships?: Array<{
        source: string
        target: string
        type: string
        strength?: number
      }>
    }

    const validTypes: EntityType[] = [
      'agency', 'contract_vehicle', 'person', 'technology', 'requirement', 'past_performance',
    ]
    const validRelTypes: RelationshipType[] = ['appeared_in', 'related_to', 'succeeded_by']

    const entities: ExtractedEntity[] = (parsed.entities ?? [])
      .filter((e) => e.name && validTypes.includes(e.type as EntityType))
      .map((e) => ({
        name: e.name.trim(),
        type: e.type as EntityType,
        context: (e.context ?? '').slice(0, 500),
        confidence: Math.max(0, Math.min(1, e.confidence ?? 0.5)),
        attributes: e.attributes ?? {},
      }))

    const relationships: EntityRelationship[] = (parsed.relationships ?? [])
      .filter((r) => r.source && r.target && validRelTypes.includes(r.type as RelationshipType))
      .map((r) => ({
        sourceEntity: r.source.trim(),
        targetEntity: r.target.trim(),
        type: r.type as RelationshipType,
        documentId,
        strength: Math.max(0, Math.min(1, r.strength ?? 0.5)),
      }))

    return { entities, relationships }
  } catch {
    return { entities: [], relationships: [] }
  }
}

// ─── Deduplication ───────────────────────────────────────────

function deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
  const seen = new Map<string, ExtractedEntity>()

  for (const entity of entities) {
    const key = `${entity.type}:${entity.name.toLowerCase()}`
    const existing = seen.get(key)

    if (!existing || entity.confidence > existing.confidence) {
      seen.set(key, entity)
    }
  }

  return Array.from(seen.values())
}

// ─── Storage ─────────────────────────────────────────────────

/**
 * Store extracted entities in the database.
 * Uses the documents' metadata to store knowledge graph data,
 * since a dedicated knowledge_graph table may not exist yet.
 */
async function storeEntities(
  entities: ExtractedEntity[],
  relationships: EntityRelationship[],
  documentId: string,
  companyId: string
): Promise<void> {
  const supabase = await createClient()

  // Store as metadata on the document record or in a generic store
  // Using audit_logs for now until knowledge_graph table is created
  await supabase.from('audit_logs').insert({
    action: 'entity_extraction',
    table_name: 'documents',
    record_id: documentId,
    user_id: companyId, // Using company_id as the actor for automated extraction
    new_values: JSON.parse(JSON.stringify({
      entity_count: entities.length,
      relationship_count: relationships.length,
      entities: entities.map((e) => ({ name: e.name, type: e.type, confidence: e.confidence })),
      relationships: relationships.map((r) => ({
        source: r.sourceEntity,
        target: r.targetEntity,
        type: r.type,
      })),
    })),
  })
}

// ─── Utilities ───────────────────────────────────────────────

function splitIntoChunks(text: string, maxChars: number): string[] {
  const chunks: string[] = []
  const paragraphs = text.split(/\n\n+/)
  let current = ''

  for (const para of paragraphs) {
    if (current.length + para.length > maxChars && current) {
      chunks.push(current.trim())
      current = para
    } else {
      current = current ? current + '\n\n' + para : para
    }
  }

  if (current.trim()) chunks.push(current.trim())
  return chunks
}
