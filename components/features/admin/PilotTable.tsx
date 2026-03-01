'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PilotInfo } from '@/lib/billing/pilot'
import { getActivePilots, extendPilot, convertPilot } from '@/lib/billing/pilot'
import { updateEngagementScore } from '@/lib/billing/engagement'

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function engagementColor(score: number): string {
  if (score >= 70) return 'text-green-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-red-400'
}

function statusBadge(status: PilotInfo['status']) {
  switch (status) {
    case 'pilot':
      return (
        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Active
        </span>
      )
    case 'expired':
      return (
        <span className="rounded bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-400">
          Expired
        </span>
      )
    case 'converted':
      return (
        <span className="rounded bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-400">
          Converted
        </span>
      )
  }
}

export function PilotTable() {
  const [pilots, setPilots] = useState<PilotInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadPilots = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getActivePilots()
      setPilots(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPilots()
  }, [loadPilots])

  const handleExtend = async (companyId: string) => {
    setActionLoading(companyId)
    const result = await extendPilot(companyId)
    if (!result.success) {
      alert(result.error ?? 'Failed to extend pilot')
    }
    await loadPilots()
    setActionLoading(null)
  }

  const handleConvert = async (companyId: string) => {
    setActionLoading(companyId)
    const result = await convertPilot(companyId)
    if (!result.success) {
      alert(result.error ?? 'Failed to convert pilot')
    }
    await loadPilots()
    setActionLoading(null)
  }

  const handleRefreshScore = async (companyId: string) => {
    setActionLoading(companyId)
    await updateEngagementScore(companyId)
    await loadPilots()
    setActionLoading(null)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded bg-card" />
        ))}
      </div>
    )
  }

  if (pilots.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No pilots to display.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pilots appear here when companies start a 30-day trial.
        </p>
      </div>
    )
  }

  // Sort by engagement score descending
  const sorted = [...pilots].sort((a, b) => b.engagementScore - a.engagementScore)

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-card">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Company
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Plan
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
              Days Left
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
              Engagement
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
              Token Usage
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
              Pilot Paid
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((pilot) => (
            <tr
              key={pilot.companyId}
              className="border-b border-border/50 bg-background/30 hover:bg-card/50"
            >
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">
                  {pilot.companyName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(pilot.startDate)} — {formatDate(pilot.endDate)}
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{pilot.planName}</td>
              <td className="px-4 py-3 text-center">{statusBadge(pilot.status)}</td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`font-mono font-medium ${
                    pilot.daysRemaining <= 5
                      ? 'text-red-400'
                      : pilot.daysRemaining <= 10
                        ? 'text-yellow-400'
                        : 'text-muted-foreground'
                  }`}
                >
                  {pilot.daysRemaining}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => handleRefreshScore(pilot.companyId)}
                  disabled={actionLoading === pilot.companyId}
                  className={`font-mono font-bold ${engagementColor(pilot.engagementScore)} hover:underline`}
                  title="Click to refresh score"
                >
                  {pilot.engagementScore}
                </button>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-border">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${Math.min(100, pilot.tokenUsagePercent)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{pilot.tokenUsagePercent}%</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {formatCurrency(pilot.amountPaidCents)}
              </td>
              <td className="px-4 py-3 text-right">
                {pilot.status === 'pilot' && (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleExtend(pilot.companyId)}
                      disabled={actionLoading === pilot.companyId}
                      className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80 disabled:opacity-50"
                    >
                      +7 Days
                    </button>
                    <button
                      onClick={() => handleConvert(pilot.companyId)}
                      disabled={actionLoading === pilot.companyId}
                      className="rounded bg-green-900/30 px-2 py-1 text-xs text-green-400 hover:bg-green-900/50 disabled:opacity-50"
                    >
                      Convert
                    </button>
                  </div>
                )}
                {pilot.status === 'expired' && !pilot.converted && (
                  <button
                    onClick={() => handleConvert(pilot.companyId)}
                    disabled={actionLoading === pilot.companyId}
                    className="rounded bg-green-900/30 px-2 py-1 text-xs text-green-400 hover:bg-green-900/50 disabled:opacity-50"
                  >
                    Convert
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
