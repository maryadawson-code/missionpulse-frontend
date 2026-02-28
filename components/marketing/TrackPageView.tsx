'use client'

import { useEffect } from 'react'
import { trackEvent, type MarketingEvent } from '@/lib/analytics/gtag'

interface TrackPageViewProps {
  event: MarketingEvent
  params?: Record<string, string>
}

export function TrackPageView({ event, params }: TrackPageViewProps) {
  useEffect(() => {
    trackEvent(event, params)
  }, [event, params])

  return null
}
