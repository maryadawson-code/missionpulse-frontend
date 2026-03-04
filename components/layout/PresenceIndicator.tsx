'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Wifi, WifiOff, Users } from 'lucide-react'
import {
  joinPresenceChannel,
  type PresenceUser,
} from '@/lib/realtime/presence'

// ─── Types ───────────────────────────────────────────────────

interface PresenceIndicatorProps {
  opportunityId: string
  userId: string
  userName: string
  avatarUrl: string | null
}

// ─── Component ───────────────────────────────────────────────

export function PresenceIndicator({
  opportunityId,
  userId,
  userName,
  avatarUrl,
}: PresenceIndicatorProps) {
  const [users, setUsers] = useState<PresenceUser[]>([])
  const [connected, setConnected] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const { leave } = joinPresenceChannel(
      opportunityId,
      { id: userId, name: userName, avatarUrl },
      (presenceUsers) => {
        setUsers(presenceUsers)
        setConnected(true)
      }
    )

    setConnected(true)

    return () => {
      leave()
      setConnected(false)
    }
  }, [opportunityId, userId, userName, avatarUrl])

  // Filter out current user for display
  const otherUsers = users.filter((u) => u.userId !== userId)
  const totalOnline = users.length

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-input transition-colors"
      >
        {connected ? (
          <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
        )}

        {/* Avatar stack */}
        {otherUsers.length > 0 ? (
          <div className="flex -space-x-1.5">
            {otherUsers.slice(0, 3).map((u) => (
              <div
                key={u.userId}
                className="h-5 w-5 rounded-full border border-background bg-secondary flex items-center justify-center"
                title={u.userName}
              >
                {u.avatarUrl ? (
                  <Image
                    src={u.avatarUrl}
                    alt={u.userName}
                    width={20}
                    height={20}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-[9px] font-medium text-muted-foreground">
                    {u.userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            ))}
            {otherUsers.length > 3 && (
              <div className="h-5 w-5 rounded-full border border-background bg-muted flex items-center justify-center">
                <span className="text-[9px] font-medium text-muted-foreground">
                  +{otherUsers.length - 3}
                </span>
              </div>
            )}
          </div>
        ) : (
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
        )}

        <span className="text-muted-foreground">
          {totalOnline} online
        </span>
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-border bg-popover p-2 shadow-xl">
            <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">
              People on this page
            </div>

            {users.length === 0 ? (
              <p className="px-2 py-1 text-xs text-muted-foreground">No one online</p>
            ) : (
              <div className="space-y-1">
                {users.map((u) => (
                  <div
                    key={u.userId}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                  >
                    <div className="relative">
                      <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
                        {u.avatarUrl ? (
                          <Image
                            src={u.avatarUrl}
                            alt={u.userName}
                            width={24}
                            height={24}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {u.userName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background ${
                          u.status === 'editing'
                            ? 'bg-cyan-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {u.userName}
                        {u.userId === userId && (
                          <span className="ml-1 text-muted-foreground">(you)</span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {u.status === 'editing'
                          ? 'Editing a section'
                          : 'Viewing'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
