'use client'

import { ErrorDisplay } from '@/components/ui/ErrorDisplay'

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorDisplay error={error} reset={reset} context="loading settings" />
}
