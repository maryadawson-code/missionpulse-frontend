'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ProviderHealthStatus } from '@/lib/ai/providers/health'
import { getAllProviderHealth, resetProviderCircuit } from '@/lib/ai/providers/health'
import { getProviderStatus } from '@/lib/ai/router'
import type { ProviderId } from '@/lib/ai/providers/interface'
import type { ProviderCostSummary } from '@/lib/ai/providers/costs'
import { getProviderCostBreakdown } from '@/lib/ai/providers/costs'

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

  const getHealth = (id: ProviderId): ProviderHealthStatus | undefined =>
    health.find((h) => h.id === id)

  const getCost = (id: string): ProviderCostSummary | undefined =>
    costs.find((c) => c.provider === id)

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-[#0F172A]" />
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
              className="rounded-lg border border-[#1E293B] bg-[#0F172A] p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-100">
                      {p.name}
                    </h3>
                    {p.fedRamp && (
                      <span className="rounded bg-green-900/30 px-2 py-0.5 text-[10px] font-medium text-green-400">
                        FedRAMP
                      </span>
                    )}
                    {p.isPrimary && (
                      <span className="rounded bg-[#00E5FA]/10 px-2 py-0.5 text-[10px] font-medium text-[#00E5FA]">
                        Primary
                      </span>
                    )}
                    {p.isFallback && (
                      <span className="rounded bg-yellow-900/30 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
                        Fallback
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Provider ID: <code className="text-gray-400">{p.id}</code>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status indicator */}
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      !p.configured
                        ? 'bg-gray-600'
                        : h?.status === 'healthy'
                          ? 'bg-green-500'
                          : h?.status === 'degraded'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm text-gray-400">
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
                  <p className="text-xs text-gray-500">Latency</p>
                  <p className="text-sm font-medium text-gray-200">
                    {h?.latencyMs ? `${h.latencyMs}ms` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Failures</p>
                  <p className="text-sm font-medium text-gray-200">
                    {h?.consecutiveFailures ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">This Month</p>
                  <p className="text-sm font-medium text-gray-200">
                    {c ? formatCurrency(c.totalCost) : '$0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tokens Used</p>
                  <p className="text-sm font-medium text-gray-200">
                    {c ? formatTokens(c.totalTokens) : '0'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {p.configured && (
                <div className="mt-4 border-t border-[#1E293B] pt-3">
                  <button
                    onClick={() => testConnection(p.id)}
                    disabled={testing === p.id}
                    className="rounded bg-[#1E293B] px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-[#1E293B]/80 disabled:opacity-50"
                  >
                    {testing === p.id ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
              )}

              {/* Configuration hint */}
              {!p.configured && (
                <div className="mt-4 rounded bg-yellow-900/10 px-3 py-2">
                  <p className="text-xs text-yellow-400/80">
                    Set{' '}
                    <code className="text-yellow-400">
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
      <div className="rounded-lg border border-[#1E293B] bg-[#0F172A] p-5">
        <h3 className="text-sm font-semibold text-gray-200">
          Routing Configuration
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Set via environment variables. Restart required after changes.
        </p>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between rounded bg-[#00050F]/50 px-3 py-2">
            <code className="text-xs text-gray-400">AI_PRIMARY_PROVIDER</code>
            <span className="text-xs font-medium text-[#00E5FA]">
              {providers.find((p) => p.isPrimary)?.id ?? 'asksage'}
            </span>
          </div>
          <div className="flex items-center justify-between rounded bg-[#00050F]/50 px-3 py-2">
            <code className="text-xs text-gray-400">AI_FALLBACK_PROVIDER</code>
            <span className="text-xs font-medium text-yellow-400">
              {providers.find((p) => p.isFallback)?.id ?? 'anthropic'}
            </span>
          </div>
        </div>
        <p className="mt-3 text-[10px] text-gray-600">
          CUI-classified requests always route to FedRAMP providers regardless of
          these settings.
        </p>
      </div>
    </div>
  )
}
