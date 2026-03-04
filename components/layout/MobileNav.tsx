'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface MobileNavProps {
  children: React.ReactNode
}

export function MobileNav({ children }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mr-3 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Overlay + drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
            {children}
          </div>
        </>
      )}
    </>
  )
}
