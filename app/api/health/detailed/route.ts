/**
 * Detailed Health Check — Admin Only
 * Returns full subsystem report with latency and error details.
 * RBAC: requires admin canView permission (same as /api/metrics).
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { runAllChecks } from '@/lib/monitoring/health-checks'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Auth + RBAC guard
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

  const report = await runAllChecks()

  return NextResponse.json(report, {
    status: report.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store',
      ...(report.status !== 'healthy' && { 'Retry-After': '30' }),
    },
  })
}
