import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {}

  // Database check
  const dbStart = Date.now()
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    checks.database = {
      status: error ? 'degraded' : 'healthy',
      latency: Date.now() - dbStart,
      ...(error && { error: error.message }),
    }
  } catch (e) {
    checks.database = {
      status: 'unhealthy',
      latency: Date.now() - dbStart,
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }

  // Auth check
  const authStart = Date.now()
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.getSession()
    checks.auth = {
      status: error ? 'degraded' : 'healthy',
      latency: Date.now() - authStart,
      ...(error && { error: error.message }),
    }
  } catch (e) {
    checks.auth = {
      status: 'unhealthy',
      latency: Date.now() - authStart,
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }

  // AI gateway check (just verify env var exists)
  checks.ai_gateway = {
    status: process.env.ASKSAGE_API_KEY ? 'configured' : 'not_configured',
  }

  const overall = Object.values(checks).every(
    (c) => c.status === 'healthy' || c.status === 'configured' || c.status === 'not_configured'
  )
    ? 'healthy'
    : 'degraded'

  return NextResponse.json(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '2.0.0',
      checks,
    },
    { status: overall === 'healthy' ? 200 : 503 }
  )
}
