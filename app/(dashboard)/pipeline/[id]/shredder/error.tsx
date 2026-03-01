'use client'

import { ErrorDisplay } from '@/components/ui/ErrorDisplay'

export default function ShredderError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorDisplay error={error} reset={reset} context="loading RFP shredder" />
}
