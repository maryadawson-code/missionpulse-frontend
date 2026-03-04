/**
 * Web Vitals Collection
 *
 * Collects Core Web Vitals (CLS, INP, LCP, FCP, TTFB) using the
 * web-vitals library. Reports to Sentry as measurements + breadcrumbs.
 *
 * INP replaces the deprecated FID metric.
 */
import type { Metric } from 'web-vitals'
import * as Sentry from '@sentry/nextjs'

export interface VitalsSnapshot {
  CLS?: number
  INP?: number
  LCP?: number
  FCP?: number
  TTFB?: number
}

// Latest values for dev overlay
export const latestVitals: VitalsSnapshot = {}

// Google CWV thresholds: [good, needs-improvement]
export const CWV_THRESHOLDS: Record<string, [number, number]> = {
  CLS: [0.1, 0.25],
  INP: [200, 500],
  LCP: [2500, 4000],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
}

export type VitalRating = 'good' | 'needs-improvement' | 'poor'

export function rateVital(name: string, value: number): VitalRating {
  const thresholds = CWV_THRESHOLDS[name]
  if (!thresholds) return 'good'
  if (value <= thresholds[0]) return 'good'
  if (value <= thresholds[1]) return 'needs-improvement'
  return 'poor'
}

function reportToSentry(metric: Metric) {
  const name = metric.name as keyof VitalsSnapshot
  latestVitals[name] = metric.value

  Sentry.setMeasurement(metric.name, metric.value, metric.name === 'CLS' ? '' : 'millisecond')

  Sentry.addBreadcrumb({
    category: 'web-vital',
    message: `${metric.name}: ${metric.value.toFixed(metric.name === 'CLS' ? 3 : 0)}`,
    level: rateVital(metric.name, metric.value) === 'poor' ? 'warning' : 'info',
    data: {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    },
  })
}

/**
 * Initialize Web Vitals collection.
 * Must be called from a client component useEffect.
 */
export function initWebVitals() {
  import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
    onCLS(reportToSentry)
    onINP(reportToSentry)
    onLCP(reportToSentry)
    onFCP(reportToSentry)
    onTTFB(reportToSentry)
  })
}
