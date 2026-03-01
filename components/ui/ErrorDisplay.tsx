'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

interface ErrorDisplayProps {
  error: Error & { digest?: string }
  reset: () => void
  context?: string
}

export function ErrorDisplay({ error, reset, context }: ErrorDisplayProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: context ? { context } : undefined,
    })
  }, [error, context])

  const productionMessage = context
    ? `We encountered a problem ${context}. Please try again.`
    : 'Something went wrong. Please try again.'

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/20 p-8 max-w-md text-center">
        <h2 className="text-lg font-semibold text-foreground mb-2">
          {context ? `Failed to load ${context.replace('loading ', '')}` : 'Error'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {process.env.NODE_ENV === 'development'
            ? error.message
            : productionMessage}
        </p>
        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className="text-xs text-muted-foreground mb-4 font-mono">
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
