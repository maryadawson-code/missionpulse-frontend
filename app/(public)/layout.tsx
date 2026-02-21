'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Zap, Menu, X } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-[#00050F] text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-800/50 bg-[#00050F]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-[#00E5FA]" />
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
                    ? 'text-[#00E5FA]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-white"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[#00E5FA] px-4 py-2 text-sm font-medium text-[#00050F] hover:bg-[#00E5FA]/90"
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
              <X className="h-6 w-6 text-gray-400" />
            ) : (
              <Menu className="h-6 w-6 text-gray-400" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-800/50 px-6 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm ${
                    pathname === link.href
                      ? 'text-[#00E5FA]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center gap-3 border-t border-gray-800/50 pt-4">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-[#00E5FA] px-4 py-2 text-sm font-medium text-[#00050F] hover:bg-[#00E5FA]/90"
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
      <footer className="border-t border-gray-800/50 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#00E5FA]" />
              <span className="font-semibold">MissionPulse</span>
              <span className="text-xs text-gray-600">
                by Mission Meets Tech, LLC
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/#features" className="hover:text-gray-300">
                Features
              </Link>
              <Link href="/plans" className="hover:text-gray-300">
                Pricing
              </Link>
              <Link href="/8a-toolkit" className="hover:text-gray-300">
                8(a) Toolkit
              </Link>
              <Link href="/login" className="hover:text-gray-300">
                Log In
              </Link>
            </div>
            <p className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} Mission Meets Tech, LLC. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
