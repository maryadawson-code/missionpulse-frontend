'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatAction, timeAgo, getInitials, groupByDate } from '@/lib/utils/activity'

interface ActivityEntry {
  id: string
  action: string
  timestamp: string | null
  user_name: string | null
  user_role: string | null
  details: Record<string, unknown> | null
}

interface ActivityLogProps {
  /** Filter to a specific entity (e.g., opportunity_id). Omit for global. */
  entityId?: string
  /** Entity type to filter on (matches details.entity_type) */
  entityType?: string
  /** Max entries to show */
  limit?: number
  /** Enable real-time updates */
  realtime?: boolean
}

export function ActivityLog({
  entityId,
  entityType,
  limit = 50,
  realtime = false,
}: ActivityLogProps) {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function fetchEntries() {
      let query = supabase
        .from('activity_log')
        .select('id, action, timestamp, user_name, user_role, details')
        .order('timestamp', { ascending: false })
        .limit(limit)

      // Filter by entity if provided — uses JSON containment on details
      if (entityId && entityType) {
        query = query.contains('details', {
          entity_type: entityType,
          entity_id: entityId,
        })
      } else if (entityId) {
        query = query.contains('details', { entity_id: entityId })
      }

      const { data } = await query
      setEntries((data as ActivityEntry[]) ?? [])
      setIsLoading(false)
    }

    fetchEntries()

    // Real-time subscription
    if (realtime) {
      const channel = supabase
        .channel('activity_log_changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'activity_log' },
          (payload) => {
            const entry = payload.new as ActivityEntry
            // Check if this entry matches our filter
            if (entityId) {
              const details = entry.details as Record<string, unknown> | null
              if (details?.entity_id !== entityId) return
            }
            setEntries((prev) => [entry, ...prev].slice(0, limit))
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [entityId, entityType, limit, realtime])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-3 py-2">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-2 w-1/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No recent activity
      </p>
    )
  }

  const groups = groupByDate(entries)

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </h4>
          <div className="space-y-0.5">
            {group.items.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(entry.user_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium text-foreground">
                      {entry.user_name ?? 'Unknown'}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {formatAction(entry.action)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(entry.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
