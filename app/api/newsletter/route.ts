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
import {
  validateRequestBody,
  validationErrorResponse,
  newsletterSubscribeSchema,
  newsletterUnsubscribeSchema,
} from '@/lib/api/schemas'

// POST — Subscribe (rate limiting handled by middleware)
export async function POST(request: NextRequest) {
  const validation = await validateRequestBody(request, newsletterSubscribeSchema)
  if (!validation.success) {
    return validationErrorResponse(validation.error, validation.details)
  }

  const { email, source } = validation.data

  try {
    const supabase = createAdminClient()

    // Upsert: re-subscribe if previously unsubscribed
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        {
          email: email.toLowerCase(),
          source: source ?? 'website',
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
          ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
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
  const validation = await validateRequestBody(request, newsletterUnsubscribeSchema)
  if (!validation.success) {
    return validationErrorResponse(validation.error, validation.details)
  }

  const { email } = validation.data

  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('email', email.toLowerCase())

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
