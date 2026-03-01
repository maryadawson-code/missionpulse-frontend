/**
 * Client-Side Instrumentation — Sentry SDK initialization.
 * Uses the Next.js instrumentation-client.ts pattern (Turbopack-ready).
 *
 * Migrated from sentry.client.config.ts (deprecated pattern).
 *
 * CUI Compliance: No session replay (privacy), no PII in context,
 * beforeSend scrubs CUI markers from event data.
 */
import * as Sentry from '@sentry/nextjs'

const CUI_PATTERN = /\b(CUI|CONTROLLED|FOUO|NOFORN)\b/i

// Re-export navigation hook for Next.js App Router performance tracing
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture all errors, sample 10% of traces
  sampleRate: 1.0,
  tracesSampleRate: 0.1,

  // CUI privacy — no session replay
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  beforeSend(event) {
    // Scrub CUI markers from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.filter(
        (b) => !CUI_PATTERN.test(b.message ?? '')
      )
    }

    // Scrub CUI markers from exception values
    if (event.exception?.values) {
      for (const ex of event.exception.values) {
        if (ex.value && CUI_PATTERN.test(ex.value)) {
          ex.value = ex.value.replace(CUI_PATTERN, '[REDACTED]')
        }
      }
    }

    // Strip request bodies that may contain CUI
    if (event.request?.data && typeof event.request.data === 'string') {
      if (CUI_PATTERN.test(event.request.data)) {
        event.request.data = '[REDACTED — CUI content]'
      }
    }

    // Only set safe user context (no email/name)
    if (event.user) {
      const { id } = event.user
      event.user = { id }
    }

    return event
  },
})
