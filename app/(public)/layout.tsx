'use client'

import Link from 'next/link'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Zap, Menu, X } from 'lucide-react'
import { GA4_ID, trackPageView } from '@/lib/analytics/gtag'

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/plans', label: 'Pricing' },
  { href: '/8a-toolkit', label: '8(a) Toolkit' },
]

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Track page views on route change (public pages only)
  useEffect(() => {
    if (GA4_ID) trackPageView(pathname)
  }, [pathname])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* GA4 — public marketing pages only, not loaded on dashboard */}
      {GA4_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA4_ID}', { page_path: window.location.pathname });
            `}
          </Script>
        </>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">MissionPulse</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  pathname === link.href
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start Free Pilot
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-muted-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border/50 px-6 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm ${
                    pathname === link.href
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Start Free Pilot
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Page content */}
      {children}

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-semibold">MissionPulse</span>
              <span className="text-xs text-muted-foreground">
                by Mission Meets Tech, LLC
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/#features" className="hover:text-foreground">
                Features
              </Link>
              <Link href="/plans" className="hover:text-foreground">
                Pricing
              </Link>
              <Link href="/8a-toolkit" className="hover:text-foreground">
                8(a) Toolkit
              </Link>
              <Link href="/login" className="hover:text-foreground">
                Log In
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Mission Meets Tech, LLC. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
