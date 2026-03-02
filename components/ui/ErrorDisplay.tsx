'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

interface ErrorDisplayProps {
  error: Error & { digest?: string }
  reset: () => void
  context?: string
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  'loading dashboard': "We couldn't load your dashboard. This usually means we're updating things.",
  'loading pipeline': "We couldn't load your pipeline. Your data is safe — try refreshing.",
  'loading proposals': 'We had trouble loading proposals. This should resolve quickly.',
  'loading documents': 'Document loading hit a snag. Try refreshing the page.',
  'loading compliance': 'Compliance data failed to load. Please try again.',
}

export function ErrorDisplay({ error, reset, context }: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    Sentry.captureException(error, {
      tags: context ? { context } : undefined,
    })
  }, [error, context])

  const friendlyMessage = context
    ? FRIENDLY_MESSAGES[context] ?? `We encountered a problem ${context}. Please try again.`
    : 'Something went wrong. Please try again.'

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="rounded-xl border border-border bg-card p-8 max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <svg
            className="h-6 w-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-foreground mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {friendlyMessage}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>

          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Expandable details for power users */}
        {error.digest && (
          <div className="mt-6 border-t border-border pt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showDetails ? 'Hide details' : 'What happened?'}
            </button>
            {showDetails && (
              <div className="mt-2 rounded-lg bg-muted/50 p-3 text-left">
                <p className="text-xs text-muted-foreground font-mono">
                  Error ID: {error.digest}
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="mt-1 text-xs text-muted-foreground font-mono break-all">
                    {error.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Report link */}
        <p className="mt-4 text-xs text-muted-foreground">
          If this keeps happening,{' '}
          <a
            href="mailto:support@missionpulse.ai"
            className="text-primary hover:text-primary/80"
          >
            report the issue
          </a>
          .
        </p>
      </div>
    </div>
  )
}
