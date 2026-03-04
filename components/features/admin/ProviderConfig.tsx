'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ProviderHealthStatus } from '@/lib/ai/providers/health'
import { getAllProviderHealth, resetProviderCircuit } from '@/lib/ai/providers/health'
import { getProviderStatus } from '@/lib/ai/router'
import type { ProviderId } from '@/lib/ai/providers/interface'
import type { ProviderCostSummary } from '@/lib/ai/providers/costs'
import { getProviderCostBreakdown } from '@/lib/ai/providers/costs'
import { updateRoutingConfig } from '@/lib/ai/providers/routing-config'

interface ProviderInfo {
  id: ProviderId
  name: string
  configured: boolean
  fedRamp: boolean
  isPrimary: boolean
  isFallback: boolean
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value)
}

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

export function ProviderConfig() {
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [health, setHealth] = useState<ProviderHealthStatus[]>([])
  const [costs, setCosts] = useState<ProviderCostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<ProviderId | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedPrimary, setSelectedPrimary] = useState<ProviderId>('asksage')
  const [selectedFallback, setSelectedFallback] = useState<ProviderId>('anthropic')
  const [configMessage, setConfigMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [providerData, healthData, costData] = await Promise.all([
        getProviderStatus(),
        getAllProviderHealth(),
        getProviderCostBreakdown(),
      ])
      setProviders(providerData)
      setHealth(healthData)
      setCosts(costData)
      const primary = providerData.find((p) => p.isPrimary)
      const fallback = providerData.find((p) => p.isFallback)
      if (primary) setSelectedPrimary(primary.id)
      if (fallback) setSelectedFallback(fallback.id)
    } catch {
      // Graceful degradation
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const testConnection = async (id: ProviderId) => {
    setTesting(id)
    try {
      await resetProviderCircuit(id)
      const healthData = await getAllProviderHealth()
      setHealth(healthData)
    } finally {
      setTesting(null)
    }
  }

  const saveRoutingConfig = async () => {
    setSaving(true)
    setConfigMessage(null)
    try {
      const result = await updateRoutingConfig(selectedPrimary, selectedFallback)
      if (result.success) {
        setConfigMessage({ type: 'success', text: 'Routing configuration saved.' })
        await loadData()
      } else {
        setConfigMessage({ type: 'error', text: result.error ?? 'Failed to save.' })
      }
    } catch {
      setConfigMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setSaving(false)
    }
  }

  const getHealth = (id: ProviderId): ProviderHealthStatus | undefined =>
    health.find((h) => h.id === id)

  const getCost = (id: string): ProviderCostSummary | undefined =>
    costs.find((c) => c.provider === id)

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-card" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Provider Cards */}
      <div className="space-y-4">
        {providers.map((p) => {
          const h = getHealth(p.id)
          const c = getCost(p.id)

          return (
            <div
              key={p.id}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">
                      {p.name}
                    </h3>
                    {p.fedRamp && (
                      <span className="rounded bg-green-900/30 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                        FedRAMP
                      </span>
                    )}
                    {p.isPrimary && (
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Primary
                      </span>
                    )}
                    {p.isFallback && (
                      <span className="rounded bg-yellow-900/30 px-2 py-0.5 text-[10px] font-medium text-yellow-600 dark:text-yellow-400">
                        Fallback
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Provider ID: <code className="text-muted-foreground">{p.id}</code>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status indicator */}
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      !p.configured
                        ? 'bg-muted'
                        : h?.status === 'healthy'
                          ? 'bg-green-500'
                          : h?.status === 'degraded'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm text-muted-foreground">
                    {!p.configured
                      ? 'Not configured'
                      : h?.status === 'healthy'
                        ? 'Healthy'
                        : h?.status === 'degraded'
                          ? 'Degraded'
                          : 'Down'}
                  </span>
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Latency</p>
                  <p className="text-sm font-medium text-foreground">
                    {h?.latencyMs ? `${h.latencyMs}ms` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Failures</p>
                  <p className="text-sm font-medium text-foreground">
                    {h?.consecutiveFailures ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This Month</p>
                  <p className="text-sm font-medium text-foreground">
                    {c ? formatCurrency(c.totalCost) : '$0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tokens Used</p>
                  <p className="text-sm font-medium text-foreground">
                    {c ? formatTokens(c.totalTokens) : '0'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {p.configured && (
                <div className="mt-4 border-t border-border pt-3">
                  <button
                    onClick={() => testConnection(p.id)}
                    disabled={testing === p.id}
                    className="rounded bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 disabled:opacity-50"
                  >
                    {testing === p.id ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
              )}

              {/* Configuration hint */}
              {!p.configured && (
                <div className="mt-4 rounded bg-yellow-50 dark:bg-yellow-900/10 px-3 py-2">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400/80">
                    Set{' '}
                    <code className="text-yellow-600 dark:text-yellow-400">
                      {p.id === 'asksage'
                        ? 'ASKSAGE_API_KEY'
                        : p.id === 'anthropic'
                          ? 'ANTHROPIC_API_KEY'
                          : 'OPENAI_API_KEY'}
                    </code>{' '}
                    in .env.local to enable this provider.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Routing Config */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">
          Routing Configuration
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Set primary and fallback providers for UNCLASSIFIED requests.
        </p>
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between rounded bg-background/50 px-3 py-2">
            <label htmlFor="primary-provider" className="text-xs text-muted-foreground">
              Primary Provider
            </label>
            <select
              id="primary-provider"
              value={selectedPrimary}
              onChange={(e) => setSelectedPrimary(e.target.value as ProviderId)}
              className="rounded border border-border bg-card px-2 py-1 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.configured}>
                  {p.name}{!p.configured ? ' (not configured)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between rounded bg-background/50 px-3 py-2">
            <label htmlFor="fallback-provider" className="text-xs text-muted-foreground">
              Fallback Provider
            </label>
            <select
              id="fallback-provider"
              value={selectedFallback}
              onChange={(e) => setSelectedFallback(e.target.value as ProviderId)}
              className="rounded border border-border bg-card px-2 py-1 text-xs text-yellow-600 dark:text-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.configured || p.id === selectedPrimary}>
                  {p.name}{!p.configured ? ' (not configured)' : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={saveRoutingConfig}
            disabled={saving}
            className="rounded bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
          {configMessage && (
            <p
              className={`text-xs ${configMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {configMessage.text}
            </p>
          )}
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">
          CUI-classified requests always route to FedRAMP providers regardless of
          these settings.
        </p>
      </div>
    </div>
  )
}
