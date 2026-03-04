/**
 * Public REST API — Proposal (Read-only)
 * Sprint 33 (T-33.2) — Phase L v2.0
 * © 2026 Mission Meets Tech
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAPIKey } from '@/lib/api/keys'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/api/rate-limiter'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

  // Fetch proposal sections for the opportunity
  const { data: sections } = await supabase
    .from('proposal_sections')
    .select('id, section_title, section_number, volume, status, content')
    .eq('opportunity_id', id)
    .order('section_number', { ascending: true })

  const { data: volumes } = await supabase
    .from('proposal_volumes')
    .select('id, volume_name, volume_number')
    .eq('opportunity_id', id)
    .order('volume_number', { ascending: true })

  return NextResponse.json({ volumes, sections }, { headers })
}
