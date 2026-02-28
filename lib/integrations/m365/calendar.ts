/**
 * Outlook Calendar Integration — Microsoft Graph API
 *
 * Push MissionPulse deadlines to Outlook calendar:
 * - Gate review dates
 * - Color team sessions
 * - Submission deadlines
 *
 * Push-only: MissionPulse → Outlook. No pull.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { refreshM365Token } from './auth'

// ─── Types ───────────────────────────────────────────────────

export type CalendarEventType = 'gate_review' | 'color_team' | 'submission_deadline'

export interface CalendarEvent {
  subject: string
  body: string
  start: string // ISO datetime
  end: string // ISO datetime
  type: CalendarEventType
  opportunityId: string
  opportunityTitle: string
  attendees: string[] // email addresses
  location?: string
}

interface GraphEvent {
  id: string
  subject: string
  webLink: string
}

// ─── Event Creation ─────────────────────────────────────────

/**
 * Create an Outlook calendar event for a MissionPulse deadline.
 */
export async function createCalendarEvent(
  event: CalendarEvent
): Promise<{ success: boolean; eventId?: string; webLink?: string; error?: string }> {
  const { token, error } = await getValidToken()
  if (!token) return { success: false, error: error ?? 'Not connected' }

  try {
    const graphEvent = buildGraphEvent(event)

    const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphEvent),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: `Calendar event creation failed: ${errText}` }
    }

    const created = (await res.json()) as GraphEvent
    return { success: true, eventId: created.id, webLink: created.webLink }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create event',
    }
  }
}

/**
 * Push gate review date to calendar.
 */
export async function pushGateReview(
  opportunityId: string,
  opportunityTitle: string,
  gateName: string,
  reviewDate: string,
  attendeeEmails: string[]
): Promise<{ success: boolean; error?: string }> {
  const start = new Date(reviewDate)
  const end = new Date(start.getTime() + 60 * 60 * 1000) // 1 hour

  return createCalendarEvent({
    subject: `[Gate Review] ${gateName} — ${opportunityTitle}`,
    body: buildEventBody('gate_review', opportunityTitle, opportunityId, gateName),
    start: start.toISOString(),
    end: end.toISOString(),
    type: 'gate_review',
    opportunityId,
    opportunityTitle,
    attendees: attendeeEmails,
  })
}

/**
 * Push color team session to calendar.
 */
export async function pushColorTeam(
  opportunityId: string,
  opportunityTitle: string,
  colorTeam: string,
  sessionDate: string,
  durationHours: number,
  attendeeEmails: string[]
): Promise<{ success: boolean; error?: string }> {
  const start = new Date(sessionDate)
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000)

  return createCalendarEvent({
    subject: `[${colorTeam}] ${opportunityTitle}`,
    body: buildEventBody('color_team', opportunityTitle, opportunityId, colorTeam),
    start: start.toISOString(),
    end: end.toISOString(),
    type: 'color_team',
    opportunityId,
    opportunityTitle,
    attendees: attendeeEmails,
  })
}

/**
 * Push submission deadline to calendar (all-day event).
 */
export async function pushSubmissionDeadline(
  opportunityId: string,
  opportunityTitle: string,
  deadlineDate: string,
  attendeeEmails: string[]
): Promise<{ success: boolean; error?: string }> {
  return createCalendarEvent({
    subject: `[DEADLINE] ${opportunityTitle} — Submission Due`,
    body: buildEventBody('submission_deadline', opportunityTitle, opportunityId),
    start: deadlineDate,
    end: deadlineDate,
    type: 'submission_deadline',
    opportunityId,
    opportunityTitle,
    attendees: attendeeEmails,
  })
}

// ─── Helpers ────────────────────────────────────────────────

function buildGraphEvent(event: CalendarEvent): Record<string, unknown> {
  const isAllDay = event.type === 'submission_deadline'

  const graphEvent: Record<string, unknown> = {
    subject: event.subject,
    body: {
      contentType: 'HTML',
      content: event.body,
    },
    start: isAllDay
      ? { dateTime: event.start, timeZone: 'UTC' }
      : { dateTime: event.start, timeZone: 'UTC' },
    end: isAllDay
      ? { dateTime: event.end, timeZone: 'UTC' }
      : { dateTime: event.end, timeZone: 'UTC' },
    isAllDay,
    categories: [getCategoryForType(event.type)],
    importance: event.type === 'submission_deadline' ? 'high' : 'normal',
  }

  if (event.attendees.length > 0) {
    graphEvent.attendees = event.attendees.map((email) => ({
      emailAddress: { address: email },
      type: 'required',
    }))
  }

  if (event.location) {
    graphEvent.location = { displayName: event.location }
  }

  return graphEvent
}

function buildEventBody(
  type: CalendarEventType,
  title: string,
  opportunityId: string,
  detail?: string
): string {
  const link = `https://missionpulse.ai/pipeline/${opportunityId}`
  const detailLine = detail ? `<p><strong>Detail:</strong> ${detail}</p>` : ''

  const typeLabels: Record<CalendarEventType, string> = {
    gate_review: 'Gate Review',
    color_team: 'Color Team Session',
    submission_deadline: 'Submission Deadline',
  }

  return `
    <div style="font-family: Inter, sans-serif; color: #E2E8F0;">
      <p><strong>Type:</strong> ${typeLabels[type]}</p>
      <p><strong>Opportunity:</strong> ${title}</p>
      ${detailLine}
      <p><a href="${link}" style="color: #00E5FA;">View in MissionPulse</a></p>
      <hr style="border-color: #1E293B;" />
      <p style="color: #64748B; font-size: 12px;">
        Created by MissionPulse — Shield &amp; Pulse
      </p>
    </div>
  `.trim()
}

function getCategoryForType(type: CalendarEventType): string {
  const categories: Record<CalendarEventType, string> = {
    gate_review: 'MissionPulse: Gate Review',
    color_team: 'MissionPulse: Color Team',
    submission_deadline: 'MissionPulse: Deadline',
  }
  return categories[type]
}

async function getValidToken(): Promise<{
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
    .select('id, credentials_encrypted')
    .eq('provider', 'm365')
    .eq('company_id', profile.company_id)
    .single()

  if (!integration?.credentials_encrypted) {
    return { token: null, error: 'M365 not connected' }
  }

  const creds = JSON.parse(integration.credentials_encrypted) as {
    access_token: string
    refresh_token: string
    expires_at: number
  }

  if (Date.now() < creds.expires_at - 60000) {
    return { token: creds.access_token }
  }

  const newTokens = await refreshM365Token(creds.refresh_token)
  if (!newTokens) return { token: null, error: 'Token refresh failed' }

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

  return { token: newTokens.access_token }
}
