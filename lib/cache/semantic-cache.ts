/**
 * Semantic Cache — content-addressable caching for AI responses.
 *
 * Hashes companyId + prompt + model + classification into a cache key.
 * Company isolation ensures no cross-tenant cache hits (CMMC SC-4).
 * TTL varies by agent type (Black Hat = 1hr, default = 24hr).
 * Tracks hit/miss metrics in Redis.
 *
 * Gracefully degrades when Redis is unavailable — all operations
 * return null/void so the AI pipeline continues uncached.
 */

import { createHash } from 'crypto'
import { getRedis } from './redis'
import type { TaskType, ClassificationLevel } from '@/lib/ai/types'

// ─── TTL Configuration (seconds) ────────────────────────────

const DEFAULT_TTL = 24 * 60 * 60 // 24 hours

const AGENT_TTL: Partial<Record<TaskType, number>> = {
  pricing: 1 * 60 * 60,    // 1 hour — sensitive, changes frequently
  strategy: 4 * 60 * 60,   // 4 hours
  capture: 12 * 60 * 60,   // 12 hours
  compliance: 24 * 60 * 60, // 24 hours — regulations change slowly
  writer: 24 * 60 * 60,    // 24 hours
  contracts: 24 * 60 * 60, // 24 hours
  orals: 12 * 60 * 60,     // 12 hours
  chat: 4 * 60 * 60,       // 4 hours
  summarize: 24 * 60 * 60, // 24 hours
  classify: 24 * 60 * 60,  // 24 hours
}

// Key prefixes
const CACHE_PREFIX = 'mp:ai:cache:'
const METRICS_PREFIX = 'mp:ai:metrics:'

// ─── Types ───────────────────────────────────────────────────

export interface CachedResponse {
  content: string
  model_used: string
  confidence: 'high' | 'medium' | 'low'
  cached_at: string
}

export interface CacheMetrics {
  hits: number
  misses: number
  hit_rate: number
}

export interface CacheKeyInput {
  companyId: string
  prompt: string
  model: string
  classification: ClassificationLevel
  taskType: TaskType
  systemPrompt?: string
}

// ─── Hash Function ───────────────────────────────────────────

/**
 * Generate a deterministic cache key from companyId + prompt + model + classification.
 * Uses SHA-256 for collision resistance.
 * Company isolation: companyId is the first segment, preventing cross-tenant cache hits (CMMC SC-4).
 */
function generateCacheKey(input: CacheKeyInput): string {
  const normalized = [
    input.companyId,
    input.prompt.trim().toLowerCase(),
    input.model,
    input.classification,
    input.taskType,
    input.systemPrompt?.trim().toLowerCase() ?? '',
  ].join('|')

  const hash = createHash('sha256').update(normalized).digest('hex')
  return `${CACHE_PREFIX}${input.companyId}:${input.taskType}:${hash}`
}

/**
 * Get the TTL for a given agent type.
 */
function getTTL(taskType: TaskType): number {
  return AGENT_TTL[taskType] ?? DEFAULT_TTL
}

// ─── Cache Operations ────────────────────────────────────────

/**
 * Check cache for a matching response.
 * Returns null on miss or if Redis is unavailable.
 */
export async function getCachedResponse(
  input: CacheKeyInput
): Promise<CachedResponse | null> {
  const redis = getRedis()
  if (!redis) return null

  try {
    const key = generateCacheKey(input)
    const cached = await redis.get<CachedResponse>(key)

    // Track hit/miss
    const metricsKey = `${METRICS_PREFIX}${input.taskType}`
    if (cached) {
      await redis.hincrby(metricsKey, 'hits', 1)
    } else {
      await redis.hincrby(metricsKey, 'misses', 1)
    }

    return cached
  } catch {
    // Cache failure should never break the AI pipeline
    return null
  }
}

/**
 * Store an AI response in cache with agent-specific TTL.
 */
export async function setCachedResponse(
  input: CacheKeyInput,
  response: {
    content: string
    model_used: string
    confidence: 'high' | 'medium' | 'low'
  }
): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    const key = generateCacheKey(input)
    const ttl = getTTL(input.taskType)

    const entry: CachedResponse = {
      content: response.content,
      model_used: response.model_used,
      confidence: response.confidence,
      cached_at: new Date().toISOString(),
    }

    await redis.set(key, entry, { ex: ttl })
  } catch {
    // Cache failure should never break the AI pipeline
  }
}

/**
 * Invalidate all cached responses for a specific agent type.
 * Optionally scoped to a single company (CMMC SC-4).
 * Used when Playbook content changes or context shifts.
 */
export async function invalidateAgentCache(
  taskType: TaskType,
  companyId?: string
): Promise<number> {
  const redis = getRedis()
  if (!redis) return 0

  try {
    const scope = companyId ? `${companyId}:` : '*:'
    const pattern = `${CACHE_PREFIX}${scope}${taskType}:*`
    let deleted = 0
    let scanCursor = '0'

    do {
      const [nextCursor, keys] = await redis.scan(Number(scanCursor), {
        match: pattern,
        count: 100,
      })
      scanCursor = String(nextCursor)

      if (keys.length > 0) {
        await redis.del(...(keys as string[]))
        deleted += keys.length
      }
    } while (scanCursor !== '0')

    return deleted
  } catch {
    return 0
  }
}

/**
 * Invalidate all cached AI responses.
 * Nuclear option — use sparingly.
 */
export async function invalidateAllCache(): Promise<number> {
  const redis = getRedis()
  if (!redis) return 0

  try {
    const pattern = `${CACHE_PREFIX}*`
    let deleted = 0
    let scanCursor = '0'

    do {
      const [nextCursor, keys] = await redis.scan(Number(scanCursor), {
        match: pattern,
        count: 100,
      })
      scanCursor = String(nextCursor)

      if (keys.length > 0) {
        await redis.del(...(keys as string[]))
        deleted += keys.length
      }
    } while (scanCursor !== '0')

    return deleted
  } catch {
    return 0
  }
}

/**
 * Get cache hit/miss metrics for an agent type (or all agents).
 */
export async function getCacheMetrics(
  taskType?: TaskType
): Promise<CacheMetrics> {
  const redis = getRedis()
  if (!redis) return { hits: 0, misses: 0, hit_rate: 0 }

  try {
    if (taskType) {
      const metricsKey = `${METRICS_PREFIX}${taskType}`
      const [hits, misses] = await Promise.all([
        redis.hget<number>(metricsKey, 'hits'),
        redis.hget<number>(metricsKey, 'misses'),
      ])
      const h = hits ?? 0
      const m = misses ?? 0
      const total = h + m
      return {
        hits: h,
        misses: m,
        hit_rate: total > 0 ? h / total : 0,
      }
    }

    // Aggregate across all agent types
    const agentTypes: TaskType[] = [
      'chat', 'strategy', 'compliance', 'capture', 'writer',
      'contracts', 'orals', 'pricing', 'summarize', 'classify',
    ]

    let totalHits = 0
    let totalMisses = 0

    for (const agent of agentTypes) {
      const metricsKey = `${METRICS_PREFIX}${agent}`
      const [hits, misses] = await Promise.all([
        redis.hget<number>(metricsKey, 'hits'),
        redis.hget<number>(metricsKey, 'misses'),
      ])
      totalHits += hits ?? 0
      totalMisses += misses ?? 0
    }

    const total = totalHits + totalMisses
    return {
      hits: totalHits,
      misses: totalMisses,
      hit_rate: total > 0 ? totalHits / total : 0,
    }
  } catch {
    return { hits: 0, misses: 0, hit_rate: 0 }
  }
}
