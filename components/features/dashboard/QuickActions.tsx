'use client'

import Link from 'next/link'
import { Upload, Plus, MessageSquare, UserPlus } from 'lucide-react'

const ACTIONS = [
  {
    label: 'Upload RFP',
    href: '/shredder',
    icon: Upload,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    label: 'New Opportunity',
    href: '/pipeline/new',
    icon: Plus,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    label: 'Ask AI',
    href: '/ai-chat',
    icon: MessageSquare,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    label: 'Invite Teammate',
    href: '/settings',
    icon: UserPlus,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
  },
] as const

export function QuickActions() {
  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 lg:left-[calc(50%+128px)]">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
        {ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              href={action.href}
              className="group flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-colors hover:bg-muted/50"
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.bg}`}>
                <Icon className={`h-4 w-4 ${action.color}`} />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                {action.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
