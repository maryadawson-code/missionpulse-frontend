'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-red-600 dark:text-red-400">Error</h1>
        <p className="text-muted-foreground max-w-md">
          {process.env.NODE_ENV === 'development'
            ? error.message
            : 'Something went wrong. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="inline-block rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
