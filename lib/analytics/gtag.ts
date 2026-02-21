/**
 * Google Analytics 4 — Marketing page tracking only.
 * No tracking on authenticated dashboard pages.
 *
 * Env: NEXT_PUBLIC_GA4_ID
 */

export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID ?? ''

// Type-safe event names for marketing conversion tracking
export type MarketingEvent =
  | 'pricing_page_view'
  | 'pilot_signup_click'
  | 'newsletter_subscribe'
  | 'eight_a_toolkit_view'
  | 'plan_selected'

interface EventParams {
  plan_tier?: string
  billing_interval?: 'monthly' | 'annual'
  source?: string
  [key: string]: string | number | boolean | undefined
}

/**
 * Track a GA4 event. No-op if GA4_ID is not configured.
 */
export function trackEvent(event: MarketingEvent, params?: EventParams): void {
  if (!GA4_ID || typeof window === 'undefined') return

  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void })
    .gtag
  if (gtag) {
    gtag('event', event, params)
  }
}

/**
 * Track a page view. Called automatically by the GA4 script.
 */
export function trackPageView(url: string): void {
  if (!GA4_ID || typeof window === 'undefined') return

  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void })
    .gtag
  if (gtag) {
    gtag('config', GA4_ID, { page_path: url })
  }
}
