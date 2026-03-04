/**
 * Sentinel Notification Dispatcher
 * Routes monitoring alerts to appropriate channels based on severity.
 */
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/database.types'

type Severity = 'info' | 'warning' | 'critical'
type EventType = 'health_check' | 'deploy' | 'error_spike' | 'uptime' | 'stripe_alert' | 'ssl_check' | 'dependency_alert'

interface MonitoringEvent {
  event_type: EventType
  severity: Severity
  source: string
  title: string
  detail?: Record<string, unknown>
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient<Database>(url, key)
}

/**
 * Store an event in the monitoring_events table (all severities).
 */
async function logToDatabase(event: MonitoringEvent): Promise<boolean> {
  const supabase = getServiceClient()
  if (!supabase) return false

  const { error } = await supabase.from('monitoring_events').insert({
    event_type: event.event_type,
    severity: event.severity,
    source: event.source,
    title: event.title,
    detail: (event.detail ?? {}) as unknown as Json,
  })

  return !error
}

/**
 * Create a GitHub issue for critical/warning events.
 * Requires GITHUB_TOKEN env var.
 */
async function createGitHubIssue(event: MonitoringEvent): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return false

  const repo = 'maryadawson-code/missionpulse-frontend'

  // Check for existing open issue with same title
  const searchResp = await fetch(
    `https://api.github.com/repos/${repo}/issues?labels=sentinel-alert&state=open&per_page=30`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } }
  )

  if (searchResp.ok) {
    const issues = await searchResp.json() as Array<{ title: string }>
    if (issues.some((i) => i.title === event.title)) {
      return true // Already exists
    }
  }

  const labels = ['sentinel-alert']
  if (event.severity === 'critical') labels.push('critical')

  const body = [
    `## ${event.title}`,
    '',
    `**Severity:** ${event.severity}`,
    `**Source:** ${event.source}`,
    `**Time:** ${new Date().toISOString()}`,
    '',
    '### Details',
    '```json',
    JSON.stringify(event.detail ?? {}, null, 2),
    '```',
  ].join('\n')

  const resp = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: event.title, body, labels }),
  })

  return resp.ok
}

/**
 * Dispatch a monitoring event to all appropriate channels.
 */
export async function notify(event: MonitoringEvent): Promise<{ logged: boolean; github: boolean }> {
  const logged = await logToDatabase(event)

  let github = false
  if (event.severity === 'critical' || event.severity === 'warning') {
    github = await createGitHubIssue(event)
  }

  return { logged, github }
}
