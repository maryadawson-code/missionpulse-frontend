'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ServiceCheck {
  status: string
  latency?: number
  error?: string
}

interface HealthResponse {
  status: string
  timestamp: string
  version: string
  checks: Record<string, ServiceCheck>
}

function statusIcon(status: string) {
  switch (status) {
    case 'healthy':
    case 'configured':
      return <CheckCircle2 className="h-5 w-5 text-emerald-400" />
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-amber-400" />
    case 'unhealthy':
    case 'not_configured':
      return <XCircle className="h-5 w-5 text-red-400" />
    default:
      return <AlertTriangle className="h-5 w-5 text-muted-foreground" />
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'healthy':
    case 'configured':
      return 'border-emerald-500/30 bg-emerald-500/5'
    case 'degraded':
      return 'border-amber-500/30 bg-amber-500/5'
    case 'unhealthy':
    case 'not_configured':
      return 'border-red-500/30 bg-red-500/5'
    default:
      return 'border-border bg-card'
  }
}

function latencyColor(ms: number | undefined): string {
  if (ms === undefined) return 'text-muted-foreground'
  if (ms < 100) return 'text-emerald-400'
  if (ms < 500) return 'text-amber-400'
  return 'text-red-400'
}

const SERVICE_LABELS: Record<string, string> = {
  database: 'Database (Supabase)',
  auth: 'Authentication',
  ai_gateway: 'AI Gateway (AskSage)',
}

export function SystemHealthDashboard() {
  const [data, setData] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/health', { cache: 'no-store' })
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch health status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [fetchHealth])

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : data ? (
            statusIcon(data.status)
          ) : (
            <XCircle className="h-5 w-5 text-red-400" />
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">
              Overall: {data?.status?.toUpperCase() ?? (error ? 'ERROR' : 'CHECKING...')}
            </p>
            {data && (
              <p className="text-xs text-muted-foreground">
                v{data.version} — Last checked: {new Date(data.timestamp).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHealth}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Service Cards */}
      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Object.entries(data.checks).map(([key, check]) => (
            <div
              key={key}
              className={`rounded-xl border p-5 ${statusColor(check.status)}`}
            >
              <div className="flex items-center gap-2 mb-3">
                {statusIcon(check.status)}
                <h3 className="text-sm font-semibold text-foreground">
                  {SERVICE_LABELS[key] ?? key}
                </h3>
              </div>
              <dl className="space-y-2">
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-muted-foreground">Status</dt>
                  <dd className="text-xs font-medium text-foreground">
                    {check.status.toUpperCase()}
                  </dd>
                </div>
                {check.latency !== undefined && (
                  <div className="flex items-center justify-between">
                    <dt className="text-xs text-muted-foreground">Latency</dt>
                    <dd className={`text-xs font-mono font-medium ${latencyColor(check.latency)}`}>
                      {check.latency}ms
                    </dd>
                  </div>
                )}
                {check.error && (
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Error</dt>
                    <dd className="text-xs text-red-300 break-words">
                      {check.error}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        Auto-refreshes every 30 seconds. Data from /api/health endpoint.
      </p>
    </div>
  )
}
