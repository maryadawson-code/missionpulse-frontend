// filepath: components/layout/NotificationsDropdown.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

export interface NotificationItem {
  id: string
  action: string
  user_name: string | null
  timestamp: string | null
}

const ACTION_LABELS: Record<string, string> = {
  create_opportunity: 'created an opportunity',
  update_opportunity: 'updated an opportunity',
  archive_opportunity: 'archived an opportunity',
  delete_opportunity: 'deleted an opportunity',
  update_profile: 'updated their profile',
  update_user_role: 'changed a user role',
  update_password: 'changed their password',
}

function formatAction(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ')
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
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {items.length > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#00E5FA] text-[10px] font-bold text-[#00050F]">
            {items.length > 9 ? '9+' : items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-200">Notifications</h3>
            <Link
              href="/notifications"
              className="text-xs text-[#00E5FA] hover:underline"
              onClick={() => setOpen(false)}
            >
              View All
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">
                No recent activity
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="border-b border-gray-800/50 px-4 py-3 transition-colors last:border-0 hover:bg-gray-800/30"
                >
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-gray-200">
                      {item.user_name ?? 'Unknown'}
                    </span>{' '}
                    {formatAction(item.action)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {timeAgo(item.timestamp)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
