'use client'

import { useEffect, useState } from 'react'
import {
  initWebVitals,
  latestVitals,
  rateVital,
  type VitalsSnapshot,
} from '@/lib/monitoring/web-vitals'

const RATING_COLORS: Record<string, string> = {
  good: 'text-emerald-600 dark:text-emerald-400',
  'needs-improvement': 'text-amber-600 dark:text-amber-400',
  poor: 'text-red-600 dark:text-red-400',
}

function formatValue(name: string, value: number): string {
  if (name === 'CLS') return value.toFixed(3)
  return `${Math.round(value)}ms`
}

/**
 * WebVitalsReporter — initializes Web Vitals collection.
 * When NEXT_PUBLIC_SHOW_VITALS=true, renders a floating dev overlay
 * with color-coded CWV metrics (bottom-right corner).
 */
export function WebVitalsReporter() {
  const showOverlay = process.env.NEXT_PUBLIC_SHOW_VITALS === 'true'
  const [vitals, setVitals] = useState<VitalsSnapshot>({})

  useEffect(() => {
    initWebVitals()

    if (showOverlay) {
      const interval = setInterval(() => {
        setVitals({ ...latestVitals })
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [showOverlay])

  if (!showOverlay) return null

  const entries = Object.entries(vitals).filter(
    (entry): entry is [string, number] => entry[1] !== undefined
  )

  if (entries.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-border bg-background/95 px-3 py-2 font-mono text-xs shadow-lg backdrop-blur">
      <div className="mb-1 text-[10px] font-semibold tracking-wider text-primary">
        WEB VITALS
      </div>
      <div className="space-y-0.5">
        {entries.map(([name, value]) => {
          const rating = rateVital(name, value)
          return (
            <div key={name} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{name}</span>
              <span className={RATING_COLORS[rating]}>
                {formatValue(name, value)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
