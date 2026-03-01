'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ProviderHealthStatus } from '@/lib/ai/providers/health'
import { getAllProviderHealth } from '@/lib/ai/providers/health'

function statusColor(status: ProviderHealthStatus['status']): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-500'
    case 'degraded':
      return 'bg-yellow-500'
    case 'down':
      return 'bg-red-500'
  }
}

function statusLabel(status: ProviderHealthStatus['status']): string {
  switch (status) {
    case 'healthy':
      return 'Healthy'
    case 'degraded':
      return 'Degraded'
    case 'down':
      return 'Down'
  }
}

export function ProviderHealthCard() {
  const [providers, setProviders] = useState<ProviderHealthStatus[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const health = await getAllProviderHealth()
      setProviders(health)
    } catch {
      // Health check failed silently
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          AI Provider Health
        </h3>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-xs text-primary hover:text-primary/80 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-2">
        {providers.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-md bg-background/50 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${statusColor(p.status)}`}
              />
              <span className="text-sm text-muted-foreground">{p.name}</span>
              {p.fedRamp && (
                <span className="rounded bg-green-900/30 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
                  FedRAMP
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {p.configured ? (
                <>
                  <span className="text-xs text-muted-foreground">
                    {p.latencyMs > 0 ? `${p.latencyMs}ms` : '—'}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      p.status === 'healthy'
                        ? 'text-green-400'
                        : p.status === 'degraded'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {statusLabel(p.status)}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Not configured</span>
              )}
            </div>
          </div>
        ))}

        {providers.length === 0 && !loading && (
          <p className="text-center text-xs text-muted-foreground">
            No providers registered
          </p>
        )}
      </div>
    </div>
  )
}
