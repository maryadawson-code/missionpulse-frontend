/**
 * Provider Health Monitoring — circuit breaker + health tracking.
 * 3 consecutive failures → mark degraded → route to fallback.
 * Status cached with 5-minute TTL.
 */
'use server'

import type { ProviderId, AIProvider } from './interface'
import { createAskSageProvider } from './asksage'
import { createAnthropicProvider } from './anthropic'
import { createOpenAIProvider } from './openai'

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

// ─── In-Memory Circuit Breaker State ────────────────────────
// In production, this would be in Redis with 5-minute TTL.
// For serverless, we use module-level state (resets on cold start).

interface CircuitState {
  failures: number
  status: 'healthy' | 'degraded' | 'down'
  lastChecked: number
  latencyMs: number
}

const CIRCUIT_TTL_MS = 5 * 60 * 1000 // 5 minutes
const FAILURE_THRESHOLD = 3

const circuitStates = new Map<ProviderId, CircuitState>()

function getCircuitState(id: ProviderId): CircuitState {
  const existing = circuitStates.get(id)
  if (existing && Date.now() - existing.lastChecked < CIRCUIT_TTL_MS) {
    return existing
  }
  return { failures: 0, status: 'healthy', lastChecked: 0, latencyMs: 0 }
}

function updateCircuitState(id: ProviderId, ok: boolean, latencyMs: number) {
  const current = getCircuitState(id)

  if (ok) {
    circuitStates.set(id, {
      failures: 0,
      status: 'healthy',
      lastChecked: Date.now(),
      latencyMs,
    })
  } else {
    const failures = current.failures + 1
    circuitStates.set(id, {
      failures,
      status: failures >= FAILURE_THRESHOLD ? 'down' : 'degraded',
      lastChecked: Date.now(),
      latencyMs,
    })
  }
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
  updateCircuitState(provider.id, ok, latencyMs)
  const state = getCircuitState(provider.id)

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
  const state = getCircuitState(id)

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
  updateCircuitState(id, false, 0)
}

/**
 * Reset circuit breaker for a provider (manual recovery).
 */
export async function resetProviderCircuit(id: ProviderId): Promise<void> {
  circuitStates.delete(id)
}
