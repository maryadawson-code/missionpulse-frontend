/**
 * Token Ledger — Single source of truth for "can this company make an AI call?"
 *
 * Tracks allocation, consumption, purchased tokens, and overage per billing period.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { getCompanySubscription } from './plans'

// ─── Types ───────────────────────────────────────────────────

export interface TokenLedgerEntry {
  id: string
  company_id: string
  period_start: string
  period_end: string
  tokens_allocated: number
  tokens_consumed: number
  tokens_purchased: number
  overage_tokens_used: number
}

export interface TokenBalance {
  allocated: number
  consumed: number
  purchased: number
  overage_used: number
  remaining: number
  total_available: number
  usage_percent: number
  period_start: string
  period_end: string
}

export type ThresholdLevel = 'normal' | 'info' | 'warning' | 'urgent' | 'soft_block' | 'hard_block'

// ─── Ledger Queries ──────────────────────────────────────────

/**
 * Get the current billing period's token balance for a company.
 * Creates a new ledger entry if none exists for the current period.
 */
export async function getTokenBalance(
  companyId: string
): Promise<TokenBalance | null> {
  const supabase = await createClient()
  const now = new Date()

  // Get current ledger entry
  const { data: ledger } = await supabase
    .from('token_ledger')
    .select('*')
    .eq('company_id', companyId)
    .lte('period_start', now.toISOString())
    .gte('period_end', now.toISOString())
    .order('period_start', { ascending: false })
    .limit(1)
    .single()

  if (ledger) {
    return mapBalance(ledger as Record<string, unknown>)
  }

  // No ledger entry — create one from subscription
  const sub = await getCompanySubscription(companyId)
  if (!sub?.plan) return null

  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const { data: newLedger, error } = await supabase
    .from('token_ledger')
    .insert({
      company_id: companyId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      tokens_allocated: sub.plan.monthly_token_limit,
      tokens_consumed: 0,
      tokens_purchased: 0,
      overage_tokens_used: 0,
    })
    .select()
    .single()

  if (error || !newLedger) return null
  return mapBalance(newLedger as Record<string, unknown>)
}

/**
 * Debit tokens from the current period's ledger.
 * Returns the updated balance and whether the operation was allowed.
 */
export async function debitTokens(
  companyId: string,
  tokensUsed: number
): Promise<{ allowed: boolean; balance: TokenBalance | null }> {
  const balance = await getTokenBalance(companyId)
  if (!balance) return { allowed: false, balance: null }

  const supabase = await createClient()

  const newConsumed = balance.consumed + tokensUsed
  const totalAvailable = balance.allocated + balance.purchased
  const isOverage = newConsumed > totalAvailable

  if (isOverage) {
    const overageAmount = newConsumed - totalAvailable
    const newOverage = balance.overage_used + overageAmount

    await supabase
      .from('token_ledger')
      .update({
        tokens_consumed: newConsumed,
        overage_tokens_used: newOverage,
      })
      .eq('company_id', companyId)
      .gte('period_end', new Date().toISOString())
      .order('period_start', { ascending: false })
      .limit(1)
  } else {
    await supabase
      .from('token_ledger')
      .update({ tokens_consumed: newConsumed })
      .eq('company_id', companyId)
      .gte('period_end', new Date().toISOString())
      .order('period_start', { ascending: false })
      .limit(1)
  }

  const updated = await getTokenBalance(companyId)
  return { allowed: true, balance: updated }
}

/**
 * Credit purchased tokens to the current period's ledger.
 */
export async function creditPurchasedTokens(
  companyId: string,
  tokenAmount: number
): Promise<{ success: boolean }> {
  const balance = await getTokenBalance(companyId)
  if (!balance) return { success: false }

  const supabase = await createClient()

  const { error } = await supabase
    .from('token_ledger')
    .update({
      tokens_purchased: balance.purchased + tokenAmount,
    })
    .eq('company_id', companyId)
    .gte('period_end', new Date().toISOString())
    .order('period_start', { ascending: false })
    .limit(1)

  return { success: !error }
}

/**
 * Get the threshold level based on current consumption.
 */
export async function getThresholdLevel(balance: TokenBalance): Promise<ThresholdLevel> {
  const percent = balance.usage_percent

  if (percent >= 120) return 'hard_block'
  if (percent >= 100) return 'soft_block'
  if (percent >= 90) return 'urgent'
  if (percent >= 75) return 'warning'
  if (percent >= 50) return 'info'
  return 'normal'
}

/**
 * Get historical ledger entries for a company (last N periods).
 */
export async function getLedgerHistory(
  companyId: string,
  periods: number = 6
): Promise<TokenLedgerEntry[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('token_ledger')
    .select('*')
    .eq('company_id', companyId)
    .order('period_start', { ascending: false })
    .limit(periods)

  if (!data) return []

  return data.map((row) => {
    const r = row as Record<string, unknown>
    return {
      id: r.id as string,
      company_id: r.company_id as string,
      period_start: r.period_start as string,
      period_end: r.period_end as string,
      tokens_allocated: Number(r.tokens_allocated),
      tokens_consumed: Number(r.tokens_consumed),
      tokens_purchased: Number(r.tokens_purchased),
      overage_tokens_used: Number(r.overage_tokens_used),
    }
  })
}

// ─── Helpers ─────────────────────────────────────────────────

function mapBalance(row: Record<string, unknown>): TokenBalance {
  const allocated = Number(row.tokens_allocated)
  const consumed = Number(row.tokens_consumed)
  const purchased = Number(row.tokens_purchased)
  const overageUsed = Number(row.overage_tokens_used)
  const totalAvailable = allocated + purchased
  const remaining = Math.max(0, totalAvailable - consumed)
  const usagePercent = totalAvailable > 0
    ? Math.round((consumed / totalAvailable) * 100)
    : 0

  return {
    allocated,
    consumed,
    purchased,
    overage_used: overageUsed,
    remaining,
    total_available: totalAvailable,
    usage_percent: usagePercent,
    period_start: row.period_start as string,
    period_end: row.period_end as string,
  }
}
