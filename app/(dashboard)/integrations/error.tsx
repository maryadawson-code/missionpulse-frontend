'use client'

import { ErrorDisplay } from '@/components/ui/ErrorDisplay'

export default function IntegrationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorDisplay error={error} reset={reset} context="loading integrations" />
}
