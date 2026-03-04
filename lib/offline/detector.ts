/**
 * Network Status Detector — Connectivity Monitoring
 * Sprint 35 (T-35.2) — Phase L v2.0
 *
 * Monitors online/offline status and triggers queue replay
 * when connectivity is restored.
 *
 * © 2026 Mission Meets Tech
 */

// ─── Types ──────────────────────────────────────────────────────

type StatusListener = (_online: boolean) => void

// ─── State ──────────────────────────────────────────────────────

const listeners: StatusListener[] = []

// ─── Public API ─────────────────────────────────────────────────

/**
 * Check if the browser is currently online.
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

/**
 * Subscribe to online/offline status changes.
 * Returns an unsubscribe function.
 */
export function onStatusChange(listener: StatusListener): () => void {
  listeners.push(listener)

  if (typeof window !== 'undefined') {
    const handleOnline = () => notifyListeners(true)
    const handleOffline = () => notifyListeners(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      const idx = listeners.indexOf(listener)
      if (idx >= 0) listeners.splice(idx, 1)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  return () => {
    const idx = listeners.indexOf(listener)
    if (idx >= 0) listeners.splice(idx, 1)
  }
}

/**
 * Ping a lightweight endpoint to verify actual connectivity
 * (navigator.onLine can be unreliable).
 */
export async function checkConnectivity(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', {
      method: 'HEAD',
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── Private ────────────────────────────────────────────────────

function notifyListeners(online: boolean): void {
  listeners.forEach(fn => fn(online))
}
