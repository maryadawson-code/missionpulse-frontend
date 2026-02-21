/**
 * Slack Webhook Handler
 *
 * Processes incoming Slack events and interactive messages:
 * - Interactive button clicks (gate approvals)
 * - URL verification (Slack handshake)
 *
 * Expected to be called from /api/integrations/slack/webhook route.
 */
'use server'

import { processGateDecision, type GateApprovalAction } from './gate-approval'
import crypto from 'crypto'

// ─── Config ──────────────────────────────────────────────────

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET ?? ''

// ─── Types ───────────────────────────────────────────────────

interface SlackInteractionPayload {
  type: 'block_actions' | 'view_submission' | 'shortcut'
  user: {
    id: string
    username: string
    name: string
  }
  actions: Array<{
    action_id: string
    value: string
    block_id: string
  }>
  message: {
    ts: string
  }
  channel: {
    id: string
  }
  trigger_id: string
}

export interface WebhookResult {
  status: number
  body: string | Record<string, unknown>
}

// ─── Signature Verification ─────────────────────────────────

/**
 * Verify that a request came from Slack using the signing secret.
 */
export function verifySlackSignature(
  timestamp: string,
  body: string,
  signature: string
): boolean {
  if (!SLACK_SIGNING_SECRET) return false

  // Reject requests older than 5 minutes (replay protection)
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

// ─── Main Handler ───────────────────────────────────────────

/**
 * Handle incoming Slack webhook events.
 */
export async function handleSlackWebhook(
  eventType: string,
  payload: unknown
): Promise<WebhookResult> {
  // URL verification (Slack handshake)
  if (eventType === 'url_verification') {
    const data = payload as { challenge: string }
    return { status: 200, body: { challenge: data.challenge } }
  }

  // Interactive message (button clicks)
  if (eventType === 'block_actions') {
    return handleBlockActions(payload as SlackInteractionPayload)
  }

  return { status: 200, body: 'ok' }
}

// ─── Action Handlers ────────────────────────────────────────

async function handleBlockActions(
  payload: SlackInteractionPayload
): Promise<WebhookResult> {
  if (!payload.actions?.length) {
    return { status: 200, body: 'ok' }
  }

  const action = payload.actions[0]

  // Gate approval/rejection
  if (action.action_id === 'gate_approve' || action.action_id === 'gate_reject') {
    return handleGateAction(payload, action)
  }

  return { status: 200, body: 'ok' }
}

async function handleGateAction(
  payload: SlackInteractionPayload,
  action: { action_id: string; value: string }
): Promise<WebhookResult> {
  try {
    const gateData = JSON.parse(action.value) as {
      opportunityId: string
      gateNumber: number
      gateName: string
    }

    const gateAction: GateApprovalAction = {
      opportunityId: gateData.opportunityId,
      gateNumber: gateData.gateNumber,
      gateName: gateData.gateName,
      decision: action.action_id === 'gate_approve' ? 'approved' : 'rejected',
      decidedBy: payload.user.name,
      decidedByEmail: '', // Looked up by Slack user ID in processGateDecision
      slackMessageTs: payload.message.ts,
    }

    // Look up user email from Slack
    const email = await lookupSlackUserEmail(payload.user.id)
    if (email) {
      gateAction.decidedByEmail = email
    } else {
      return {
        status: 200,
        body: {
          response_type: 'ephemeral',
          text: ':warning: Could not verify your MissionPulse account. Please approve via the web app.',
        },
      }
    }

    const result = await processGateDecision(gateAction)

    if (!result.success) {
      return {
        status: 200,
        body: {
          response_type: 'ephemeral',
          text: `:x: ${result.error}`,
        },
      }
    }

    const emoji = gateAction.decision === 'approved' ? ':white_check_mark:' : ':x:'
    const label = gateAction.decision === 'approved' ? 'Approved' : 'Rejected'

    return {
      status: 200,
      body: {
        response_type: 'in_channel',
        replace_original: true,
        text: `${emoji} *${gateData.gateName}* — ${label} by ${payload.user.name}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${emoji} *${gateData.gateName}* — *${label.toUpperCase()}*\nDecided by ${payload.user.name}`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `_Decision recorded in MissionPulse at ${new Date().toLocaleString()}_`,
              },
            ],
          },
        ],
      },
    }
  } catch (err) {
    return {
      status: 200,
      body: {
        response_type: 'ephemeral',
        text: `:x: Error processing gate decision: ${err instanceof Error ? err.message : 'Unknown'}`,
      },
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────

async function lookupSlackUserEmail(slackUserId: string): Promise<string | null> {
  const { token } = await getBotTokenDirect()
  if (!token) return null

  try {
    const res = await fetch(
      `https://slack.com/api/users.info?user=${slackUserId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      }
    )

    const data = (await res.json()) as {
      ok: boolean
      user?: { profile?: { email?: string } }
    }

    return data.user?.profile?.email ?? null
  } catch {
    return null
  }
}

/**
 * Get bot token without user context (for webhook processing).
 * Uses the first active Slack integration found.
 */
async function getBotTokenDirect(): Promise<{
  token: string | null
}> {
  // Dynamic import to avoid circular dependency issues
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials_encrypted')
    .eq('provider', 'slack')
    .eq('status', 'active')
    .limit(1)
    .single()

  if (!integration?.credentials_encrypted) return { token: null }

  const creds = JSON.parse(integration.credentials_encrypted) as {
    bot_token: string
  }

  return { token: creds.bot_token }
}
