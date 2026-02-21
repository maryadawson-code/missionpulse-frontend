'use client'

import { useState, useTransition } from 'react'
import { Bell, Check, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import {
  markAsRead,
  markAllAsRead,
  dismissNotification,
} from '@/app/(dashboard)/notifications/actions'

interface Notification {
  id: string
  title: string
  message: string | null
  notification_type: string
  priority: string | null
  is_read: boolean | null
  is_dismissed: boolean | null
  link_url: string | null
  link_text: string | null
  created_at: string | null
}

interface NotificationCenterProps {
  notifications: Notification[]
}

function priorityBadge(priority: string | null) {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500/20 text-red-300'
    case 'high':
      return 'bg-amber-500/20 text-amber-300'
    case 'normal':
      return 'bg-blue-500/20 text-blue-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

function typeBadge(type: string) {
  switch (type) {
    case 'gate_approval':
      return 'bg-emerald-500/20 text-emerald-300'
    case 'deadline':
      return 'bg-red-500/20 text-red-300'
    case 'assignment':
      return 'bg-[#00E5FA]/20 text-[#00E5FA]'
    case 'ai_complete':
      return 'bg-purple-500/20 text-purple-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

export function NotificationCenter({
  notifications,
}: NotificationCenterProps) {
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filtered =
    filter === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications

  const unreadCount = notifications.filter((n) => !n.is_read).length

  function handleMarkRead(id: string) {
    startTransition(async () => {
      const result = await markAsRead(id)
      if (!result.success) addToast('error', 'Failed to mark as read')
    })
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      const result = await markAllAsRead()
      if (result.success) {
        addToast('success', 'All notifications marked as read')
      } else {
        addToast('error', 'Failed to mark all as read')
      }
    })
  }

  function handleDismiss(id: string) {
    startTransition(async () => {
      const result = await dismissNotification(id)
      if (!result.success) addToast('error', 'Failed to dismiss')
    })
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === 'all' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === 'unread' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Unread ({unreadCount})
          </button>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            <Check className="h-3 w-3" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Notification List */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {filter === 'unread'
                ? 'No unread notifications'
                : 'No notifications yet'}
            </p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`px-5 py-4 transition-colors hover:bg-muted/10 ${!n.is_read ? 'border-l-2 border-l-[#00E5FA]' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4
                      className={`text-sm ${!n.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
                    >
                      {n.title}
                    </h4>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${typeBadge(n.notification_type)}`}
                    >
                      {n.notification_type.replace(/_/g, ' ')}
                    </span>
                    {n.priority && n.priority !== 'normal' && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${priorityBadge(n.priority)}`}
                      >
                        {n.priority}
                      </span>
                    )}
                  </div>
                  {n.message && (
                    <p className="text-xs text-muted-foreground mb-1">
                      {n.message}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
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
                    {n.link_url && (
                      <Link
                        href={n.link_url}
                        className="text-[10px] text-[#00E5FA] hover:underline"
                      >
                        {n.link_text ?? 'View'}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      disabled={isPending}
                      className="rounded p-1 text-muted-foreground hover:text-[#00E5FA]"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(n.id)}
                    disabled={isPending}
                    className="rounded p-1 text-muted-foreground hover:text-red-400"
                    title="Dismiss"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
