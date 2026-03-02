/**
 * Unit tests for GET /api/health
 *
 * Verifies the public health-check endpoint returns the correct HTTP status,
 * headers, and body shape based on the aggregated health report.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock: @/lib/monitoring/health-checks
// ---------------------------------------------------------------------------
vi.mock('@/lib/monitoring/health-checks', () => ({
  runAllChecks: vi.fn(),
}))

import { GET } from '../health/route'
import { runAllChecks } from '@/lib/monitoring/health-checks'

const mockRunAllChecks = runAllChecks as ReturnType<typeof vi.fn>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function healthyReport() {
  return {
    status: 'healthy' as const,
    timestamp: '2026-02-28T12:00:00.000Z',
    version: '1.0.0',
    checks: {
      database: { status: 'healthy', latency_ms: 12, last_checked: '2026-02-28T12:00:00.000Z' },
      auth: { status: 'healthy', latency_ms: 8, last_checked: '2026-02-28T12:00:00.000Z' },
    },
  }
}

function unhealthyReport() {
  return {
    status: 'unhealthy' as const,
    timestamp: '2026-02-28T12:00:00.000Z',
    version: '1.0.0',
    checks: {
      database: { status: 'unhealthy', latency_ms: 0, last_checked: '2026-02-28T12:00:00.000Z', error: 'timeout' },
      auth: { status: 'healthy', latency_ms: 10, last_checked: '2026-02-28T12:00:00.000Z' },
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with status, timestamp, version, and checks when healthy', async () => {
    mockRunAllChecks.mockResolvedValue(healthyReport())

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('healthy')
    expect(body.timestamp).toBe('2026-02-28T12:00:00.000Z')
    expect(body.version).toBe('1.0.0')
    expect(body.checks).toBeDefined()
  })

  it('returns 503 with Retry-After: 30 when unhealthy', async () => {
    mockRunAllChecks.mockResolvedValue(unhealthyReport())

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(res.headers.get('Retry-After')).toBe('30')
    expect(body.status).toBe('unhealthy')
  })

  it('always includes Cache-Control: no-store', async () => {
    // Test with healthy report
    mockRunAllChecks.mockResolvedValue(healthyReport())
    const res1 = await GET()
    expect(res1.headers.get('Cache-Control')).toBe('no-store')

    // Test with unhealthy report
    mockRunAllChecks.mockResolvedValue(unhealthyReport())
    const res2 = await GET()
    expect(res2.headers.get('Cache-Control')).toBe('no-store')
  })

  it('response body contains status, timestamp, version, and checks', async () => {
    mockRunAllChecks.mockResolvedValue(healthyReport())

    const res = await GET()
    const body = await res.json()

    const keys = Object.keys(body)
    expect(keys).toEqual(['status', 'timestamp', 'version', 'checks'])
    expect(body.checks).toHaveProperty('database')
    expect(body.checks).toHaveProperty('auth')
  })
})
