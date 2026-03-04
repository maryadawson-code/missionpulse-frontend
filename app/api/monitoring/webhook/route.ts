import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/database.types'

const VALID_EVENT_TYPES = [
  'health_check', 'deploy', 'error_spike', 'uptime',
  'stripe_alert', 'ssl_check', 'dependency_alert',
] as const

const VALID_SEVERITIES = ['info', 'warning', 'critical'] as const

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-monitoring-secret')
  if (!process.env.MONITORING_WEBHOOK_SECRET || secret !== process.env.MONITORING_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { source, event_type, severity, title, detail } = body as {
    source?: string
    event_type?: string
    severity?: string
    title?: string
    detail?: Record<string, unknown>
  }

  if (!source || !event_type || !title) {
    return NextResponse.json({ error: 'Missing required fields: source, event_type, title' }, { status: 400 })
  }

  if (!VALID_EVENT_TYPES.includes(event_type as typeof VALID_EVENT_TYPES[number])) {
    return NextResponse.json({ error: `Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}` }, { status: 400 })
  }

  const sev = (severity && VALID_SEVERITIES.includes(severity as typeof VALID_SEVERITIES[number]))
    ? severity
    : 'info'

  const supabase = createClient<Database>(supabaseUrl, serviceKey)

  const { error } = await supabase.from('monitoring_events').insert({
    event_type: event_type as typeof VALID_EVENT_TYPES[number],
    severity: sev as typeof VALID_SEVERITIES[number],
    source: source as string,
    title: title as string,
    detail: (detail ?? {}) as unknown as Json,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to store event' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
