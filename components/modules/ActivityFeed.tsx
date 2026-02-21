// filepath: components/modules/ActivityFeed.tsx

import type { ActivityItem } from '@/lib/actions/audit'

const ACTION_LABELS: Record<string, string> = {
  create_opportunity: 'created an opportunity',
  update_opportunity: 'updated an opportunity',
  archive_opportunity: 'archived an opportunity',
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
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">
        No recent activity
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-800/50"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#00E5FA]/10 text-xs font-semibold text-[#00E5FA]">
            {getInitials(item.user_name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-200">
              <span className="font-medium">{item.user_name ?? 'Unknown'}</span>{' '}
              <span className="text-gray-400">{formatAction(item.action)}</span>
            </p>
            <p className="text-xs text-gray-500">{timeAgo(item.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
