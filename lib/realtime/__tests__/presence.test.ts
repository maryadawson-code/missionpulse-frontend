import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Setup ───────────────────────────────────────────────

let subscribeCallback: ((_status: string) => void) | null = null

const mockChannel = {
  presenceState: vi.fn(() => ({})),
  on: vi.fn(() => mockChannel),
  subscribe: vi.fn((cb?: (_status: string) => void) => {
    if (cb) subscribeCallback = cb
    return mockChannel
  }),
  track: vi.fn().mockResolvedValue('ok'),
  untrack: vi.fn().mockResolvedValue('ok'),
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
  joinPresenceChannel,
  updatePresence,
  getPresenceUsers,
  type PresenceUser,
} from '../presence'

// ─── Tests ────────────────────────────────────────────────────

describe('presence', () => {
  const testUser = {
    id: 'user-1',
    name: 'Alice',
    avatarUrl: 'https://example.com/avatar.png',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    subscribeCallback = null
    mockChannel.presenceState.mockReturnValue({})
    // Reset chainable behavior
    mockChannel.on.mockImplementation(() => mockChannel)
    mockChannel.subscribe.mockImplementation((cb?: (_status: string) => void) => {
      if (cb) subscribeCallback = cb
      return mockChannel
    })
  })

  // ─── joinPresenceChannel ──────────────────────────────────

  describe('joinPresenceChannel', () => {
    it('creates channel with correct name and subscribes', () => {
      const onSync = vi.fn()
      const result = joinPresenceChannel('opp-123', testUser, onSync)

      expect(mockSupabase.channel).toHaveBeenCalledWith(
        'presence:opportunity:opp-123',
        { config: { presence: { key: 'user-1' } } }
      )
      expect(mockChannel.on).toHaveBeenCalledWith(
        'presence',
        { event: 'sync' },
        expect.any(Function)
      )
      expect(mockChannel.subscribe).toHaveBeenCalled()
      expect(result.channel).toBe(mockChannel)
      expect(typeof result.leave).toBe('function')
    })

    it('tracks presence after SUBSCRIBED status', async () => {
      const onSync = vi.fn()
      joinPresenceChannel('opp-123', testUser, onSync)

      // Simulate the subscribe callback firing with SUBSCRIBED
      expect(subscribeCallback).not.toBeNull()
      await subscribeCallback!('SUBSCRIBED')

      expect(mockChannel.track).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          userName: 'Alice',
          avatarUrl: 'https://example.com/avatar.png',
          sectionId: null,
          status: 'viewing',
          lastSeen: expect.any(String),
        })
      )
    })

    it('leave() calls untrack and removeChannel', () => {
      const onSync = vi.fn()
      const { leave } = joinPresenceChannel('opp-123', testUser, onSync)

      leave()

      expect(mockChannel.untrack).toHaveBeenCalled()
      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
    })
  })

  // ─── getPresenceUsers ─────────────────────────────────────

  describe('getPresenceUsers', () => {
    it('extracts users from presenceState correctly', () => {
      const mockState: Record<string, PresenceUser[]> = {
        'user-1': [
          {
            userId: 'user-1',
            userName: 'Alice',
            avatarUrl: null,
            sectionId: 'sec-1',
            status: 'editing',
            lastSeen: '2026-02-28T00:00:00Z',
          },
        ],
        'user-2': [
          {
            userId: 'user-2',
            userName: 'Bob',
            avatarUrl: null,
            sectionId: null,
            status: 'viewing',
            lastSeen: '2026-02-28T00:01:00Z',
          },
        ],
      }
      mockChannel.presenceState.mockReturnValue(mockState)

      const users = getPresenceUsers(mockChannel as unknown as import('@supabase/supabase-js').RealtimeChannel)

      expect(users).toHaveLength(2)
      expect(users[0].userId).toBe('user-1')
      expect(users[0].userName).toBe('Alice')
      expect(users[1].userId).toBe('user-2')
      expect(users[1].userName).toBe('Bob')
    })

    it('handles empty presence state', () => {
      mockChannel.presenceState.mockReturnValue({})

      const users = getPresenceUsers(mockChannel as unknown as import('@supabase/supabase-js').RealtimeChannel)

      expect(users).toEqual([])
    })
  })

  // ─── updatePresence ───────────────────────────────────────

  describe('updatePresence', () => {
    it('calls track() with merged state', async () => {
      const existingState: Record<string, PresenceUser[]> = {
        'user-1': [
          {
            userId: 'user-1',
            userName: 'Alice',
            avatarUrl: 'https://example.com/avatar.png',
            sectionId: null,
            status: 'viewing',
            lastSeen: '2026-02-28T00:00:00Z',
          },
        ],
      }
      mockChannel.presenceState.mockReturnValue(existingState)

      await updatePresence(
        mockChannel as unknown as import('@supabase/supabase-js').RealtimeChannel,
        { sectionId: 'sec-42', status: 'editing' }
      )

      expect(mockChannel.track).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          userName: 'Alice',
          avatarUrl: 'https://example.com/avatar.png',
          sectionId: 'sec-42',
          status: 'editing',
          lastSeen: expect.any(String),
        })
      )
    })
  })
})
