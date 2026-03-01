'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface SessionTimeoutGuardProps {
  timeoutSeconds: number
}

export function SessionTimeoutGuard({ timeoutSeconds }: SessionTimeoutGuardProps) {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const lastActivityRef = useRef(Date.now())
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const warningThreshold = Math.max(timeoutSeconds - 120, timeoutSeconds * 0.9) // 2 min before or 90%

  const handleSignOut = useCallback(async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }, [router])

  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now()
    setShowWarning(false)

    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true)
    }, warningThreshold * 1000)

    logoutTimerRef.current = setTimeout(() => {
      handleSignOut()
    }, timeoutSeconds * 1000)
  }, [timeoutSeconds, warningThreshold, handleSignOut])

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']

    function onActivity() {
      // Only reset if warning isn't showing (prevent extend-by-moving during warning)
      if (!showWarning) {
        resetTimers()
      }
    }

    events.forEach((e) => document.addEventListener(e, onActivity, { passive: true }))
    resetTimers()

    return () => {
      events.forEach((e) => document.removeEventListener(e, onActivity))
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
    }
  }, [resetTimers, showWarning])

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
      <div className="mx-4 w-full max-w-sm rounded-xl border border-amber-500/30 bg-card p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
            <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Session Expiring</h3>
            <p className="text-xs text-muted-foreground">
              Your session will expire in 2 minutes due to inactivity.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => resetTimers()}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Stay Logged In
          </button>
          <button
            onClick={handleSignOut}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
