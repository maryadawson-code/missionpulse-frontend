/**
 * Sentry Edge/Middleware Configuration
 * Loaded automatically by @sentry/nextjs in the Edge runtime.
 */
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.2,
})
