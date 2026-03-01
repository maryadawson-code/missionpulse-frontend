'use client'

import { ErrorDisplay } from '@/components/ui/ErrorDisplay'

export default function CollaborationError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorDisplay error={error} reset={reset} context="loading collaboration view" />
}
