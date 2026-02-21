/**
 * Cross-Encoder Re-ranker
 *
 * Takes top-K candidates from hybrid search and re-scores them
 * using a cross-encoder model via AskSage for more precise ranking.
 *
 * Pipeline: Query → Hybrid Search (top-20) → Re-rank (top-5) → Response
 */
'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import type { SearchResult } from './hybrid-search'

// ─── Types ───────────────────────────────────────────────────

export interface RerankedResult extends SearchResult {
  rerankerScore: number
  originalRank: number
  relevanceExplanation: string | null
}

export interface RerankerConfig {
  candidateCount: number // How many candidates to re-rank (default 20)
  returnCount: number // How many to return after re-ranking (default 5)
  minRelevance: number // Minimum relevance score 0-1 (default 0.3)
  includeExplanation: boolean // Ask model to explain relevance (default false)
}

const DEFAULT_CONFIG: RerankerConfig = {
  candidateCount: 20,
  returnCount: 5,
  minRelevance: 0.3,
  includeExplanation: false,
}

// ─── Re-ranking ──────────────────────────────────────────────

/**
 * Re-rank search results using cross-encoder scoring via AI.
 *
 * Sends query + each candidate to the model for pairwise relevance scoring.
 * This produces more accurate rankings than embedding-only similarity.
 */
export async function rerankResults(
  query: string,
  candidates: SearchResult[],
  config: Partial<RerankerConfig> = {}
): Promise<RerankedResult[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  // Take top candidates
  const toRerank = candidates.slice(0, cfg.candidateCount)

  if (toRerank.length === 0) return []

  // Build batch re-ranking prompt
  const candidateDescriptions = toRerank
    .map((c, i) => `[${i + 1}] ${c.content.slice(0, 500)}`)
    .join('\n\n---\n\n')

  const prompt = `You are a relevance scoring engine. Given a query and a set of document passages, score each passage's relevance to the query on a scale of 0.0 to 1.0.

QUERY: "${query}"

PASSAGES:
${candidateDescriptions}

Score each passage. Return ONLY a JSON array of objects with this exact format:
[
  {"index": 1, "score": 0.85${cfg.includeExplanation ? ', "reason": "brief explanation"' : ''}},
  {"index": 2, "score": 0.42${cfg.includeExplanation ? ', "reason": "brief explanation"' : ''}},
  ...
]

Rules:
- Score 0.0 = completely irrelevant
- Score 1.0 = perfectly answers the query
- Consider semantic meaning, not just keyword overlap
- Penalize tangential or off-topic content
- Reward specific, actionable, directly relevant information`

  const response = await aiRequest({
    taskType: 'classify',
    prompt,
    systemPrompt: 'You are a precision relevance scoring engine. Output ONLY valid JSON. No explanation outside the JSON array.',
  })

  if (!response.content) {
    // Fallback: return candidates with original scores
    return toRerank.slice(0, cfg.returnCount).map((c, i) => ({
      ...c,
      rerankerScore: c.score,
      originalRank: i + 1,
      relevanceExplanation: null,
    }))
  }

  // Parse scores from response
  const scores = parseRerankerScores(response.content, toRerank.length)

  // Apply scores to candidates
  const reranked: RerankedResult[] = toRerank.map((candidate, i) => {
    const scoreEntry = scores.find((s) => s.index === i + 1)
    return {
      ...candidate,
      rerankerScore: scoreEntry?.score ?? 0,
      originalRank: i + 1,
      relevanceExplanation: scoreEntry?.reason ?? null,
    }
  })

  // Sort by re-ranker score and filter by minimum relevance
  reranked.sort((a, b) => b.rerankerScore - a.rerankerScore)

  return reranked
    .filter((r) => r.rerankerScore >= cfg.minRelevance)
    .slice(0, cfg.returnCount)
}

// ─── Score Parser ────────────────────────────────────────────

interface ScoreEntry {
  index: number
  score: number
  reason: string | null
}

/**
 * Parse the re-ranker's JSON output into scores.
 * Handles common formatting issues from LLM output.
 */
function parseRerankerScores(content: string, expectedCount: number): ScoreEntry[] {
  // Extract JSON array from response (may have surrounding text)
  const jsonMatch = /\[[\s\S]*\]/.exec(content)
  if (!jsonMatch) {
    return generateDefaultScores(expectedCount)
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      index: number
      score: number
      reason?: string
    }>

    return parsed.map((entry) => ({
      index: entry.index,
      score: Math.max(0, Math.min(1, entry.score)), // Clamp to [0, 1]
      reason: entry.reason ?? null,
    }))
  } catch {
    return generateDefaultScores(expectedCount)
  }
}

/**
 * Generate default decreasing scores if parsing fails.
 */
function generateDefaultScores(count: number): ScoreEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i + 1,
    score: Math.max(0.1, 1 - i * 0.05),
    reason: null,
  }))
}

// ─── Full Pipeline ───────────────────────────────────────────

/**
 * Complete retrieval pipeline: hybrid search → re-rank → return.
 */
export async function retrieveAndRerank(
  query: string,
  companyId: string,
  documentType?: string,
  config?: {
    searchConfig?: Partial<import('./hybrid-search').HybridSearchConfig>
    rerankerConfig?: Partial<RerankerConfig>
  }
): Promise<RerankedResult[]> {
  const { hybridSearch } = await import('./hybrid-search')

  // Step 1: Hybrid search for candidates
  const candidates = await hybridSearch(
    query,
    companyId,
    documentType,
    {
      ...config?.searchConfig,
      finalTopN: config?.rerankerConfig?.candidateCount ?? DEFAULT_CONFIG.candidateCount,
    }
  )

  // Step 2: Re-rank with cross-encoder
  const reranked = await rerankResults(query, candidates, config?.rerankerConfig)

  return reranked
}

// ─── Metrics ─────────────────────────────────────────────────

/**
 * Calculate retrieval quality metrics for A/B comparison.
 */
export async function calculateRetrievalMetrics(
  query: string,
  results: RerankedResult[],
  relevantDocIds: string[] // Ground truth relevant document IDs
): Promise<{
  precision: number
  recall: number
  mrr: number // Mean Reciprocal Rank
  ndcg: number // Normalized Discounted Cumulative Gain
}> {
  const retrievedIds = results.map((r) => r.id)
  const relevantSet = new Set(relevantDocIds)

  // Precision: fraction of retrieved that are relevant
  const truePositives = retrievedIds.filter((id) => relevantSet.has(id)).length
  const precision = retrievedIds.length > 0 ? truePositives / retrievedIds.length : 0

  // Recall: fraction of relevant that are retrieved
  const recall = relevantDocIds.length > 0 ? truePositives / relevantDocIds.length : 0

  // MRR: reciprocal rank of first relevant result
  const firstRelevantRank = retrievedIds.findIndex((id) => relevantSet.has(id))
  const mrr = firstRelevantRank >= 0 ? 1 / (firstRelevantRank + 1) : 0

  // NDCG: consider position-weighted relevance
  let dcg = 0
  let idcg = 0
  for (let i = 0; i < retrievedIds.length; i++) {
    const rel = relevantSet.has(retrievedIds[i]) ? 1 : 0
    dcg += rel / Math.log2(i + 2)
  }
  for (let i = 0; i < Math.min(relevantDocIds.length, retrievedIds.length); i++) {
    idcg += 1 / Math.log2(i + 2)
  }
  const ndcg = idcg > 0 ? dcg / idcg : 0

  return { precision, recall, mrr, ndcg }
}
