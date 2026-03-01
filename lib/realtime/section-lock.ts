'use client'

import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────

export interface SectionLock {
  sectionId: string
  userId: string
  userName: string
  lockedAt: string
  expiresAt: string
}

export interface LockState {
  locks: Map<string, SectionLock>
  channel: RealtimeChannel | null
}

// Auto-release timeout: 30 minutes
const LOCK_TTL_MS = 30 * 60 * 1000

// ─── Lock Manager ────────────────────────────────────────────

/**
 * Join the section lock channel for an opportunity.
 * Broadcasts lock/unlock events to all participants.
 */
export function joinLockChannel(
  opportunityId: string,
  onUpdate: (_locks: Map<string, SectionLock>) => void
): { channel: RealtimeChannel; cleanup: () => void } {
  const supabase = createClient()
  const channelName = `locks:opportunity:${opportunityId}`
  const locks = new Map<string, SectionLock>()

  const channel = supabase.channel(channelName)

  channel
    .on('broadcast', { event: 'lock_acquired' }, ({ payload }) => {
      const lock = payload as SectionLock
      locks.set(lock.sectionId, lock)
      onUpdate(new Map(locks))
    })
    .on('broadcast', { event: 'lock_released' }, ({ payload }) => {
      const { sectionId } = payload as { sectionId: string }
      locks.delete(sectionId)
      onUpdate(new Map(locks))
    })
    .on('broadcast', { event: 'lock_expired' }, ({ payload }) => {
      const { sectionId } = payload as { sectionId: string }
      locks.delete(sectionId)
      onUpdate(new Map(locks))
    })
    .subscribe()

  // Periodic stale lock cleanup (check every 60s)
  const cleanupInterval = setInterval(() => {
    const now = Date.now()
    let changed = false
    const entries = Array.from(locks.entries())
    for (const [sectionId, lock] of entries) {
      if (new Date(lock.expiresAt).getTime() < now) {
        locks.delete(sectionId)
        changed = true
        // Broadcast expiry to others
        channel.send({
          type: 'broadcast',
          event: 'lock_expired',
          payload: { sectionId },
        })
      }
    }
    if (changed) onUpdate(new Map(locks))
  }, 60_000)

  const cleanup = () => {
    clearInterval(cleanupInterval)
    supabase.removeChannel(channel)
  }

  return { channel, cleanup }
}

/**
 * Acquire a lock on a section.
 * Returns true if the lock was acquired, false if already locked by another user.
 */
export function acquireLock(
  channel: RealtimeChannel,
  locks: Map<string, SectionLock>,
  sectionId: string,
  user: { id: string; name: string }
): { acquired: boolean; lockedBy?: string } {
  const existing = locks.get(sectionId)
  const now = Date.now()

  // If locked by another user and not expired
  if (existing && existing.userId !== user.id) {
    if (new Date(existing.expiresAt).getTime() > now) {
      return { acquired: false, lockedBy: existing.userName }
    }
    // Expired lock — allow override
  }

  const lock: SectionLock = {
    sectionId,
    userId: user.id,
    userName: user.name,
    lockedAt: new Date().toISOString(),
    expiresAt: new Date(now + LOCK_TTL_MS).toISOString(),
  }

  locks.set(sectionId, lock)

  channel.send({
    type: 'broadcast',
    event: 'lock_acquired',
    payload: lock,
  })

  return { acquired: true }
}

/**
 * Release a lock on a section (only the lock holder can release).
 */
export function releaseLock(
  channel: RealtimeChannel,
  locks: Map<string, SectionLock>,
  sectionId: string,
  userId: string
): boolean {
  const existing = locks.get(sectionId)
  if (!existing || existing.userId !== userId) return false

  locks.delete(sectionId)

  channel.send({
    type: 'broadcast',
    event: 'lock_released',
    payload: { sectionId },
  })

  return true
}

/**
 * Extend a lock's TTL (heartbeat).
 * Called periodically while user is actively editing.
 */
export function extendLock(
  channel: RealtimeChannel,
  locks: Map<string, SectionLock>,
  sectionId: string,
  userId: string
): boolean {
  const existing = locks.get(sectionId)
  if (!existing || existing.userId !== userId) return false

  const updated: SectionLock = {
    ...existing,
    expiresAt: new Date(Date.now() + LOCK_TTL_MS).toISOString(),
  }

  locks.set(sectionId, updated)

  channel.send({
    type: 'broadcast',
    event: 'lock_acquired',
    payload: updated,
  })

  return true
}

/**
 * Check if a section is locked by another user.
 */
export function isLockedByOther(
  locks: Map<string, SectionLock>,
  sectionId: string,
  currentUserId: string
): { locked: boolean; lockedBy?: string; expiresAt?: string } {
  const lock = locks.get(sectionId)
  if (!lock) return { locked: false }

  if (lock.userId === currentUserId) return { locked: false }

  if (new Date(lock.expiresAt).getTime() < Date.now()) {
    return { locked: false }
  }

  return {
    locked: true,
    lockedBy: lock.userName,
    expiresAt: lock.expiresAt,
  }
}
