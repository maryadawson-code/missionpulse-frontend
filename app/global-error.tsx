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
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-red-600 dark:text-red-400">
              Something Went Wrong
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              {error.digest
                ? `Error ID: ${error.digest}`
                : 'An unexpected error occurred. Our team has been notified.'}
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={reset}
                className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Try Again
              </button>
              <a
                href="/dashboard"
                className="rounded-lg border border-border px-6 py-2.5 font-semibold text-muted-foreground transition hover:border-input"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
