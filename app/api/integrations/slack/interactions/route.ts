/**
 * Slack Interactive Webhook — handles button clicks from gate approval messages.
 *
 * Slack sends POST with form-encoded payload containing the action data.
 * We verify the signing secret, then route to the webhook handler.
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  verifySlackSignature,
  handleSlackWebhook,
} from '@/lib/integrations/slack/webhook-handler'

export async function POST(request: NextRequest) {
  const body = await request.text()

  // Verify Slack signature
  const timestamp = request.headers.get('x-slack-request-timestamp') ?? ''
  const signature = request.headers.get('x-slack-signature') ?? ''

  const valid = await verifySlackSignature(timestamp, body, signature)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Parse form-encoded payload
  const params = new URLSearchParams(body)
  const payloadStr = params.get('payload')
  if (!payloadStr) {
    return NextResponse.json({ error: 'Missing payload' }, { status: 400 })
  }

  const payload = JSON.parse(payloadStr) as { type: string }

  const result = await handleSlackWebhook(payload.type, payload)

  return NextResponse.json(result.body, { status: result.status })
}
