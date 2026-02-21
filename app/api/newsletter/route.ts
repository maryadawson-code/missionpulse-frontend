/**
 * Newsletter Subscriber API
 * POST /api/newsletter — Subscribe email
 * DELETE /api/newsletter — Unsubscribe email (GDPR)
 *
 * Public endpoint, no auth required. Rate limited.
 * Uses service role for insert (RLS bypassed).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Rate limiting: 5 requests per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 5

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  )
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// POST — Subscribe
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  let body: { email?: string; source?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }

  const email = body.email?.toLowerCase().trim()
  const source = body.source ?? 'website'

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: 'Valid email address required' },
      { status: 400 }
    )
  }

  try {
    const supabase = createAdminClient()

    // Upsert: re-subscribe if previously unsubscribed
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        {
          email,
          source,
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
          ip_address: ip,
        },
        { onConflict: 'email' }
      )

    if (error) {
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 503 }
    )
  }
}

// DELETE — Unsubscribe (GDPR)
export async function DELETE(request: NextRequest) {
  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }

  const email = body.email?.toLowerCase().trim()

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: 'Valid email address required' },
      { status: 400 }
    )
  }

  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('email', email)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to unsubscribe. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 503 }
    )
  }
}
