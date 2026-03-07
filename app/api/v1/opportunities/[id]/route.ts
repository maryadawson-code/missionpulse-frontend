/**
 * Public REST API — Opportunity CRUD (by ID)
 * Sprint 33 (T-33.2) — Phase L v2.0
 * © 2026 Mission Meets Tech
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAPIKey } from '@/lib/api/keys'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/api/rate-limiter'
import { updateOpportunitySchema } from '@/lib/api/schemas'

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
    return { error: 'Rate limit exceeded', status: 429, headers: getRateLimitHeaders(rateResult, validated.rateLimit) }
  }

  return { validated, headers: getRateLimitHeaders(rateResult, validated.rateLimit) }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await authenticate(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: auth.headers })
  }

  if (!auth.validated.permissions.includes('read')) {
    return NextResponse.json({ error: 'Read permission required' }, { status: 403, headers: auth.headers })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .eq('company_id', auth.validated.companyId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: auth.headers })
  }

  return NextResponse.json({ data }, { headers: auth.headers })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await authenticate(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: auth.headers })
  }

  if (!auth.validated.permissions.includes('write')) {
    return NextResponse.json({ error: 'Write permission required' }, { status: 403, headers: auth.headers })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: auth.headers })
  }

  const parsed = updateOpportunitySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400, headers: auth.headers }
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('opportunities')
    .update(parsed.data)
    .eq('id', id)
    .eq('company_id', auth.validated.companyId)
    .select('id, title, status')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: auth.headers })
  }

  return NextResponse.json({ data }, { headers: auth.headers })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await authenticate(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: auth.headers })
  }

  if (!auth.validated.permissions.includes('write')) {
    return NextResponse.json({ error: 'Write permission required' }, { status: 403, headers: auth.headers })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', id)
    .eq('company_id', auth.validated.companyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: auth.headers })
  }

  return NextResponse.json({ success: true }, { status: 200, headers: auth.headers })
}
