/**
 * Google Calendar Integration
 *
 * Push gate review dates, color team sessions, and submission
 * deadlines to Google Calendar.
 *
 * API: Google Calendar API v3
 */
'use server'

import { refreshGoogleToken } from './auth'

// ─── Config ──────────────────────────────────────────────────

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

// ─── Types ───────────────────────────────────────────────────

export interface CalendarEvent {
  id: string
  summary: string
  description: string | null
  start: string
  end: string
  htmlLink: string
  status: string
}

interface CreateEventParams {
  title: string
  description?: string
  startTime: string // ISO 8601
  endTime: string // ISO 8601
  attendees?: string[] // email addresses
  location?: string
  colorId?: string // Google Calendar color ID (1-11)
}

// ─── Event Management ────────────────────────────────────────

/**
 * Create a calendar event for a gate review.
 */
export async function createGateReviewEvent(
  companyId: string,
  params: {
    opportunityTitle: string
    gateName: string
    scheduledDate: string
    durationMinutes?: number
    attendeeEmails?: string[]
  }
): Promise<{ event: CalendarEvent | null; error?: string }> {
  const start = new Date(params.scheduledDate)
  const end = new Date(start.getTime() + (params.durationMinutes ?? 60) * 60 * 1000)

  return createCalendarEvent(companyId, {
    title: `[Gate Review] ${params.gateName} — ${params.opportunityTitle}`,
    description: buildGateReviewDescription(params.opportunityTitle, params.gateName),
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    attendees: params.attendeeEmails,
    colorId: '11', // Red — gate reviews are important
  })
}

/**
 * Create a calendar event for a color team session.
 */
export async function createColorTeamEvent(
  companyId: string,
  params: {
    opportunityTitle: string
    colorTeam: 'Pink' | 'Red' | 'Gold' | 'Blue'
    scheduledDate: string
    durationMinutes?: number
    attendeeEmails?: string[]
  }
): Promise<{ event: CalendarEvent | null; error?: string }> {
  const start = new Date(params.scheduledDate)
  const end = new Date(start.getTime() + (params.durationMinutes ?? 120) * 60 * 1000)

  const colorMap: Record<string, string> = {
    Pink: '4', // Flamingo
    Red: '11', // Tomato
    Gold: '5', // Banana
    Blue: '9', // Blueberry
  }

  return createCalendarEvent(companyId, {
    title: `[${params.colorTeam} Team] ${params.opportunityTitle}`,
    description: buildColorTeamDescription(params.opportunityTitle, params.colorTeam),
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    attendees: params.attendeeEmails,
    colorId: colorMap[params.colorTeam] ?? '1',
  })
}

/**
 * Create a calendar event for a submission deadline.
 */
export async function createDeadlineEvent(
  companyId: string,
  params: {
    opportunityTitle: string
    deadline: string
    agency?: string
  }
): Promise<{ event: CalendarEvent | null; error?: string }> {
  const deadlineDate = new Date(params.deadline)

  return createCalendarEvent(companyId, {
    title: `[DEADLINE] ${params.opportunityTitle}`,
    description: buildDeadlineDescription(params.opportunityTitle, params.agency),
    startTime: deadlineDate.toISOString(),
    endTime: new Date(deadlineDate.getTime() + 60 * 60 * 1000).toISOString(),
    colorId: '11', // Red for deadlines
  })
}

// ─── Core Event Creation ─────────────────────────────────────

/**
 * Create a Google Calendar event.
 */
async function createCalendarEvent(
  companyId: string,
  params: CreateEventParams
): Promise<{ event: CalendarEvent | null; error?: string }> {
  const token = await refreshGoogleToken(companyId)
  if (!token) return { event: null, error: 'Not connected to Google Calendar' }

  try {
    const body: Record<string, unknown> = {
      summary: params.title,
      description: params.description ?? '',
      start: {
        dateTime: params.startTime,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: params.endTime,
        timeZone: 'America/New_York',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 }, // 24 hours
          { method: 'popup', minutes: 30 },
        ],
      },
    }

    if (params.attendees && params.attendees.length > 0) {
      body.attendees = params.attendees.map((email) => ({ email }))
    }

    if (params.location) {
      body.location = params.location
    }

    if (params.colorId) {
      body.colorId = params.colorId
    }

    const res = await fetch(`${CALENDAR_API}/calendars/primary/events?sendUpdates=all`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const err = await res.text()
      return { event: null, error: `Calendar API error: ${err}` }
    }

    const data = (await res.json()) as {
      id: string
      summary: string
      description: string
      start: { dateTime: string }
      end: { dateTime: string }
      htmlLink: string
      status: string
    }

    return {
      event: {
        id: data.id,
        summary: data.summary,
        description: data.description,
        start: data.start.dateTime,
        end: data.end.dateTime,
        htmlLink: data.htmlLink,
        status: data.status,
      },
    }
  } catch (err) {
    return { event: null, error: err instanceof Error ? err.message : 'Failed' }
  }
}

/**
 * List upcoming MissionPulse events.
 */
export async function listUpcomingEvents(
  companyId: string,
  maxResults = 10
): Promise<{ events: CalendarEvent[]; error?: string }> {
  const token = await refreshGoogleToken(companyId)
  if (!token) return { events: [], error: 'Not connected' }

  try {
    const now = new Date().toISOString()
    const params = new URLSearchParams({
      timeMin: now,
      maxResults: maxResults.toString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      q: 'MissionPulse OR [Gate Review] OR [DEADLINE]',
    })

    const res = await fetch(`${CALENDAR_API}/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return { events: [], error: `API returned ${res.status}` }

    const data = (await res.json()) as {
      items: Array<{
        id: string
        summary: string
        description: string
        start: { dateTime: string; date?: string }
        end: { dateTime: string; date?: string }
        htmlLink: string
        status: string
      }>
    }

    const events: CalendarEvent[] = (data.items ?? []).map((item) => ({
      id: item.id,
      summary: item.summary,
      description: item.description,
      start: item.start.dateTime ?? item.start.date ?? '',
      end: item.end.dateTime ?? item.end.date ?? '',
      htmlLink: item.htmlLink,
      status: item.status,
    }))

    return { events }
  } catch (err) {
    return { events: [], error: err instanceof Error ? err.message : 'Failed' }
  }
}

// ─── Description Builders ────────────────────────────────────

function buildGateReviewDescription(oppTitle: string, gateName: string): string {
  return `<b>MissionPulse Gate Review</b>

<b>Opportunity:</b> ${oppTitle}
<b>Gate:</b> ${gateName}

<i>This event was created by MissionPulse. Open the War Room for details.</i>

<a href="https://missionpulse.io">Open MissionPulse</a>`
}

function buildColorTeamDescription(oppTitle: string, color: string): string {
  return `<b>MissionPulse ${color} Team Review</b>

<b>Opportunity:</b> ${oppTitle}
<b>Review Type:</b> ${color} Team

<i>Prepare your assigned volumes for review. This event was created by MissionPulse.</i>

<a href="https://missionpulse.io">Open MissionPulse</a>`
}

function buildDeadlineDescription(oppTitle: string, agency?: string): string {
  return `<b>MissionPulse Submission Deadline</b>

<b>Opportunity:</b> ${oppTitle}
${agency ? `<b>Agency:</b> ${agency}` : ''}

<b>⚠️ This is the final submission deadline.</b>

<a href="https://missionpulse.io">Open MissionPulse</a>`
}
