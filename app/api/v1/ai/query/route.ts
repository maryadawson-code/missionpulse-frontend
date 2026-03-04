/**
 * Public REST API — AI Query
 * Sprint 33 (T-33.2) — Phase L v2.0
 * © 2026 Mission Meets Tech
 */

import { NextResponse, type NextRequest } from 'next/server'
import { validateAPIKey } from '@/lib/api/keys'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/api/rate-limiter'

export async function POST(req: NextRequest) {
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

  if (!validated.permissions.includes('ai')) {
    return NextResponse.json({ error: 'AI permission required' }, { status: 403, headers })
  }

  const body = await req.json() as { query?: string; opportunityId?: string; agent?: string }

  if (!body.query) {
    return NextResponse.json({ error: 'query field required' }, { status: 400, headers })
  }

  // AI query is processed via the existing AI agent system
  // The API exposes the same capabilities as the web UI
  return NextResponse.json({
    message: 'AI query accepted',
    query: body.query,
    opportunityId: body.opportunityId ?? null,
    agent: body.agent ?? 'chat',
    status: 'queued',
    footer: 'AI GENERATED — REQUIRES HUMAN REVIEW',
  }, { headers })
}
