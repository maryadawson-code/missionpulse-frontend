/**
 * Slack Channel Notifications
 *
 * Push notifications to Slack channels for:
 * - Gate approvals needed
 * - Deadline warnings (48hr/24hr)
 * - HITL queue items
 * - pWin changes >10%
 * - New team assignments
 *
 * Uses Slack Block Kit for rich message formatting.
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ───────────────────────────────────────────────────

export type NotificationType =
  | 'gate_approval'
  | 'deadline_warning'
  | 'hitl_pending'
  | 'pwin_change'
  | 'assignment'

interface SlackChannel {
  id: string
  name: string
}

interface NotificationPayload {
  type: NotificationType
  opportunityId: string
  opportunityTitle: string
  channelId: string
  data: Record<string, unknown>
}

// ─── Send Notification ──────────────────────────────────────

/**
 * Send a notification to a Slack channel.
 */
export async function sendSlackNotification(
  payload: NotificationPayload
): Promise<{ success: boolean; messageTs?: string; error?: string }> {
  const { token, error } = await getBotToken()
  if (!token) return { success: false, error: error ?? 'Not connected' }

  const blocks = buildNotificationBlocks(payload)
  const text = buildFallbackText(payload)

  try {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: payload.channelId,
        text,
        blocks,
        unfurl_links: false,
      }),
      signal: AbortSignal.timeout(10000),
    })

    const data = (await res.json()) as {
      ok: boolean
      ts?: string
      error?: string
    }

    if (!data.ok) {
      return { success: false, error: `Slack API: ${data.error}` }
    }

    return { success: true, messageTs: data.ts }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed',
    }
  }
}

// ─── Convenience Methods ────────────────────────────────────

/**
 * Send gate approval notification with Approve/Reject buttons.
 */
export async function notifyGateApproval(
  channelId: string,
  opportunityId: string,
  opportunityTitle: string,
  gateName: string,
  pwin: number,
  compliancePercent: number
): Promise<{ success: boolean; error?: string }> {
  return sendSlackNotification({
    type: 'gate_approval',
    opportunityId,
    opportunityTitle,
    channelId,
    data: { gateName, pwin, compliancePercent },
  })
}

/**
 * Send deadline warning (48hr or 24hr).
 */
export async function notifyDeadlineWarning(
  channelId: string,
  opportunityId: string,
  opportunityTitle: string,
  deadlineDate: string,
  hoursRemaining: number
): Promise<{ success: boolean; error?: string }> {
  return sendSlackNotification({
    type: 'deadline_warning',
    opportunityId,
    opportunityTitle,
    channelId,
    data: { deadlineDate, hoursRemaining },
  })
}

/**
 * Send HITL pending notification.
 */
export async function notifyHitlPending(
  channelId: string,
  opportunityId: string,
  opportunityTitle: string,
  taskDescription: string,
  agentName: string
): Promise<{ success: boolean; error?: string }> {
  return sendSlackNotification({
    type: 'hitl_pending',
    opportunityId,
    opportunityTitle,
    channelId,
    data: { taskDescription, agentName },
  })
}

/**
 * Send pWin change notification (>10% change).
 */
export async function notifyPwinChange(
  channelId: string,
  opportunityId: string,
  opportunityTitle: string,
  oldPwin: number,
  newPwin: number
): Promise<{ success: boolean; error?: string }> {
  return sendSlackNotification({
    type: 'pwin_change',
    opportunityId,
    opportunityTitle,
    channelId,
    data: { oldPwin, newPwin },
  })
}

/**
 * Send team assignment notification.
 */
export async function notifyAssignment(
  channelId: string,
  opportunityId: string,
  opportunityTitle: string,
  assigneeName: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  return sendSlackNotification({
    type: 'assignment',
    opportunityId,
    opportunityTitle,
    channelId,
    data: { assigneeName, role },
  })
}

// ─── Channel Management ─────────────────────────────────────

/**
 * List available Slack channels.
 */
export async function listSlackChannels(): Promise<{
  channels: SlackChannel[]
  error?: string
}> {
  const { token, error } = await getBotToken()
  if (!token) return { channels: [], error: error ?? 'Not connected' }

  try {
    const res = await fetch(
      'https://slack.com/api/conversations.list?types=public_channel&limit=200&exclude_archived=true',
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    const data = (await res.json()) as {
      ok: boolean
      channels: Array<{ id: string; name: string }>
      error?: string
    }

    if (!data.ok) return { channels: [], error: data.error }

    return {
      channels: data.channels.map((c) => ({ id: c.id, name: c.name })),
    }
  } catch (err) {
    return {
      channels: [],
      error: err instanceof Error ? err.message : 'Failed',
    }
  }
}

/**
 * Create a Slack channel for an opportunity.
 */
export async function createOpportunityChannel(
  opportunityTitle: string
): Promise<{ channelId: string | null; error?: string }> {
  const { token, error } = await getBotToken()
  if (!token) return { channelId: null, error: error ?? 'Not connected' }

  // Slack channel name constraints: lowercase, no spaces, max 80 chars
  const channelName = `mp-${opportunityTitle
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 70)}`

  try {
    const res = await fetch('https://slack.com/api/conversations.create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: channelName,
        is_private: false,
      }),
      signal: AbortSignal.timeout(10000),
    })

    const data = (await res.json()) as {
      ok: boolean
      channel?: { id: string }
      error?: string
    }

    if (!data.ok) {
      // Channel might already exist
      if (data.error === 'name_taken') {
        return { channelId: null, error: `Channel #${channelName} already exists` }
      }
      return { channelId: null, error: data.error }
    }

    return { channelId: data.channel?.id ?? null }
  } catch (err) {
    return {
      channelId: null,
      error: err instanceof Error ? err.message : 'Failed',
    }
  }
}

/**
 * Link a Slack channel to an opportunity in integration config.
 */
export async function linkChannelToOpportunity(
  opportunityId: string,
  channelId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { success: false, error: 'No company' }

  const { data: integration } = await supabase
    .from('integrations')
    .select('config')
    .eq('provider', 'slack')
    .eq('company_id', profile.company_id)
    .single()

  const config = (integration?.config as Record<string, unknown>) ?? {}
  const mappings = (config.channel_mappings as Record<string, string>) ?? {}

  const { error } = await supabase
    .from('integrations')
    .update({
      config: JSON.parse(JSON.stringify({
        ...config,
        channel_mappings: { ...mappings, [opportunityId]: channelId },
      })),
    })
    .eq('provider', 'slack')
    .eq('company_id', profile.company_id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── Block Kit Builders ─────────────────────────────────────

function buildNotificationBlocks(payload: NotificationPayload): unknown[] {
  const link = `https://missionpulse.ai/pipeline/${payload.opportunityId}`

  switch (payload.type) {
    case 'gate_approval':
      return [
        {
          type: 'header',
          text: { type: 'plain_text', text: ':rotating_light: Gate Approval Required' },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${payload.opportunityTitle}*\nGate: *${payload.data.gateName}*`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `:dart: *pWin:* ${payload.data.pwin}%` },
            { type: 'mrkdwn', text: `:shield: *Compliance:* ${payload.data.compliancePercent}%` },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Approve' },
              style: 'primary',
              action_id: `gate_approve_${payload.opportunityId}`,
              value: payload.opportunityId,
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Reject' },
              style: 'danger',
              action_id: `gate_reject_${payload.opportunityId}`,
              value: payload.opportunityId,
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Details' },
              url: link,
              action_id: 'view_details',
            },
          ],
        },
      ]

    case 'deadline_warning': {
      const emoji = (payload.data.hoursRemaining as number) <= 24 ? ':red_circle:' : ':warning:'
      return [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *Deadline Warning — ${payload.data.hoursRemaining}hr*\n<${link}|${payload.opportunityTitle}>\nDue: ${payload.data.deadlineDate}`,
          },
        },
      ]
    }

    case 'hitl_pending':
      return [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:brain: *Human Review Required*\n<${link}|${payload.opportunityTitle}>\nAgent: *${payload.data.agentName}*\nTask: ${payload.data.taskDescription}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Review Now' },
              style: 'primary',
              url: link,
              action_id: 'review_hitl',
            },
          ],
        },
      ]

    case 'pwin_change': {
      const old = payload.data.oldPwin as number
      const current = payload.data.newPwin as number
      const direction = current > old ? ':chart_with_upwards_trend:' : ':chart_with_downwards_trend:'
      return [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${direction} *pWin Change*\n<${link}|${payload.opportunityTitle}>\n${old}% → *${current}%* (${current > old ? '+' : ''}${current - old}%)`,
          },
        },
      ]
    }

    case 'assignment':
      return [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:bust_in_silhouette: *New Assignment*\n<${link}|${payload.opportunityTitle}>\n*${payload.data.assigneeName}* assigned as ${payload.data.role}`,
          },
        },
      ]

    default:
      return []
  }
}

function buildFallbackText(payload: NotificationPayload): string {
  const labels: Record<NotificationType, string> = {
    gate_approval: 'Gate Approval Required',
    deadline_warning: 'Deadline Warning',
    hitl_pending: 'Human Review Required',
    pwin_change: 'pWin Change',
    assignment: 'New Team Assignment',
  }
  return `[MissionPulse] ${labels[payload.type]}: ${payload.opportunityTitle}`
}

// ─── Helpers ────────────────────────────────────────────────

async function getBotToken(): Promise<{
  token: string | null
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { token: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { token: null, error: 'No company' }

  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials_encrypted')
    .eq('provider', 'slack')
    .eq('company_id', profile.company_id)
    .single()

  if (!integration?.credentials_encrypted) {
    return { token: null, error: 'Slack not connected' }
  }

  const creds = JSON.parse(integration.credentials_encrypted) as {
    bot_token: string
  }

  return { token: creds.bot_token }
}
