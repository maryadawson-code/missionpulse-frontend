// filepath: app/api/integrations/slack/callback/route.ts

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET ?? ''

/**
 * Verify that a request came from Slack using the signing secret.
 */
function verifySignature(
  timestamp: string,
  body: string,
  signature: string
): boolean {
  if (!SLACK_SIGNING_SECRET) return false

  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300
  if (parseInt(timestamp) < fiveMinutesAgo) return false

  const sigBasestring = `v0:${timestamp}:${body}`
  const mySignature =
    'v0=' +
    crypto
      .createHmac('sha256', SLACK_SIGNING_SECRET)
      .update(sigBasestring)
      .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  )
}

/**
 * Slack Interactive Messages & Events callback endpoint.
 *
 * Handles:
 * - URL verification (Slack handshake)
 * - Gate approval/rejection button clicks
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const timestamp = request.headers.get('x-slack-request-timestamp') ?? ''
  const signature = request.headers.get('x-slack-signature') ?? ''

  // Verify request authenticity
  if (!verifySignature(timestamp, rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Slack sends interactive payloads as URL-encoded form data
  let eventType: string
  let payload: unknown

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(rawBody)
    const payloadStr = params.get('payload')
    if (!payloadStr) {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 })
    }
    const parsed = JSON.parse(payloadStr) as { type: string }
    eventType = parsed.type
    payload = parsed
  } else {
    const parsed = JSON.parse(rawBody) as { type: string }
    eventType = parsed.type
    payload = parsed
  }

  // Dynamic import to avoid 'use server' constraint issues
  const { handleSlackWebhook } = await import(
    '@/lib/integrations/slack/webhook-handler'
  )
  const result = await handleSlackWebhook(eventType, payload)

  return NextResponse.json(result.body, { status: result.status })
}
