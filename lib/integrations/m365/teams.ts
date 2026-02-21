/**
 * Microsoft Teams Integration
 *
 * Teams channel sync with War Room activity feed.
 * Meeting scheduling for color team reviews.
 * Adaptive cards for gate approvals.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { refreshM365Token } from './auth'

// ─── Types ───────────────────────────────────────────────────

interface TeamsChannel {
  id: string
  displayName: string
  description: string | null
  webUrl: string
}

interface TeamsMeeting {
  id: string
  subject: string
  startDateTime: string
  endDateTime: string
  joinUrl: string
  organizer: string
}

// ─── Token Helper ────────────────────────────────────────────

const GRAPH_URL = 'https://graph.microsoft.com/v1.0'

async function getTeamsToken(companyId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: integration } = await supabase
    .from('integrations')
    .select('id, credentials_encrypted')
    .eq('provider', 'm365')
    .eq('company_id', companyId)
    .single()

  if (!integration?.credentials_encrypted) return null

  const creds = JSON.parse(integration.credentials_encrypted) as {
    access_token: string
    refresh_token: string
    expires_at: number
  }

  if (Date.now() < creds.expires_at - 60000) {
    return creds.access_token
  }

  const newTokens = await refreshM365Token(creds.refresh_token)
  if (!newTokens) return null

  await supabase
    .from('integrations')
    .update({
      credentials_encrypted: JSON.stringify({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: Date.now() + newTokens.expires_in * 1000,
      }),
    })
    .eq('id', integration.id)

  return newTokens.access_token
}

async function graphFetch(
  companyId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getTeamsToken(companyId)
  if (!token) throw new Error('M365 not connected')

  return fetch(`${GRAPH_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    },
  })
}

// ─── Channel Management ──────────────────────────────────────

/**
 * List Teams channels the user has access to.
 */
export async function listTeamsChannels(
  companyId: string,
  teamId: string
): Promise<TeamsChannel[]> {
  const response = await graphFetch(companyId, `/teams/${teamId}/channels`)
  if (!response.ok) return []

  const data = await response.json()
  return (data.value ?? []).map((ch: Record<string, unknown>) => ({
    id: ch.id as string,
    displayName: ch.displayName as string,
    description: (ch.description as string) ?? null,
    webUrl: (ch.webUrl as string) ?? '',
  }))
}

/**
 * Create a new Teams channel for an opportunity.
 */
export async function createOpportunityChannel(
  companyId: string,
  teamId: string,
  opportunityTitle: string
): Promise<TeamsChannel | null> {
  const response = await graphFetch(companyId, `/teams/${teamId}/channels`, {
    method: 'POST',
    body: JSON.stringify({
      displayName: `MP: ${opportunityTitle.slice(0, 45)}`,
      description: `MissionPulse opportunity channel for ${opportunityTitle}`,
      membershipType: 'standard',
    }),
  })

  if (!response.ok) return null

  const ch = await response.json()
  return {
    id: ch.id,
    displayName: ch.displayName,
    description: ch.description ?? null,
    webUrl: ch.webUrl ?? '',
  }
}

/**
 * Send a message to a Teams channel.
 */
export async function sendChannelMessage(
  companyId: string,
  teamId: string,
  channelId: string,
  content: string
): Promise<boolean> {
  const response = await graphFetch(
    companyId,
    `/teams/${teamId}/channels/${channelId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        body: { contentType: 'html', content },
      }),
    }
  )

  return response.ok
}

// ─── Meeting Scheduling ──────────────────────────────────────

/**
 * Create a Teams meeting for a gate review or color team session.
 */
export async function createTeamsMeeting(
  companyId: string,
  params: {
    subject: string
    startTime: string
    endTime: string
    attendeeEmails: string[]
    body: string
  }
): Promise<TeamsMeeting | null> {
  const response = await graphFetch(companyId, '/me/onlineMeetings', {
    method: 'POST',
    body: JSON.stringify({
      subject: params.subject,
      startDateTime: params.startTime,
      endDateTime: params.endTime,
      participants: {
        attendees: params.attendeeEmails.map((email) => ({
          upn: email,
          role: 'attendee',
        })),
      },
    }),
  })

  if (!response.ok) return null

  const meeting = await response.json()

  // Also create a calendar event with the join link
  await graphFetch(companyId, '/me/events', {
    method: 'POST',
    body: JSON.stringify({
      subject: params.subject,
      start: { dateTime: params.startTime, timeZone: 'UTC' },
      end: { dateTime: params.endTime, timeZone: 'UTC' },
      body: {
        contentType: 'html',
        content: `${params.body}<br><br><a href="${meeting.joinWebUrl}">Join Teams Meeting</a>`,
      },
      attendees: params.attendeeEmails.map((email) => ({
        emailAddress: { address: email },
        type: 'required',
      })),
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
    }),
  })

  return {
    id: meeting.id,
    subject: params.subject,
    startDateTime: params.startTime,
    endDateTime: params.endTime,
    joinUrl: meeting.joinWebUrl ?? '',
    organizer: '',
  }
}

/**
 * Create a gate review meeting with structured agenda.
 */
export async function scheduleGateReview(
  companyId: string,
  opportunity: { id: string; title: string; phase: string; pwin: number },
  attendeeEmails: string[],
  dateTime: { start: string; end: string }
): Promise<TeamsMeeting | null> {
  const body = `
    <h2>Gate Review: ${opportunity.title}</h2>
    <table>
      <tr><td><strong>Phase:</strong></td><td>${opportunity.phase}</td></tr>
      <tr><td><strong>pWin:</strong></td><td>${opportunity.pwin}%</td></tr>
    </table>
    <h3>Agenda</h3>
    <ol>
      <li>Compliance status review</li>
      <li>Section progress walkthrough</li>
      <li>Risk assessment</li>
      <li>Go/No-Go decision</li>
    </ol>
    <p><em>Powered by MissionPulse</em></p>
  `

  return createTeamsMeeting(companyId, {
    subject: `[Gate Review] ${opportunity.title} — ${opportunity.phase}`,
    startTime: dateTime.start,
    endTime: dateTime.end,
    attendeeEmails,
    body,
  })
}

// ─── Adaptive Cards for Gate Approvals ───────────────────────

/**
 * Send a gate approval adaptive card to a Teams channel.
 */
export async function sendGateApprovalCard(
  companyId: string,
  teamId: string,
  channelId: string,
  opportunity: {
    id: string
    title: string
    phase: string
    pwin: number
    compliance: number
    teamCount: number
  }
): Promise<boolean> {
  const pwinColor = opportunity.pwin >= 60 ? 'good' : opportunity.pwin >= 30 ? 'warning' : 'attention'
  const complianceColor = opportunity.compliance >= 80 ? 'good' : opportunity.compliance >= 50 ? 'warning' : 'attention'

  const card = {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.5',
    body: [
      {
        type: 'TextBlock',
        text: 'Gate Approval Required',
        weight: 'bolder',
        size: 'large',
      },
      {
        type: 'TextBlock',
        text: opportunity.title,
        weight: 'bolder',
        size: 'medium',
        wrap: true,
      },
      {
        type: 'FactSet',
        facts: [
          { title: 'Phase', value: opportunity.phase },
          { title: 'pWin', value: `${opportunity.pwin}%` },
          { title: 'Compliance', value: `${opportunity.compliance}%` },
          { title: 'Team Size', value: `${opportunity.teamCount} members` },
        ],
      },
      {
        type: 'ColumnSet',
        columns: [
          {
            type: 'Column',
            width: 'stretch',
            items: [{ type: 'TextBlock', text: `pWin: ${opportunity.pwin}%`, color: pwinColor, weight: 'bolder' }],
          },
          {
            type: 'Column',
            width: 'stretch',
            items: [{ type: 'TextBlock', text: `Compliance: ${opportunity.compliance}%`, color: complianceColor, weight: 'bolder' }],
          },
        ],
      },
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: 'Approve',
        style: 'positive',
        data: { action: 'approve', opportunityId: opportunity.id },
      },
      {
        type: 'Action.Submit',
        title: 'Reject',
        style: 'destructive',
        data: { action: 'reject', opportunityId: opportunity.id },
      },
    ],
  }

  const response = await graphFetch(
    companyId,
    `/teams/${teamId}/channels/${channelId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        body: { contentType: 'html', content: '' },
        attachments: [
          {
            id: crypto.randomUUID(),
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: JSON.stringify(card),
          },
        ],
      }),
    }
  )

  return response.ok
}

// ─── Activity Feed Sync ──────────────────────────────────────

/**
 * Sync War Room activity to a linked Teams channel.
 */
export async function syncActivityToTeams(
  companyId: string,
  teamId: string,
  channelId: string,
  activity: {
    action: string
    userName: string
    description: string
    opportunityTitle: string
    timestamp: string
  }
): Promise<boolean> {
  const content = `
    <div style="border-left: 3px solid #00E5FA; padding-left: 10px; margin: 5px 0;">
      <strong>${activity.userName}</strong> — ${activity.action}<br>
      <span style="color: #666;">${activity.description}</span><br>
      <small style="color: #999;">${activity.opportunityTitle} | ${new Date(activity.timestamp).toLocaleString()}</small>
    </div>
  `

  return sendChannelMessage(companyId, teamId, channelId, content)
}

// ─── Channel Link Storage ────────────────────────────────────

/**
 * Link a Teams channel to an opportunity for activity sync.
 */
export async function linkTeamsChannel(
  companyId: string,
  opportunityId: string,
  teamId: string,
  channelId: string,
  channelName: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { data: opp } = await supabase
    .from('opportunities')
    .select('metadata')
    .eq('id', opportunityId)
    .single()

  const metadata = (opp?.metadata as Record<string, unknown>) ?? {}

  await supabase
    .from('opportunities')
    .update({
      metadata: JSON.parse(JSON.stringify({
        ...metadata,
        teams_channel: { teamId, channelId, channelName },
      })),
    })
    .eq('id', opportunityId)

  return { success: true }
}

/**
 * Get the linked Teams channel for an opportunity.
 */
export async function getLinkedTeamsChannel(
  opportunityId: string
): Promise<{ teamId: string; channelId: string; channelName: string } | null> {
  const supabase = await createClient()

  const { data: opp } = await supabase
    .from('opportunities')
    .select('metadata')
    .eq('id', opportunityId)
    .single()

  const metadata = (opp?.metadata as Record<string, unknown>) ?? {}
  const channel = metadata.teams_channel as {
    teamId: string
    channelId: string
    channelName: string
  } | undefined

  return channel ?? null
}
