/** Action labels for display */
export const ACTION_LABELS: Record<string, string> = {
  create_opportunity: 'created an opportunity',
  update_opportunity: 'updated an opportunity',
  delete_opportunity: 'deleted an opportunity',
  updated_opportunity_phase: 'changed opportunity phase',
  archive_opportunity: 'archived an opportunity',
  update_profile: 'updated their profile',
  update_user_role: 'changed a user role',
  update_password: 'changed their password',
  add_team_member: 'added a team member',
  remove_team_member: 'removed a team member',
  update_section_status: 'updated a section status',
}

export function formatAction(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ')
}

export function timeAgo(timestamp: string | null): string {
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

export function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/** Group items by date label (Today, Yesterday, or formatted date) */
export function groupByDate<T extends { timestamp: string | null }>(
  items: T[]
): { label: string; items: T[] }[] {
  const groups = new Map<string, T[]>()

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  for (const item of items) {
    if (!item.timestamp) {
      const key = 'Unknown'
      const arr = groups.get(key) ?? []
      arr.push(item)
      groups.set(key, arr)
      continue
    }

    const date = new Date(item.timestamp)
    let label: string

    if (date.toDateString() === today.toDateString()) {
      label = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday'
    } else {
      label = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    }

    const arr = groups.get(label) ?? []
    arr.push(item)
    groups.set(label, arr)
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }))
}
