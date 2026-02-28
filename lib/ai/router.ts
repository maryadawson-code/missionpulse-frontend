/**
 * AI Router — classification-aware provider routing.
 * CUI/FOUO/SECRET → AskSage only (FedRAMP).
 * UNCLASSIFIED → Primary provider (env), fallback to secondary.
 *
 * Reads AI_PRIMARY_PROVIDER / AI_FALLBACK_PROVIDER from environment.
 */
'use server'

import type { ClassificationLevel } from './types'
import { AIError } from './types'
import type {
  AIProvider,
  ProviderId,
  ProviderQueryRequest,
  ProviderQueryResponse,
} from './providers/interface'
import { getAllowedProviders } from './providers/interface'
import { createAskSageProvider } from './providers/asksage'
import { createAnthropicProvider } from './providers/anthropic'
import { createOpenAIProvider } from './providers/openai'
import {
  getPrimaryProviderId as getConfiguredPrimary,
  getFallbackProviderId as getConfiguredFallback,
} from './providers/routing-config'

// ─── Provider Registry ──────────────────────────────────────

let _providerCache: AIProvider[] | null = null

async function getProviders(): Promise<AIProvider[]> {
  if (_providerCache) return _providerCache

  _providerCache = [
    await createAskSageProvider(),
    await createAnthropicProvider(),
    await createOpenAIProvider(),
  ]

  return _providerCache
}

async function getProviderById(id: ProviderId): Promise<AIProvider | null> {
  const providers = await getProviders()
  return providers.find((p) => p.id === id) ?? null
}

// ─── Routing Config ─────────────────────────────────────────
// Primary/fallback provider resolved from Redis (admin-configurable)
// with fallback to AI_PRIMARY_PROVIDER / AI_FALLBACK_PROVIDER env vars.

// ─── Routing ────────────────────────────────────────────────

export interface RouteResult {
  provider: AIProvider
  fallback: AIProvider | null
  classification: ClassificationLevel
  reason: string
}

/**
 * Determine which provider(s) to use for a given classification level.
 * CUI+ → AskSage only (FedRAMP mandate).
 * UNCLASSIFIED → Primary env provider with fallback.
 */
export async function routeRequest(
  classification: ClassificationLevel
): Promise<RouteResult> {
  const providers = await getProviders()
  const allowed = getAllowedProviders(classification, providers)

  if (allowed.length === 0) {
    throw new AIError(
      'AUTH_ERROR',
      'No AI providers configured. Set at least ASKSAGE_API_KEY in environment.',
      false
    )
  }

  // CUI+ → FedRAMP providers only (AskSage)
  if (classification !== 'UNCLASSIFIED') {
    const fedRampProviders = allowed.filter((p) => p.isFedRAMPAuthorized)
    if (fedRampProviders.length === 0) {
      throw new AIError(
        'CLASSIFICATION_BLOCKED',
        `CUI-classified request requires FedRAMP provider but none configured. Set ASKSAGE_API_KEY.`,
        false
      )
    }
    return {
      provider: fedRampProviders[0],
      fallback: fedRampProviders.length > 1 ? fedRampProviders[1] : null,
      classification,
      reason: `${classification} → FedRAMP-only routing (${fedRampProviders[0].name})`,
    }
  }

  // UNCLASSIFIED → respect configured priority
  const primaryId = await getConfiguredPrimary()
  const fallbackId = await getConfiguredFallback()

  const primary = await getProviderById(primaryId)
  const fallback = await getProviderById(fallbackId)

  // Use configured primary, or first available
  const selectedPrimary =
    primary?.isConfigured() ? primary : allowed[0]
  const selectedFallback =
    fallback?.isConfigured() && fallback.id !== selectedPrimary.id
      ? fallback
      : allowed.find((p) => p.id !== selectedPrimary.id) ?? null

  return {
    provider: selectedPrimary,
    fallback: selectedFallback,
    classification,
    reason: `UNCLASSIFIED → ${selectedPrimary.name}${selectedFallback ? ` (fallback: ${selectedFallback.name})` : ''}`,
  }
}

/**
 * Execute a query with automatic failover.
 * Tries primary provider, falls back to secondary on failure.
 */
export async function routedQuery(
  request: ProviderQueryRequest,
  classification: ClassificationLevel
): Promise<ProviderQueryResponse> {
  const route = await routeRequest(classification)

  try {
    return await route.provider.query(request)
  } catch (primaryErr) {
    // If no fallback or CUI (can't fall back to non-FedRAMP), re-throw
    if (!route.fallback) throw primaryErr

    console.warn(
      `[ai-router] Primary provider ${route.provider.name} failed, falling back to ${route.fallback.name}:`,
      primaryErr instanceof Error ? primaryErr.message : primaryErr
    )

    return await route.fallback.query(request)
  }
}

/**
 * Get all registered providers and their configuration status.
 */
export async function getProviderStatus(): Promise<
  Array<{
    id: ProviderId
    name: string
    configured: boolean
    fedRamp: boolean
    isPrimary: boolean
    isFallback: boolean
  }>
> {
  const providers = await getProviders()
  const primaryId = await getConfiguredPrimary()
  const fallbackId = await getConfiguredFallback()

  return providers.map((p) => ({
    id: p.id,
    name: p.name,
    configured: p.isConfigured(),
    fedRamp: p.isFedRAMPAuthorized,
    isPrimary: p.id === primaryId,
    isFallback: p.id === fallbackId,
  }))
}
