/**
 * Token Budget Banner — Displays consumption threshold alerts.
 *
 * Color zones: green (<50%), yellow (50-75%), orange (75-90%), red (>90%)
 * Shows upgrade CTA when > 75% consumed.
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Info, XCircle, Zap } from 'lucide-react'

interface TokenBudgetBannerProps {
  threshold: 'normal' | 'info' | 'warning' | 'urgent' | 'soft_block' | 'hard_block'
  message: string | null
  upgradeCta: boolean
  usagePercent: number
  gracePeriod: boolean
}

const thresholdConfig = {
  normal: { icon: null, bgClass: '', textClass: '', show: false },
  info: {
    icon: Info,
    bgClass: 'bg-primary/10 border-primary/30',
    textClass: 'text-primary',
    show: true,
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-yellow-900/30 border-yellow-700/50',
    textClass: 'text-yellow-300',
    show: true,
  },
  urgent: {
    icon: AlertTriangle,
    bgClass: 'bg-orange-900/30 border-orange-700/50',
    textClass: 'text-orange-300',
    show: true,
  },
  soft_block: {
    icon: XCircle,
    bgClass: 'bg-red-900/30 border-red-700/50',
    textClass: 'text-red-300',
    show: true,
  },
  hard_block: {
    icon: XCircle,
    bgClass: 'bg-red-900/50 border-red-500/50',
    textClass: 'text-red-200',
    show: true,
  },
}

export function TokenBudgetBanner({
  threshold,
  message,
  upgradeCta,
  usagePercent,
  gracePeriod,
}: TokenBudgetBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  // Reset dismiss state when threshold escalates
  useEffect(() => {
    setDismissed(false)
  }, [threshold])

  const config = thresholdConfig[threshold]
  if (!config.show || dismissed || !message) return null

  const Icon = config.icon

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${config.bgClass}`}
      role="alert"
    >
      {Icon && <Icon className={`h-5 w-5 shrink-0 ${config.textClass}`} />}

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.textClass}`}>
          {message}
          {gracePeriod && (
            <span className="ml-2 text-xs opacity-75">
              (Grace period — 10K bonus tokens)
            </span>
          )}
        </p>

        {/* Usage bar */}
        <div className="mt-1.5 h-1.5 w-full max-w-xs rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${
              usagePercent >= 90
                ? 'bg-red-500'
                : usagePercent >= 75
                  ? 'bg-orange-500'
                  : usagePercent >= 50
                    ? 'bg-yellow-500'
                    : 'bg-primary'
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {usagePercent}% of monthly allocation used
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {upgradeCta && (
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Zap className="h-3 w-3" />
            Upgrade
          </Link>
        )}

        {/* Allow dismissing info/warning, not blocks */}
        {(threshold === 'info' || threshold === 'warning') && (
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
