/**
 * Public REST API — Compliance Requirements
 * Sprint 33 (T-33.2) — Phase L v2.0
 * © 2026 Mission Meets Tech
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAPIKey } from '@/lib/api/keys'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/api/rate-limiter'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  const { opportunityId } = await params

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

  const { data, error } = await supabase
    .from('compliance_requirements')
    .select('id, reference, requirement, section, priority, status')
    .eq('opportunity_id', opportunityId)
    .order('reference', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers })
  }

  return NextResponse.json({ data, count: data?.length ?? 0 }, { headers })
}
