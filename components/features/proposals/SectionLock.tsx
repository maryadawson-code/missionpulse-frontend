'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Lock, Unlock, Edit3 } from 'lucide-react'
import {
  joinLockChannel,
  acquireLock,
  releaseLock,
  extendLock,
  isLockedByOther,
  type SectionLock as SectionLockType,
} from '@/lib/realtime/section-lock'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ─── Types ───────────────────────────────────────────────────

interface SectionLockProps {
  opportunityId: string
  sectionId: string
  userId: string
  userName: string
  onLockAcquired?: () => void
  onLockReleased?: () => void
  onLockBlocked?: (_lockedBy: string) => void
}

// ─── Component ───────────────────────────────────────────────

export function SectionLockControl({
  opportunityId,
  sectionId,
  userId,
  userName,
  onLockAcquired,
  onLockReleased,
  onLockBlocked,
}: SectionLockProps) {
  const [locks, setLocks] = useState<Map<string, SectionLockType>>(new Map())
  const [isHolding, setIsHolding] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const locksRef = useRef<Map<string, SectionLockType>>(new Map())
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync locksRef with state
  useEffect(() => {
    locksRef.current = locks
  }, [locks])

  // Join lock channel on mount
  useEffect(() => {
    const { channel, cleanup } = joinLockChannel(opportunityId, (updated) => {
      setLocks(updated)
      locksRef.current = updated
    })
    channelRef.current = channel

    return () => {
      // Release our lock on unmount
      if (channelRef.current && locksRef.current.get(sectionId)?.userId === userId) {
        releaseLock(channelRef.current, locksRef.current, sectionId, userId)
      }
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      cleanup()
    }
  }, [opportunityId, sectionId, userId])

  const handleClaim = useCallback(() => {
    if (!channelRef.current) return

    const result = acquireLock(
      channelRef.current,
      locksRef.current,
      sectionId,
      { id: userId, name: userName }
    )

    if (result.acquired) {
      setIsHolding(true)
      onLockAcquired?.()

      // Start heartbeat to extend lock while editing
      heartbeatRef.current = setInterval(() => {
        if (channelRef.current) {
          extendLock(channelRef.current, locksRef.current, sectionId, userId)
        }
      }, 5 * 60 * 1000) // Extend every 5 minutes
    } else {
      onLockBlocked?.(result.lockedBy ?? 'another user')
    }
  }, [sectionId, userId, userName, onLockAcquired, onLockBlocked])

  const handleRelease = useCallback(() => {
    if (!channelRef.current) return

    const released = releaseLock(channelRef.current, locksRef.current, sectionId, userId)
    if (released) {
      setIsHolding(false)
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
      onLockReleased?.()
    }
  }, [sectionId, userId, onLockReleased])

  const lockStatus = isLockedByOther(locks, sectionId, userId)

  if (isHolding) {
    return (
      <button
        onClick={handleRelease}
        className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        title="Release section lock"
      >
        <Edit3 className="h-3.5 w-3.5" />
        Editing — Release
      </button>
    )
  }

  if (lockStatus.locked) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400">
        <Lock className="h-3.5 w-3.5" />
        Locked by {lockStatus.lockedBy}
      </div>
    )
  }

  return (
    <button
      onClick={handleClaim}
      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-border hover:text-foreground transition-colors"
      title="Claim section for editing"
    >
      <Unlock className="h-3.5 w-3.5" />
      Claim to Edit
    </button>
  )
}
