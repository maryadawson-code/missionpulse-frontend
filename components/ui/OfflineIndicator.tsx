'use client'

import { useState, useEffect } from 'react'
import { isOnline, onStatusChange } from '@/lib/offline/detector'
import { getQueueSize, replayQueue } from '@/lib/offline/queue'

export function OfflineIndicator() {
  const [online, setOnline] = useState(true)
  const [queueCount, setQueueCount] = useState(0)
  const [replaying, setReplaying] = useState(false)

  useEffect(() => {
    setOnline(isOnline())

    const unsub = onStatusChange(async (status) => {
      setOnline(status)
      if (status) {
        // Auto-replay queued actions on reconnect
        setReplaying(true)
        await replayQueue()
        const size = await getQueueSize()
        setQueueCount(size)
        setReplaying(false)
      }
    })

    // Check queue size on mount
    getQueueSize().then(setQueueCount)

    return unsub
  }, [])

  if (online && queueCount === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!online && (
        <div className="rounded-lg bg-yellow-900/90 px-4 py-2 text-sm text-yellow-200 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
            You are offline — changes will sync when reconnected
          </div>
          {queueCount > 0 && (
            <p className="mt-1 text-xs text-yellow-300">
              {queueCount} action{queueCount !== 1 ? 's' : ''} queued
            </p>
          )}
        </div>
      )}

      {online && replaying && (
        <div className="rounded-lg bg-blue-900/90 px-4 py-2 text-sm text-blue-200 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            Syncing queued changes...
          </div>
        </div>
      )}

      {online && !replaying && queueCount > 0 && (
        <div className="rounded-lg bg-red-900/90 px-4 py-2 text-sm text-red-200 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            {queueCount} action{queueCount !== 1 ? 's' : ''} failed to sync
          </div>
        </div>
      )}
    </div>
  )
}
