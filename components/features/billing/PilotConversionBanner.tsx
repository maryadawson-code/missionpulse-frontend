'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { PilotStatus } from '@/lib/billing/pilot-conversion'
import { startConversionCheckoutAction } from '@/app/(dashboard)/pilot-review/actions'

interface PilotConversionBannerProps {
  status: PilotStatus
}

export function PilotConversionBanner({ status }: PilotConversionBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (dismissed || !status.isPilot && !status.showExpiredMessage) return null

  function handleUpgrade() {
    startTransition(async () => {
      await startConversionCheckoutAction()
    })
  }

  // Post-expiration: urgent amber banner
  if (status.showExpiredMessage) {
    return (
      <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
              <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-200">
                Your pilot has ended
              </p>
              <p className="text-xs text-amber-400/80">
                Your data is preserved for 30 days. Upgrade to keep full access.
                {status.pilotCreditCents > 0 && (
                  <span>
                    {' '}Your ${(status.pilotCreditCents / 100).toFixed(0)} pilot payment will be credited.
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/pilot-review"
              className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-amber-400"
            >
              View ROI Report
            </Link>
            <button
              onClick={handleUpgrade}
              disabled={isPending}
              className="rounded-md bg-[#00E5FA] px-3 py-1.5 text-xs font-medium text-[#00050F] transition-colors hover:bg-[#00E5FA]/90 disabled:opacity-50"
            >
              {isPending ? 'Redirecting...' : 'Upgrade Now'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Day 25-30: urgent countdown banner
  if (status.daysRemaining <= 5) {
    return (
      <div className="mb-4 rounded-lg border border-red-500/30 bg-gradient-to-r from-red-950/40 to-[#00050F] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
              <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-100">
                Your pilot ends in{' '}
                <span className="text-red-400 font-bold">{status.daysRemaining} day{status.daysRemaining !== 1 ? 's' : ''}</span>
              </p>
              <p className="text-xs text-gray-400">
                Upgrade now to keep your work and get your ${(status.pilotCreditCents / 100).toFixed(0)} pilot credit applied.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/pilot-review"
              className="rounded-md border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-800"
            >
              View ROI Report
            </Link>
            <button
              onClick={handleUpgrade}
              disabled={isPending}
              className="rounded-md bg-[#00E5FA] px-3 py-1.5 text-xs font-medium text-[#00050F] transition-colors hover:bg-[#00E5FA]/90 disabled:opacity-50"
            >
              {isPending ? 'Redirecting...' : 'Upgrade Now'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="ml-1 text-gray-600 hover:text-gray-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Day 1-24: subtle pilot indicator
  return (
    <div className="mb-4 rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
            <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs text-gray-400">
            <span className="font-medium text-emerald-400">Pilot Active</span>
            {' — '}{status.daysRemaining} day{status.daysRemaining !== 1 ? 's' : ''} remaining
          </p>
        </div>
        <Link
          href="/pilot-review"
          className="text-xs font-medium text-[#00E5FA] hover:text-[#00E5FA]/80 transition-colors"
        >
          View Progress →
        </Link>
      </div>
    </div>
  )
}
