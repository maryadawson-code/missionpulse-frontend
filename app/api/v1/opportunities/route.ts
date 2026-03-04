/**
 * Public REST API — Opportunities (List + Create)
 * Sprint 33 (T-33.2) — Phase L v2.0
 * © 2026 Mission Meets Tech
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAPIKey } from '@/lib/api/keys'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/api/rate-limiter'

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header', status: 401 }
  }
  const key = authHeader.slice(7)
  const validated = await validateAPIKey(key)
  if (!validated) {
    return { error: 'Invalid or expired API key', status: 401 }
  }

  const rateResult = checkRateLimit(key, validated.rateLimit)
  if (!rateResult.allowed) {
    return {
      error: 'Rate limit exceeded',
      status: 429,
      headers: getRateLimitHeaders(rateResult, validated.rateLimit),
    }
  }

  return { validated, headers: getRateLimitHeaders(rateResult, validated.rateLimit) }
}

export async function GET(req: NextRequest) {
  const auth = await authenticate(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: auth.headers })
  }

  if (!auth.validated.permissions.includes('read')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403, headers: auth.headers })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('id, title, agency, ceiling, pwin, phase, status, due_date, solicitation_number, set_aside, naics_code')
    .eq('company_id', auth.validated.companyId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: auth.headers })
  }

  return NextResponse.json({ data, count: data?.length ?? 0 }, { headers: auth.headers })
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: auth.headers })
  }

  if (!auth.validated.permissions.includes('write')) {
    return NextResponse.json({ error: 'Write permission required' }, { status: 403, headers: auth.headers })
  }

  const body = await req.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      ...body,
      company_id: auth.validated.companyId,
    })
    .select('id, title, agency, status')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: auth.headers })
  }

  return NextResponse.json({ data }, { status: 201, headers: auth.headers })
}
