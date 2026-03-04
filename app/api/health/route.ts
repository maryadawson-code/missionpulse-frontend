/**
 * Public Health Check
 * Returns status + timestamp + version + feature availability.
 * Used by uptime monitors and load balancers.
 */
import { NextResponse } from 'next/server'
import { runAllChecks } from '@/lib/monitoring/health-checks'
import { getFeatureStatus } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  const report = await runAllChecks()
  const features = getFeatureStatus()

  // 200 = healthy or degraded (app is serving), 503 = unhealthy (critical failure)
  const httpStatus = report.status === 'unhealthy' ? 503 : 200

  return NextResponse.json(
    {
      status: report.status,
      timestamp: report.timestamp,
      version: report.version,
      checks: report.checks,
      features,
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
