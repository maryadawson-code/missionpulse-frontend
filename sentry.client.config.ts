/**
 * Sentry Client-Side Configuration
 * Loaded automatically by @sentry/nextjs in the browser.
 *
 * CUI Compliance: Session replay masks all text and blocks all media.
 */
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.2,

  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  tracePropagationTargets: ['missionpulse.ai', /^\/api\//],

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
