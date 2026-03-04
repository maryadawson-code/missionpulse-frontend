/**
 * Provider Health Monitoring — circuit breaker + health tracking.
 * 3 consecutive failures → mark degraded → route to fallback.
 * Status persisted in Redis with 5-minute TTL (falls back to in-memory).
 */
'use server'

import type { ProviderId, AIProvider } from './interface'
import { createAskSageProvider } from './asksage'
import { createAnthropicProvider } from './anthropic'
import { createOpenAIProvider } from './openai'
import { getRedis } from '@/lib/cache/redis'

// ─── Types ──────────────────────────────────────────────────

export interface ProviderHealthStatus {
  id: ProviderId
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latencyMs: number
  lastChecked: string
  consecutiveFailures: number
  configured: boolean
  fedRamp: boolean
}

// ─── Circuit Breaker State ──────────────────────────────────

interface CircuitState {
  failures: number
  status: 'healthy' | 'degraded' | 'down'
  lastChecked: number
  latencyMs: number
}

const CIRCUIT_TTL_MS = 5 * 60 * 1000 // 5 minutes
const CIRCUIT_TTL_SECONDS = 300 // 5 minutes for Redis
const FAILURE_THRESHOLD = 3
const REDIS_KEY_PREFIX = 'mp:health:circuit:'

// In-memory fallback when Redis is unavailable
const memoryCircuitStates = new Map<ProviderId, CircuitState>()

async function getCircuitState(id: ProviderId): Promise<CircuitState> {
  const redis = getRedis()
  const defaultState: CircuitState = {
    failures: 0,
    status: 'healthy',
    lastChecked: 0,
    latencyMs: 0,
  }

  if (redis) {
    try {
      const cached = await redis.get<CircuitState>(`${REDIS_KEY_PREFIX}${id}`)
      if (cached && Date.now() - cached.lastChecked < CIRCUIT_TTL_MS) {
        return cached
      }
      return defaultState
    } catch {
      // Redis failed — fall through to in-memory
    }
  }

  const existing = memoryCircuitStates.get(id)
  if (existing && Date.now() - existing.lastChecked < CIRCUIT_TTL_MS) {
    return existing
  }
  return defaultState
}

async function updateCircuitState(
  id: ProviderId,
  ok: boolean,
  latencyMs: number
): Promise<void> {
  const current = await getCircuitState(id)

  const newState: CircuitState = ok
    ? { failures: 0, status: 'healthy', lastChecked: Date.now(), latencyMs }
    : {
        failures: current.failures + 1,
        status:
          current.failures + 1 >= FAILURE_THRESHOLD ? 'down' : 'degraded',
        lastChecked: Date.now(),
        latencyMs,
      }

  // Persist to Redis with TTL
  const redis = getRedis()
  if (redis) {
    try {
      await redis.set(`${REDIS_KEY_PREFIX}${id}`, newState, {
        ex: CIRCUIT_TTL_SECONDS,
      })
    } catch {
      // Redis write failed — fall through to in-memory
    }
  }

  // Always update in-memory as fallback
  memoryCircuitStates.set(id, newState)
}

// ─── Health Check ───────────────────────────────────────────

async function checkProviderHealth(
  provider: AIProvider
): Promise<ProviderHealthStatus> {
  if (!provider.isConfigured()) {
    return {
      id: provider.id,
      name: provider.name,
      status: 'down',
      latencyMs: 0,
      lastChecked: new Date().toISOString(),
      consecutiveFailures: 0,
      configured: false,
      fedRamp: provider.isFedRAMPAuthorized,
    }
  }

  const { ok, latencyMs } = await provider.ping()
  await updateCircuitState(provider.id, ok, latencyMs)
  const state = await getCircuitState(provider.id)

  return {
    id: provider.id,
    name: provider.name,
    status: state.status,
    latencyMs,
    lastChecked: new Date().toISOString(),
    consecutiveFailures: state.failures,
    configured: true,
    fedRamp: provider.isFedRAMPAuthorized,
  }
}

/**
 * Check health of all providers. Returns status array.
 */
export async function getAllProviderHealth(): Promise<ProviderHealthStatus[]> {
  const providers: AIProvider[] = [
    await createAskSageProvider(),
    await createAnthropicProvider(),
    await createOpenAIProvider(),
  ]

  return Promise.all(providers.map(checkProviderHealth))
}

/**
 * Check if a specific provider is currently healthy.
 * Uses cached circuit state (fast) — doesn't ping on every call.
 */
export async function isProviderHealthy(id: ProviderId): Promise<boolean> {
  const state = await getCircuitState(id)

  // If cache expired, check fresh
  if (Date.now() - state.lastChecked >= CIRCUIT_TTL_MS) {
    const providers: Record<ProviderId, () => Promise<AIProvider>> = {
      asksage: createAskSageProvider,
      anthropic: createAnthropicProvider,
      openai: createOpenAIProvider,
    }

    const provider = await providers[id]()
    const health = await checkProviderHealth(provider)
    return health.status === 'healthy'
  }

  return state.status === 'healthy'
}

/**
 * Record a failure for circuit breaker tracking.
 * Called by the router when a provider query fails.
 */
export async function recordProviderFailure(id: ProviderId): Promise<void> {
  await updateCircuitState(id, false, 0)
}

/**
 * Reset circuit breaker for a provider (manual recovery).
 */
export async function resetProviderCircuit(id: ProviderId): Promise<void> {
  memoryCircuitStates.delete(id)

  const redis = getRedis()
  if (redis) {
    try {
      await redis.del(`${REDIS_KEY_PREFIX}${id}`)
    } catch {
      // Redis delete failed — in-memory already cleared
    }
  }
}
