'use client'

import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────

export interface PresenceUser {
  userId: string
  userName: string
  avatarUrl: string | null
  sectionId: string | null
  status: 'viewing' | 'editing'
  lastSeen: string
}

export interface PresenceState {
  users: PresenceUser[]
  channel: RealtimeChannel | null
}

// ─── Presence Manager ────────────────────────────────────────

/**
 * Join a presence channel for an opportunity.
 * Returns the channel and a cleanup function.
 */
export function joinPresenceChannel(
  opportunityId: string,
  user: { id: string; name: string; avatarUrl: string | null },
  onSync: (users: PresenceUser[]) => void
): { channel: RealtimeChannel; leave: () => void } {
  const supabase = createClient()
  const channelName = `presence:opportunity:${opportunityId}`

  const channel = supabase.channel(channelName, {
    config: { presence: { key: user.id } },
  })

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceUser>()
      const users: PresenceUser[] = []
      const keys = Object.keys(state)
      for (const key of keys) {
        const presences = state[key]
        if (presences && presences.length > 0) {
          users.push(presences[0] as PresenceUser)
        }
      }
      onSync(users)
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId: user.id,
          userName: user.name,
          avatarUrl: user.avatarUrl,
          sectionId: null,
          status: 'viewing',
          lastSeen: new Date().toISOString(),
        } satisfies PresenceUser)
      }
    })

  const leave = () => {
    channel.untrack()
    supabase.removeChannel(channel)
  }

  return { channel, leave }
}

/**
 * Update the current user's presence state (e.g., which section they're editing).
 */
export async function updatePresence(
  channel: RealtimeChannel,
  update: Partial<Pick<PresenceUser, 'sectionId' | 'status'>>
): Promise<void> {
  const state = channel.presenceState<PresenceUser>()
  const keys = Object.keys(state)

  // Find our own presence to merge with
  let current: PresenceUser | null = null
  for (const key of keys) {
    const presences = state[key]
    if (presences && presences.length > 0) {
      // We'll just update with merged data
      current = presences[0] as PresenceUser
      break
    }
  }

  await channel.track({
    userId: current?.userId ?? '',
    userName: current?.userName ?? '',
    avatarUrl: current?.avatarUrl ?? null,
    sectionId: update.sectionId ?? current?.sectionId ?? null,
    status: update.status ?? current?.status ?? 'viewing',
    lastSeen: new Date().toISOString(),
  } satisfies PresenceUser)
}

/**
 * Get the list of users currently in a presence channel.
 */
export function getPresenceUsers(channel: RealtimeChannel): PresenceUser[] {
  const state = channel.presenceState<PresenceUser>()
  const users: PresenceUser[] = []
  const keys = Object.keys(state)
  for (const key of keys) {
    const presences = state[key]
    if (presences && presences.length > 0) {
      users.push(presences[0] as PresenceUser)
    }
  }
  return users
}
