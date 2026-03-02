/**
 * Token Gate — Middleware called before every AskSage request.
 *
 * Pre-flight: Check remaining balance → allow/warn/block.
 * Post-response: Debit actual tokens consumed.
 *
 * Graduated enforcement:
 *   50% → info banner
 *   75% → warning + executive notification
 *   90% → urgent + email to executive
 *  100% → soft-block (grace period for active proposals)
 *  120% → hard-block (all AI disabled)
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { getTokenBalance, debitTokens, getThresholdLevel } from './ledger'
import { getCompanySubscription } from './plans'
import type { TokenBalance, ThresholdLevel } from './ledger'

// ─── Types ───────────────────────────────────────────────────

export interface TokenGateResult {
  allowed: boolean
  threshold: ThresholdLevel
  balance: TokenBalance | null
  message: string | null
  upgrade_cta: boolean
  grace_period: boolean
}

// Grace period: 10K tokens for proposals with recent gate decisions
const GRACE_PERIOD_TOKENS = 10_000
const GRACE_PERIOD_HOURS = 48

// ─── Pre-flight Check ────────────────────────────────────────

/**
 * Check if a company can make an AI call.
 * Returns gate result with threshold level and optional message.
 */
export async function checkTokenGate(
  companyId: string,
  opportunityId?: string
): Promise<TokenGateResult> {
  const balance = await getTokenBalance(companyId)

  // No balance → no subscription → block
  if (!balance) {
    return {
      allowed: false,
      threshold: 'hard_block',
      balance: null,
      message: 'No active subscription. Subscribe to enable AI features.',
      upgrade_cta: true,
      grace_period: false,
    }
  }

  const threshold = await getThresholdLevel(balance)

  // Hard block at 120%
  if (threshold === 'hard_block') {
    await logEnforcementDecision(companyId, 'hard_block', balance)
    return {
      allowed: false,
      threshold: 'hard_block',
      balance,
      message: 'Monthly AI token limit exceeded (120%). Purchase additional tokens or wait for the next billing period.',
      upgrade_cta: true,
      grace_period: false,
    }
  }

  // Soft block at 100% — check grace period
  if (threshold === 'soft_block') {
    const hasGrace = opportunityId
      ? await checkGracePeriod(companyId, opportunityId, balance)
      : false

    if (hasGrace) {
      await logEnforcementDecision(companyId, 'soft_block_grace', balance)
      return {
        allowed: true,
        threshold: 'soft_block',
        balance,
        message: 'Monthly limit reached. Grace period active for in-progress proposal.',
        upgrade_cta: true,
        grace_period: true,
      }
    }

    // Check auto-overage
    const sub = await getCompanySubscription(companyId)
    if (sub?.auto_overage_enabled) {
      await logEnforcementDecision(companyId, 'soft_block_overage', balance)
      return {
        allowed: true,
        threshold: 'soft_block',
        balance,
        message: 'Monthly limit reached. Auto-overage billing active.',
        upgrade_cta: false,
        grace_period: false,
      }
    }

    await logEnforcementDecision(companyId, 'soft_block', balance)
    return {
      allowed: false,
      threshold: 'soft_block',
      balance,
      message: 'Monthly AI token limit reached. Upgrade your plan or purchase additional tokens.',
      upgrade_cta: true,
      grace_period: false,
    }
  }

  // Thresholds below 100% — allowed with appropriate message
  const messages: Record<string, string | null> = {
    normal: null,
    info: null,
    warning: "You're running low on tokens. Consider upgrading your plan or purchasing more.",
    urgent: "You're almost out of tokens this month. Purchase more or upgrade your plan to keep using AI features.",
  }

  return {
    allowed: true,
    threshold,
    balance,
    message: messages[threshold] ?? null,
    upgrade_cta: threshold === 'warning' || threshold === 'urgent',
    grace_period: false,
  }
}

// ─── Post-Response Debit ─────────────────────────────────────

/**
 * Record token consumption after an AI response.
 * Called by the AI pipeline after every AskSage request.
 */
export async function recordTokenUsage(
  companyId: string,
  tokensUsed: number
): Promise<{ balance: TokenBalance | null }> {
  const result = await debitTokens(companyId, tokensUsed)
  return { balance: result.balance }
}

// ─── Grace Period Check ──────────────────────────────────────

/**
 * Check if an opportunity qualifies for grace period tokens.
 * Active proposals with gate decisions in the last 48 hours get 10K bonus tokens.
 */
async function checkGracePeriod(
  companyId: string,
  opportunityId: string,
  balance: TokenBalance
): Promise<boolean> {
  // Already exceeded grace tokens
  const overageAmount = balance.consumed - balance.total_available
  if (overageAmount > GRACE_PERIOD_TOKENS) return false

  const supabase = await createClient()
  const cutoff = new Date(Date.now() - GRACE_PERIOD_HOURS * 60 * 60 * 1000).toISOString()

  // Check for recent gate decisions on this opportunity
  const { data } = await supabase
    .from('activity_feed')
    .select('id')
    .eq('opportunity_id', opportunityId)
    .eq('action_type', 'gate_decision')
    .gte('created_at', cutoff)
    .limit(1)

  if (!data || data.length === 0) {
    // Also check for recent AI interactions on this opportunity
    const { data: aiData } = await supabase
      .from('ai_interactions')
      .select('id')
      .eq('opportunity_id', opportunityId)
      .gte('created_at', cutoff)
      .limit(1)

    return (aiData?.length ?? 0) > 0
  }

  return true
}

// ─── Enforcement Logging ─────────────────────────────────────

async function logEnforcementDecision(
  companyId: string,
  decision: string,
  balance: TokenBalance
): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('audit_logs').insert({
      action: `token_gate_${decision}`,
      user_id: user?.id ?? '00000000-0000-0000-0000-000000000000',
      table_name: 'token_ledger',
      record_id: companyId,
      new_values: JSON.parse(JSON.stringify({
        company_id: companyId,
        decision,
        usage_percent: balance.usage_percent,
        consumed: balance.consumed,
        allocated: balance.allocated,
        purchased: balance.purchased,
      })),
    })
  } catch {
    // Non-blocking — don't fail the AI request over logging
  }
}
