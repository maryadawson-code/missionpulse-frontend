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
      return 'bg-red-500/20 text-red-700 dark:text-red-300'
    case 'high':
      return 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
    case 'normal':
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

function typeBadge(type: string) {
  switch (type) {
    case 'gate_approval':
      return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
    case 'deadline':
      return 'bg-red-500/20 text-red-700 dark:text-red-300'
    case 'assignment':
      return 'bg-primary/20 text-primary'
    case 'ai_complete':
      return 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

export function NotificationCenter({
  notifications,
}: NotificationCenterProps) {
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const TYPE_FILTERS = [
    { key: 'gate_approval', label: 'Gate Approvals' },
    { key: 'deadline', label: 'Deadlines' },
    { key: 'assignment', label: 'Assignments' },
    { key: 'ai_complete', label: 'AI' },
    { key: 'section_status_change', label: 'Status Changes' },
  ]

  const filtered = notifications
    .filter((n) => (filter === 'unread' ? !n.is_read : true))
    .filter((n) => (typeFilter ? n.notification_type === typeFilter : true))

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
          <span className="mx-1 text-border">|</span>
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(typeFilter === t.key ? null : t.key)}
              className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${typeFilter === t.key ? `${typeBadge(t.key)}` : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t.label}
            </button>
          ))}
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
              className={`px-5 py-4 transition-colors hover:bg-muted/10 ${!n.is_read ? 'border-l-2 border-l-primary' : ''}`}
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
                        className="text-[10px] text-primary hover:underline"
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
                      className="rounded p-1 text-muted-foreground hover:text-primary"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(n.id)}
                    disabled={isPending}
                    className="rounded p-1 text-muted-foreground hover:text-red-600 dark:text-red-400"
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
