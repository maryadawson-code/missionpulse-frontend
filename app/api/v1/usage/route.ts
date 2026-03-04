/**
 * Public REST API — Token Usage
 * Sprint 33 (T-33.2) — Phase L v2.0
 * © 2026 Mission Meets Tech
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAPIKey } from '@/lib/api/keys'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/api/rate-limiter'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const key = authHeader.slice(7)
  const validated = await validateAPIKey(key)
  if (!validated) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const rateResult = checkRateLimit(key, validated.rateLimit)
  const headers = getRateLimitHeaders(rateResult, validated.rateLimit)

  if (!rateResult.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers })
  }

  if (!validated.permissions.includes('read')) {
    return NextResponse.json({ error: 'Read permission required' }, { status: 403, headers })
  }

  const supabase = await createClient()

  // Get token ledger for the company
  const { data: ledger } = await supabase
    .from('token_ledger')
    .select('tokens_allocated, tokens_consumed, tokens_purchased, overage_tokens')
    .eq('company_id', validated.companyId)
    .single()

  // Get recent usage
  const { data: recentUsage } = await supabase
    .from('token_usage')
    .select('tokens_used, task_type, created_at')
    .eq('company_id', validated.companyId)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({
    ledger: ledger ?? { tokens_allocated: 0, tokens_consumed: 0, tokens_purchased: 0, overage_tokens: 0 },
    recent_usage: recentUsage ?? [],
  }, { headers })
}
