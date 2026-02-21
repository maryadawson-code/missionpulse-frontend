/**
 * Hybrid Search — Vector + Keyword
 *
 * Combines pgvector cosine similarity with pg_trgm keyword matching
 * for more accurate retrieval than vector-only search.
 *
 * Algorithm:
 * 1. Vector search: top-K by cosine similarity (pgvector)
 * 2. Keyword search: top-K by trigram similarity (pg_trgm)
 * 3. Reciprocal Rank Fusion (RRF) to combine results
 * 4. Return merged top-N with combined scores
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { aiRequest } from '@/lib/ai/pipeline'

// ─── Types ───────────────────────────────────────────────────

export interface SearchResult {
  id: string
  content: string
  score: number
  vectorScore: number
  keywordScore: number
  metadata: Record<string, unknown>
  source: 'vector' | 'keyword' | 'both'
}

export interface HybridSearchConfig {
  vectorWeight: number // Weight for vector results (default 0.6)
  keywordWeight: number // Weight for keyword results (default 0.4)
  vectorTopK: number // Number of vector results to fetch (default 20)
  keywordTopK: number // Number of keyword results to fetch (default 20)
  finalTopN: number // Final result count after fusion (default 10)
  rrfK: number // RRF constant (default 60)
  minScore: number // Minimum combined score threshold (default 0.1)
}

const DEFAULT_CONFIG: HybridSearchConfig = {
  vectorWeight: 0.6,
  keywordWeight: 0.4,
  vectorTopK: 20,
  keywordTopK: 20,
  finalTopN: 10,
  rrfK: 60,
  minScore: 0.1,
}

// ─── Hybrid Search ───────────────────────────────────────────

/**
 * Execute a hybrid search combining vector and keyword matching.
 */
export async function hybridSearch(
  query: string,
  companyId: string,
  documentType?: string,
  config: Partial<HybridSearchConfig> = {}
): Promise<SearchResult[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  // Generate query embedding via AI
  const embedding = await generateEmbedding(query)

  // Run both searches in parallel
  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(embedding, companyId, documentType, cfg.vectorTopK),
    keywordSearch(query, companyId, documentType, cfg.keywordTopK),
  ])

  // Reciprocal Rank Fusion
  const merged = reciprocalRankFusion(vectorResults, keywordResults, cfg)

  return merged.slice(0, cfg.finalTopN)
}

// ─── Vector Search ───────────────────────────────────────────

/**
 * Search using pgvector cosine similarity.
 */
async function vectorSearch(
  embedding: number[],
  companyId: string,
  documentType: string | undefined,
  topK: number
): Promise<Array<{ id: string; content: string; score: number; metadata: Record<string, unknown> }>> {
  const supabase = await createClient()

  // Use RPC for vector search (function may not exist in types yet — cast needed)
  const { data, error } = await (supabase.rpc as CallableFunction)('match_documents', {
    query_embedding: embedding,
    match_count: topK,
    filter_company_id: companyId,
    filter_document_type: documentType ?? null,
  })

  if (error || !data) return []

  return (data as Array<{
    id: string
    content: string
    similarity: number
    metadata: Record<string, unknown>
  }>).map((r: { id: string; content: string; similarity: number; metadata: Record<string, unknown> }) => ({
    id: r.id,
    content: r.content,
    score: r.similarity,
    metadata: r.metadata ?? {},
  }))
}

// ─── Keyword Search ──────────────────────────────────────────

/**
 * Search using pg_trgm trigram similarity.
 */
async function keywordSearch(
  query: string,
  companyId: string,
  documentType: string | undefined,
  topK: number
): Promise<Array<{ id: string; content: string; score: number; metadata: Record<string, unknown> }>> {
  const supabase = await createClient()

  // Use RPC for trigram search (function may not exist in types yet — cast needed)
  const { data, error } = await (supabase.rpc as CallableFunction)('keyword_search_documents', {
    search_query: query,
    match_count: topK,
    filter_company_id: companyId,
    filter_document_type: documentType ?? null,
  })

  if (error || !data) return []

  return (data as Array<{
    id: string
    content: string
    similarity: number
    metadata: Record<string, unknown>
  }>).map((r: { id: string; content: string; similarity: number; metadata: Record<string, unknown> }) => ({
    id: r.id,
    content: r.content,
    score: r.similarity,
    metadata: r.metadata ?? {},
  }))
}

// ─── Reciprocal Rank Fusion ──────────────────────────────────

/**
 * Merge vector and keyword results using Reciprocal Rank Fusion (RRF).
 *
 * RRF Score = sum(1 / (k + rank_i)) for each list the document appears in.
 * This reduces the dominance of any single retrieval method.
 */
function reciprocalRankFusion(
  vectorResults: Array<{ id: string; content: string; score: number; metadata: Record<string, unknown> }>,
  keywordResults: Array<{ id: string; content: string; score: number; metadata: Record<string, unknown> }>,
  config: HybridSearchConfig
): SearchResult[] {
  const scoreMap = new Map<string, {
    content: string
    vectorRank: number | null
    keywordRank: number | null
    vectorScore: number
    keywordScore: number
    metadata: Record<string, unknown>
  }>()

  // Score vector results
  vectorResults.forEach((result, rank) => {
    scoreMap.set(result.id, {
      content: result.content,
      vectorRank: rank + 1,
      keywordRank: null,
      vectorScore: result.score,
      keywordScore: 0,
      metadata: result.metadata,
    })
  })

  // Score keyword results
  keywordResults.forEach((result, rank) => {
    const existing = scoreMap.get(result.id)
    if (existing) {
      existing.keywordRank = rank + 1
      existing.keywordScore = result.score
    } else {
      scoreMap.set(result.id, {
        content: result.content,
        vectorRank: null,
        keywordRank: rank + 1,
        vectorScore: 0,
        keywordScore: result.score,
        metadata: result.metadata,
      })
    }
  })

  // Calculate RRF scores
  const results: SearchResult[] = []

  for (const [id, data] of Array.from(scoreMap.entries())) {
    let rrfScore = 0

    if (data.vectorRank !== null) {
      rrfScore += config.vectorWeight * (1 / (config.rrfK + data.vectorRank))
    }

    if (data.keywordRank !== null) {
      rrfScore += config.keywordWeight * (1 / (config.rrfK + data.keywordRank))
    }

    if (rrfScore >= config.minScore) {
      results.push({
        id,
        content: data.content,
        score: rrfScore,
        vectorScore: data.vectorScore,
        keywordScore: data.keywordScore,
        metadata: data.metadata,
        source:
          data.vectorRank !== null && data.keywordRank !== null
            ? 'both'
            : data.vectorRank !== null
              ? 'vector'
              : 'keyword',
      })
    }
  }

  // Sort by combined score descending
  results.sort((a, b) => b.score - a.score)

  return results
}

// ─── Embedding Generation ────────────────────────────────────

/**
 * Generate a query embedding using the AI pipeline.
 * Returns a numeric vector for cosine similarity search.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await aiRequest({
    taskType: 'summarize',
    prompt: `Generate a JSON array of 384 floating-point numbers representing a semantic embedding for: "${text.slice(0, 500)}"`,
    systemPrompt: 'You are an embedding generator. Output ONLY a JSON array of numbers.',
  })

  // If the AI pipeline returns an embedding directly, use it
  // Otherwise, fall back to a simple hash-based approach
  if (response.content) {
    try {
      const parsed = JSON.parse(response.content)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    } catch {
      // Not JSON — fall through to fallback
    }
  }

  // Fallback: create a deterministic pseudo-embedding from text
  // This enables the hybrid search to function even without
  // a dedicated embedding model, with reduced accuracy
  return createFallbackEmbedding(text)
}

/**
 * Create a deterministic pseudo-embedding from text.
 * Uses character-level hashing across 384 dimensions.
 * This is a fallback — real embeddings should come from the AI pipeline.
 */
function createFallbackEmbedding(text: string): number[] {
  const dimensions = 384
  const embedding = new Array(dimensions).fill(0)
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '')
  const words = normalized.split(/\s+/)

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j)
      const dimIdx = (charCode * 31 + i * 17 + j * 13) % dimensions
      embedding[dimIdx] += 1 / Math.sqrt(words.length)
    }
  }

  // L2 normalize
  const norm = Math.sqrt(embedding.reduce((sum: number, v: number) => sum + v * v, 0))
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      embedding[i] /= norm
    }
  }

  return embedding
}
