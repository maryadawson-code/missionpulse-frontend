/**
 * AI Provider Interface — provider-agnostic abstraction.
 * All AI providers (AskSage, Anthropic, OpenAI) implement this interface.
 */

import type { ClassificationLevel, ClassificationResult } from '../types'

// ─── Provider Types ─────────────────────────────────────────

export type ProviderId = 'asksage' | 'anthropic' | 'openai'

export interface ProviderQueryRequest {
  model: string
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  context?: string
}

export interface ProviderQueryResponse {
  content: string
  model: string
  tokensUsed: {
    input: number
    output: number
    total: number
  }
  provider: ProviderId
}

export interface ProviderEmbedRequest {
  input: string
  model?: string
}

export interface ProviderEmbedResponse {
  embedding: number[]
  model: string
  tokensUsed: number
  provider: ProviderId
}

export interface ProviderClassifyRequest {
  content: string
  context?: string
}

export interface ProviderClassifyResponse {
  classification: ClassificationResult
  provider: ProviderId
}

// ─── Provider Interface ─────────────────────────────────────

export interface AIProvider {
  /** Unique provider identifier */
  readonly id: ProviderId

  /** Human-readable provider name */
  readonly name: string

  /** Whether this provider is FedRAMP authorized (required for CUI) */
  readonly isFedRAMPAuthorized: boolean

  /** Check if the provider is configured (API key present) */
  isConfigured(): boolean

  /** Send a query to the provider */
  query(_request: ProviderQueryRequest): Promise<ProviderQueryResponse>

  /** Generate embeddings (optional — not all providers support this) */
  embed?(_request: ProviderEmbedRequest): Promise<ProviderEmbedResponse>

  /** Classify content by sensitivity level (CUI/OPSEC detection) */
  classify(_request: ProviderClassifyRequest): Promise<ProviderClassifyResponse>

  /** Quick connectivity check */
  ping(): Promise<{ ok: boolean; latencyMs: number }>
}

// ─── Classification → Provider constraints ──────────────────

/**
 * Returns the set of provider IDs allowed for a given classification level.
 * CUI and above → only FedRAMP-authorized providers.
 */
export function getAllowedProviders(
  classification: ClassificationLevel,
  providers: AIProvider[]
): AIProvider[] {
  if (classification === 'UNCLASSIFIED') {
    return providers.filter((p) => p.isConfigured())
  }
  // CUI, CUI//SP-PROPIN, OPSEC → FedRAMP only
  return providers.filter((p) => p.isFedRAMPAuthorized && p.isConfigured())
}
