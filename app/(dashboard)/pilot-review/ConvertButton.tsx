'use client'

import { useTransition } from 'react'
import { startConversionCheckoutAction } from './actions'

export function ConvertButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => {
        startTransition(async () => {
          await startConversionCheckoutAction()
        })
      }}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg bg-[#00E5FA] px-6 py-2.5 text-sm font-medium text-[#00050F] transition-colors hover:bg-[#00E5FA]/90 disabled:opacity-50"
    >
      {isPending ? 'Redirecting to Checkout...' : 'Upgrade Now'}
    </button>
  )
}
