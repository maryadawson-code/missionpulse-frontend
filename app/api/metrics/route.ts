/**
 * Performance Metrics API — returns p50/p95/p99 for instrumented operations.
 * Protected: requires admin role via Supabase auth.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { getAllSummaries } from '@/lib/utils/perf-monitor'
import { getQueryStats } from '@/lib/utils/query-logger'
import { getCacheMetrics } from '@/lib/cache/semantic-cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'admin', 'canView')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [perfSummaries, queryStats, cacheMetrics] = await Promise.all([
    getAllSummaries(),
    getQueryStats(),
    getCacheMetrics(),
  ])

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    performance: perfSummaries,
    queries: queryStats,
    cache: cacheMetrics,
  })
}
