/**
 * Upstash Redis client — serverless-compatible, REST-based.
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
 *
 * Gracefully degrades: if env vars are missing, all operations
 * return null/false so the AI pipeline works without caching.
 */

import { Redis } from '@upstash/redis'

// ─── Config ──────────────────────────────────────────────────

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL ?? ''
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? ''

let _redis: Redis | null = null

/**
 * Get the shared Redis instance (lazy singleton).
 * Returns null if credentials are not configured.
 */
export function getRedis(): Redis | null {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null

  if (!_redis) {
    _redis = new Redis({
      url: UPSTASH_URL,
      token: UPSTASH_TOKEN,
    })
  }

  return _redis
}

/**
 * Check if Redis is available and reachable.
 */
export async function isRedisAvailable(): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return false

  try {
    await redis.ping()
    return true
  } catch {
    return false
  }
}
