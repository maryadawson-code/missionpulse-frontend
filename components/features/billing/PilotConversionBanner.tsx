// filepath: components/features/billing/PilotConversionBanner.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PilotStatus } from '@/lib/billing/pilot-conversion'

interface PilotConversionBannerProps {
  status: PilotStatus
}

export function PilotConversionBanner({ status }: PilotConversionBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // Show expiration message for expired pilots
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
            <Link
              href="/settings/billing"
              className="rounded-md bg-[#00E5FA] px-3 py-1.5 text-xs font-medium text-[#00050F] transition-colors hover:bg-[#00E5FA]/90"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show conversion banner when ≤5 days remaining
  if (!status.showBanner) return null

  return (
    <div className="mb-4 rounded-lg border border-[#00E5FA]/30 bg-gradient-to-r from-[#0F172A] to-[#00050F] px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00E5FA]/20">
            <svg className="h-4 w-4 text-[#00E5FA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-100">
              Your pilot ends in{' '}
              <span className="text-[#00E5FA]">{status.daysRemaining} day{status.daysRemaining !== 1 ? 's' : ''}</span>
            </p>
            <p className="text-xs text-gray-400">
              See what you&apos;ve accomplished and upgrade to keep going.
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
          <Link
            href="/settings/billing"
            className="rounded-md bg-[#00E5FA] px-3 py-1.5 text-xs font-medium text-[#00050F] transition-colors hover:bg-[#00E5FA]/90"
          >
            Upgrade Now
          </Link>
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
