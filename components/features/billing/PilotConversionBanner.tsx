// filepath: components/features/billing/PilotConversionBanner.tsx
'use client'

import Link from 'next/link'
import type { PilotStatus } from '@/lib/billing/pilot-conversion'

interface Props {
  status: PilotStatus
}

export function PilotConversionBanner({ status }: Props) {
  const { daysRemaining, pilotCreditCents, showExpiredMessage } = status
  const isExpiring = daysRemaining <= 5 || showExpiredMessage
  const creditFormatted = (pilotCreditCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  })

  return (
    <div
      className={`border rounded-lg px-4 py-3 flex items-center justify-between gap-4 ${
        isExpiring
          ? 'border-red-500/40 bg-red-500/10'
          : 'border-[#00E5FA]/30 bg-[#00E5FA]/5'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`text-lg ${isExpiring ? 'text-red-400' : 'text-[#00E5FA]'}`}>
          {isExpiring ? '\u23F0' : '\uD83D\uDE80'}
        </div>
        <div>
          <div
            className={`font-semibold text-sm ${
              isExpiring ? 'text-red-300' : 'text-[#00E5FA]'
            }`}
          >
            {showExpiredMessage
              ? 'Your pilot has expired \u2014 convert now to keep access'
              : isExpiring
                ? `Your pilot ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
                : `${daysRemaining} days left in your pilot`}
          </div>
          <div className="text-gray-400 text-xs mt-0.5">
            Convert now and apply {creditFormatted} pilot credit toward Year 1
          </div>
        </div>
      </div>
      <Link
        href="/pilot-review"
        className={`px-4 py-1.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${
          isExpiring
            ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
            : 'bg-[#00E5FA] text-[#00050F] hover:bg-[#00E5FA]/90'
        }`}
      >
        {isExpiring ? 'Convert Before Expiry' : 'View Your ROI \u2192'}
      </Link>
    </div>
  )
}
