/**
 * Provider Routing Configuration — admin-configurable via Redis.
 * Falls back to AI_PRIMARY_PROVIDER / AI_FALLBACK_PROVIDER env vars.
 */
'use server'

import { getRedis } from '@/lib/cache/redis'
import type { ProviderId } from './interface'

const REDIS_KEY_PRIMARY = 'mp:config:ai_primary_provider'
const REDIS_KEY_FALLBACK = 'mp:config:ai_fallback_provider'
const CONFIG_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

const VALID_PROVIDERS: ProviderId[] = ['asksage', 'anthropic', 'openai']

function isValidProvider(value: unknown): value is ProviderId {
  return typeof value === 'string' && VALID_PROVIDERS.includes(value as ProviderId)
}

/**
 * Get the configured primary provider ID.
 * Checks Redis first, then falls back to env vars.
 */
export async function getPrimaryProviderId(): Promise<ProviderId> {
  const redis = getRedis()
  if (redis) {
    try {
      const cached = await redis.get<string>(REDIS_KEY_PRIMARY)
      if (isValidProvider(cached)) return cached
    } catch {
      // Redis read failed — fall through to env
    }
  }

  const envVal = process.env.AI_PRIMARY_PROVIDER ?? 'asksage'
  return isValidProvider(envVal) ? envVal : 'asksage'
}

/**
 * Get the configured fallback provider ID.
 */
export async function getFallbackProviderId(): Promise<ProviderId> {
  const redis = getRedis()
  if (redis) {
    try {
      const cached = await redis.get<string>(REDIS_KEY_FALLBACK)
      if (isValidProvider(cached)) return cached
    } catch {
      // Redis read failed — fall through to env
    }
  }

  const envVal = process.env.AI_FALLBACK_PROVIDER ?? 'anthropic'
  return isValidProvider(envVal) ? envVal : 'anthropic'
}

/**
 * Update the provider routing configuration.
 * Persists to Redis with 30-day TTL. Falls back to env on Redis failure.
 */
export async function updateRoutingConfig(
  primary: ProviderId,
  fallback: ProviderId
): Promise<{ success: boolean; error?: string }> {
  if (!isValidProvider(primary) || !isValidProvider(fallback)) {
    return { success: false, error: 'Invalid provider ID' }
  }

  if (primary === fallback) {
    return { success: false, error: 'Primary and fallback must be different providers' }
  }

  const redis = getRedis()
  if (!redis) {
    return {
      success: false,
      error: 'Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable runtime configuration.',
    }
  }

  try {
    await Promise.all([
      redis.set(REDIS_KEY_PRIMARY, primary, { ex: CONFIG_TTL_SECONDS }),
      redis.set(REDIS_KEY_FALLBACK, fallback, { ex: CONFIG_TTL_SECONDS }),
    ])
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to save configuration to Redis' }
  }
}
