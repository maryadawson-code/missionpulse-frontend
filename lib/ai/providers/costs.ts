/**
 * Provider Cost Tracking — per-provider, per-model cost rates.
 * Enables budget projection and vendor comparison.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import type { ProviderId } from './interface'

// ─── Cost Rates (per 1K tokens) ─────────────────────────────

interface ModelCostRate {
  inputPer1k: number
  outputPer1k: number
}

const COST_RATES: Record<string, Record<string, ModelCostRate>> = {
  asksage: {
    'claude-haiku-4-5': { inputPer1k: 0.0008, outputPer1k: 0.004 },
    'claude-sonnet-4-5': { inputPer1k: 0.003, outputPer1k: 0.015 },
    'claude-opus-4': { inputPer1k: 0.015, outputPer1k: 0.075 },
    'gpt-4o': { inputPer1k: 0.0025, outputPer1k: 0.01 },
    default: { inputPer1k: 0.003, outputPer1k: 0.015 },
  },
  anthropic: {
    'claude-haiku-4-5-20251001': { inputPer1k: 0.0008, outputPer1k: 0.004 },
    'claude-sonnet-4-5-20250514': { inputPer1k: 0.003, outputPer1k: 0.015 },
    'claude-opus-4-20250514': { inputPer1k: 0.015, outputPer1k: 0.075 },
    default: { inputPer1k: 0.003, outputPer1k: 0.015 },
  },
  openai: {
    'gpt-4o': { inputPer1k: 0.0025, outputPer1k: 0.01 },
    'gpt-4o-mini': { inputPer1k: 0.00015, outputPer1k: 0.0006 },
    default: { inputPer1k: 0.0025, outputPer1k: 0.01 },
  },
}

/**
 * Get cost rate for a specific provider + model combo.
 */
export async function getCostRate(
  provider: ProviderId,
  model: string
): Promise<ModelCostRate> {
  const providerRates = COST_RATES[provider] ?? COST_RATES.asksage
  return providerRates[model] ?? providerRates.default
}

/**
 * Calculate cost for a request.
 */
export async function calculateCost(
  provider: ProviderId,
  model: string,
  inputTokens: number,
  outputTokens: number
): Promise<number> {
  const rate = await getCostRate(provider, model)
  return (inputTokens / 1000) * rate.inputPer1k + (outputTokens / 1000) * rate.outputPer1k
}

// ─── Analytics ──────────────────────────────────────────────

export interface ProviderCostSummary {
  provider: string
  totalCost: number
  totalTokens: number
  requestCount: number
}

/**
 * Get cost breakdown by provider for the current month.
 */
export async function getProviderCostBreakdown(): Promise<ProviderCostSummary[]> {
  const supabase = await createClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('token_usage')
    .select('estimated_cost_usd, input_tokens, output_tokens, metadata')
    .gte('created_at', startOfMonth.toISOString())

  if (!data || data.length === 0) {
    return []
  }

  // Group by provider
  const byProvider = new Map<string, ProviderCostSummary>()

  for (const row of data) {
    const meta = row.metadata as Record<string, unknown> | null
    const provider = (meta?.provider as string) ?? 'asksage'

    const existing = byProvider.get(provider) ?? {
      provider,
      totalCost: 0,
      totalTokens: 0,
      requestCount: 0,
    }

    existing.totalCost += row.estimated_cost_usd ?? 0
    existing.totalTokens += (row.input_tokens ?? 0) + (row.output_tokens ?? 0)
    existing.requestCount += 1

    byProvider.set(provider, existing)
  }

  return Array.from(byProvider.values()).sort((a, b) => b.totalCost - a.totalCost)
}
