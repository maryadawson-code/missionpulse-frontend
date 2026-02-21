/**
 * Burn Rate Projection — Linear extrapolation of daily token consumption.
 *
 * Calculates projected exhaustion date based on average daily usage.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { getTokenBalance } from './ledger'
import type { TokenBalance } from './ledger'

// ─── Types ───────────────────────────────────────────────────

export interface BurnRateProjection {
  avg_daily_tokens: number
  projected_exhaustion_date: string | null
  days_remaining: number | null
  daily_data: { date: string; tokens: number }[]
  balance: TokenBalance
}

// ─── Projection ──────────────────────────────────────────────

/**
 * Calculate burn rate projection for a company's current billing period.
 */
export async function getBurnRateProjection(
  companyId: string
): Promise<BurnRateProjection | null> {
  const balance = await getTokenBalance(companyId)
  if (!balance) return null

  const supabase = await createClient()

  // Get daily token usage for current period
  const { data: entries } = await supabase
    .from('token_usage')
    .select('input_tokens, output_tokens, created_at')
    .gte('created_at', balance.period_start)
    .lte('created_at', balance.period_end)
    .order('created_at', { ascending: true })

  // Aggregate by day
  const dailyMap = new Map<string, number>()
  for (const entry of entries ?? []) {
    const day = (entry.created_at as string).slice(0, 10)
    const tokens = (entry.input_tokens as number) + (entry.output_tokens as number)
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + tokens)
  }

  const dailyData = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, tokens]) => ({ date, tokens }))

  // Calculate average daily consumption
  const totalDailyTokens = dailyData.reduce((sum, d) => sum + d.tokens, 0)
  const daysWithData = dailyData.length || 1
  const avgDaily = Math.round(totalDailyTokens / daysWithData)

  // Project exhaustion
  let projectedExhaustionDate: string | null = null
  let daysRemaining: number | null = null

  if (avgDaily > 0 && balance.remaining > 0) {
    daysRemaining = Math.ceil(balance.remaining / avgDaily)
    const exhaustionDate = new Date()
    exhaustionDate.setDate(exhaustionDate.getDate() + daysRemaining)

    // Cap at period end
    const periodEnd = new Date(balance.period_end)
    if (exhaustionDate < periodEnd) {
      projectedExhaustionDate = exhaustionDate.toISOString().slice(0, 10)
    } else {
      projectedExhaustionDate = null // Won't exhaust this period
      daysRemaining = null
    }
  } else if (balance.remaining <= 0) {
    daysRemaining = 0
    projectedExhaustionDate = new Date().toISOString().slice(0, 10)
  }

  return {
    avg_daily_tokens: avgDaily,
    projected_exhaustion_date: projectedExhaustionDate,
    days_remaining: daysRemaining,
    daily_data: dailyData,
    balance,
  }
}
