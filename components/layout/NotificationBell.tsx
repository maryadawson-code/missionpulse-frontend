'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'

import {
  markAsRead,
  dismissNotification,
} from '@/app/(dashboard)/notifications/actions'

interface Notification {
  id: string
  title: string
  message: string | null
  notification_type: string
  priority: string | null
  is_read: boolean | null
  link_url: string | null
  created_at: string | null
}

interface NotificationBellProps {
  notifications: Notification[]
}

function priorityDot(priority: string | null) {
  switch (priority) {
    case 'urgent':
      return 'bg-red-400'
    case 'high':
      return 'bg-amber-400'
    default:
      return 'bg-[#00E5FA]'
  }
}

export function NotificationBell({ notifications }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markAsRead(id)
    })
  }

  function handleDismiss(id: string) {
    startTransition(async () => {
      await dismissNotification(id)
    })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-md p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-xl z-50">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              Notifications
            </h3>
            <Link
              href="/notifications"
              className="text-xs text-[#00E5FA] hover:underline"
              onClick={() => setIsOpen(false)}
            >
              View All
            </Link>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No notifications
              </p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 transition-colors hover:bg-muted/10 ${!n.is_read ? 'bg-muted/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!n.is_read ? priorityDot(n.priority) : 'bg-transparent'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {n.created_at
                            ? new Date(n.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                        {!n.is_read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            disabled={isPending}
                            className="text-[10px] text-[#00E5FA] hover:underline"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => handleDismiss(n.id)}
                          disabled={isPending}
                          className="text-[10px] text-muted-foreground hover:text-red-400"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                    {n.link_url && (
                      <Link
                        href={n.link_url}
                        onClick={() => {
                          setIsOpen(false)
                          if (!n.is_read) handleMarkRead(n.id)
                        }}
                        className="shrink-0 text-xs text-[#00E5FA] hover:underline"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
