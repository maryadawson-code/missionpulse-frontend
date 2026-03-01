import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Setup ───────────────────────────────────────────────

const mockChannel = {
  on: vi.fn(() => mockChannel),
  subscribe: vi.fn(() => mockChannel),
  send: vi.fn(),
}

const mockSupabase = {
  channel: vi.fn(() => mockChannel),
  removeChannel: vi.fn(),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

import {
  acquireLock,
  releaseLock,
  extendLock,
  isLockedByOther,
  type SectionLock,
} from '../section-lock'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ─── Helpers ──────────────────────────────────────────────────

const LOCK_TTL_MS = 30 * 60 * 1000

function makeLock(overrides: Partial<SectionLock> = {}): SectionLock {
  return {
    sectionId: 'sec-1',
    userId: 'user-1',
    userName: 'Alice',
    lockedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + LOCK_TTL_MS).toISOString(),
    ...overrides,
  }
}

const channel = mockChannel as unknown as RealtimeChannel

// ─── Tests ────────────────────────────────────────────────────

describe('section-lock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── acquireLock ──────────────────────────────────────────

  describe('acquireLock', () => {
    it('grants lock on unlocked section', () => {
      const locks = new Map<string, SectionLock>()
      const user = { id: 'user-1', name: 'Alice' }

      const result = acquireLock(channel, locks, 'sec-1', user)

      expect(result.acquired).toBe(true)
      expect(result.lockedBy).toBeUndefined()
      expect(locks.has('sec-1')).toBe(true)
      expect(locks.get('sec-1')!.userId).toBe('user-1')

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'lock_acquired',
        payload: expect.objectContaining({
          sectionId: 'sec-1',
          userId: 'user-1',
          userName: 'Alice',
        }),
      })
    })

    it('denies lock when section is locked by another user', () => {
      const locks = new Map<string, SectionLock>()
      locks.set('sec-1', makeLock({ userId: 'user-2', userName: 'Bob' }))

      const user = { id: 'user-1', name: 'Alice' }
      const result = acquireLock(channel, locks, 'sec-1', user)

      expect(result.acquired).toBe(false)
      expect(result.lockedBy).toBe('Bob')
      // Lock should remain as Bob's
      expect(locks.get('sec-1')!.userId).toBe('user-2')
    })

    it('allows override on expired lock by another user', () => {
      const locks = new Map<string, SectionLock>()
      locks.set(
        'sec-1',
        makeLock({
          userId: 'user-2',
          userName: 'Bob',
          expiresAt: new Date(Date.now() - 1000).toISOString(), // expired 1s ago
        })
      )

      const user = { id: 'user-1', name: 'Alice' }
      const result = acquireLock(channel, locks, 'sec-1', user)

      expect(result.acquired).toBe(true)
      expect(locks.get('sec-1')!.userId).toBe('user-1')

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'lock_acquired',
        payload: expect.objectContaining({
          sectionId: 'sec-1',
          userId: 'user-1',
        }),
      })
    })
  })

  // ─── releaseLock ──────────────────────────────────────────

  describe('releaseLock', () => {
    it('owner releases lock successfully', () => {
      const locks = new Map<string, SectionLock>()
      locks.set('sec-1', makeLock({ userId: 'user-1' }))

      const result = releaseLock(channel, locks, 'sec-1', 'user-1')

      expect(result).toBe(true)
      expect(locks.has('sec-1')).toBe(false)

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'lock_released',
        payload: { sectionId: 'sec-1' },
      })
    })

    it('non-owner cannot release lock', () => {
      const locks = new Map<string, SectionLock>()
      locks.set('sec-1', makeLock({ userId: 'user-1', userName: 'Alice' }))

      const result = releaseLock(channel, locks, 'sec-1', 'user-2')

      expect(result).toBe(false)
      expect(locks.has('sec-1')).toBe(true)
      expect(locks.get('sec-1')!.userId).toBe('user-1')
      expect(mockChannel.send).not.toHaveBeenCalled()
    })
  })

  // ─── extendLock ───────────────────────────────────────────

  describe('extendLock', () => {
    it('owner extends lock TTL and broadcasts', () => {
      const locks = new Map<string, SectionLock>()
      const originalExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min left
      locks.set(
        'sec-1',
        makeLock({ userId: 'user-1', expiresAt: originalExpiry })
      )

      const result = extendLock(channel, locks, 'sec-1', 'user-1')

      expect(result).toBe(true)

      const updated = locks.get('sec-1')!
      // New expiresAt should be later than the original (close to now + 30min)
      expect(new Date(updated.expiresAt).getTime()).toBeGreaterThan(
        new Date(originalExpiry).getTime()
      )

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'lock_acquired',
        payload: expect.objectContaining({
          sectionId: 'sec-1',
          userId: 'user-1',
        }),
      })
    })
  })

  // ─── isLockedByOther ──────────────────────────────────────

  describe('isLockedByOther', () => {
    it('returns locked: false when section is not locked', () => {
      const locks = new Map<string, SectionLock>()

      const result = isLockedByOther(locks, 'sec-1', 'user-1')

      expect(result).toEqual({ locked: false })
    })

    it('returns locked: true when locked by another user', () => {
      const locks = new Map<string, SectionLock>()
      const expiresAt = new Date(Date.now() + LOCK_TTL_MS).toISOString()
      locks.set(
        'sec-1',
        makeLock({ userId: 'user-2', userName: 'Bob', expiresAt })
      )

      const result = isLockedByOther(locks, 'sec-1', 'user-1')

      expect(result.locked).toBe(true)
      expect(result.lockedBy).toBe('Bob')
      expect(result.expiresAt).toBe(expiresAt)
    })

    it('returns locked: false when locked by self', () => {
      const locks = new Map<string, SectionLock>()
      locks.set('sec-1', makeLock({ userId: 'user-1', userName: 'Alice' }))

      const result = isLockedByOther(locks, 'sec-1', 'user-1')

      expect(result).toEqual({ locked: false })
    })

    it('returns locked: false when lock is expired', () => {
      const locks = new Map<string, SectionLock>()
      locks.set(
        'sec-1',
        makeLock({
          userId: 'user-2',
          userName: 'Bob',
          expiresAt: new Date(Date.now() - 1000).toISOString(), // expired
        })
      )

      const result = isLockedByOther(locks, 'sec-1', 'user-1')

      expect(result).toEqual({ locked: false })
    })
  })
})
