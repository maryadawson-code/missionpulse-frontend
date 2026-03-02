/**
 * Public Health Check
 * Returns only status + timestamp + version (no subsystem details).
 * Used by uptime monitors and load balancers.
 */
import { NextResponse } from 'next/server'
import { runAllChecks } from '@/lib/monitoring/health-checks'

export const dynamic = 'force-dynamic'

export async function GET() {
  const report = await runAllChecks()

  // 200 = healthy or degraded (app is serving), 503 = unhealthy (critical failure)
  const httpStatus = report.status === 'unhealthy' ? 503 : 200

  return NextResponse.json(
    {
      status: report.status,
      timestamp: report.timestamp,
      version: report.version,
      checks: report.checks,
    },
    {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store',
        ...(httpStatus === 503 && { 'Retry-After': '30' }),
      },
    }
  )
}
