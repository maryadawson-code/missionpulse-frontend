'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import {
  markAsRead,
} from '@/app/(dashboard)/notifications/actions'

export interface NotificationItem {
  id: string
  title: string
  message: string | null
  notification_type: string
  priority: string | null
  is_read: boolean
  link_url: string | null
  link_text: string | null
  created_at: string | null
}

const TYPE_LABELS: Record<string, string> = {
  gate_approval: 'Gate',
  deadline: 'Deadline',
  assignment: 'Assigned',
  ai_complete: 'AI',
  section_status_change: 'Status',
}

function typeBadgeClass(type: string): string {
  switch (type) {
    case 'gate_approval':
      return 'bg-emerald-500/20 text-emerald-300'
    case 'deadline':
      return 'bg-red-500/20 text-red-300'
    case 'assignment':
      return 'bg-primary/20 text-primary'
    case 'ai_complete':
      return 'bg-purple-500/20 text-purple-300'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function timeAgo(timestamp: string | null): string {
  if (!timestamp) return ''
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface NotificationsDropdownProps {
  items: NotificationItem[]
}

export function NotificationsDropdown({ items }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = items.filter((n) => !n.is_read).length

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-popover-foreground">
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </h3>
            <Link
              href="/notifications"
              className="text-xs text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              View All
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No notifications
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`border-b border-border/50 px-4 py-3 transition-colors last:border-0 hover:bg-accent/30 ${!item.is_read ? 'border-l-2 border-l-primary' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className={`text-sm truncate ${!item.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                          {item.title}
                        </p>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${typeBadgeClass(item.notification_type)}`}>
                          {TYPE_LABELS[item.notification_type] ?? item.notification_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {item.message && (
                        <p className="text-xs text-muted-foreground truncate">{item.message}</p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{timeAgo(item.created_at)}</span>
                        {item.link_url && (
                          <Link
                            href={item.link_url}
                            className="text-[10px] text-primary hover:underline"
                            onClick={() => setOpen(false)}
                          >
                            {item.link_text ?? 'View'}
                          </Link>
                        )}
                      </div>
                    </div>
                    {!item.is_read && (
                      <button
                        onClick={() => handleMarkRead(item.id)}
                        disabled={isPending}
                        className="shrink-0 rounded p-1 text-muted-foreground hover:text-primary"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
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
