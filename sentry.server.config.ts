/**
 * Sentry Server-Side Configuration
 * Loaded automatically by @sentry/nextjs in the Node.js runtime.
 *
 * CUI Compliance: Only user ID in context (no email/name),
 * beforeSend scrubs CUI markers from event data.
 */
import * as Sentry from '@sentry/nextjs'

const CUI_PATTERN = /\b(CUI|CONTROLLED|FOUO|NOFORN)\b/i

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.3,

  environment: process.env.NEXT_PUBLIC_SITE_URL?.includes('missionpulse.ai')
    ? 'production'
    : 'staging',

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
