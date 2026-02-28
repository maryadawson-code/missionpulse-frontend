/**
 * Sentry Edge/Middleware Configuration
 * Loaded automatically by @sentry/nextjs in the Edge runtime.
 */
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,

  sampleRate: 1.0,
  tracesSampleRate: 0.1,
})
