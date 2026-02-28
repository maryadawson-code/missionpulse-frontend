'use client'

import Link from 'next/link'
import { trackEvent, type MarketingEvent } from '@/lib/analytics/gtag'

interface TrackedCTAProps {
  href: string
  event: MarketingEvent
  params?: Record<string, string>
  className?: string
  children: React.ReactNode
}

export function TrackedCTA({ href, event, params, className, children }: TrackedCTAProps) {
  return (
    <Link
      href={href}
      onClick={() => trackEvent(event, params)}
      className={className}
    >
      {children}
    </Link>
  )
}
