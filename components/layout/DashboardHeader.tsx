// filepath: components/layout/DashboardHeader.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { NotificationsDropdown, type NotificationItem } from './NotificationsDropdown'

interface DashboardHeaderProps {
  userEmail: string | null
  notifications?: NotificationItem[]
}

export default function DashboardHeader({ userEmail, notifications = [] }: DashboardHeaderProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      router.push(`/pipeline?q=${encodeURIComponent(q)}`)
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative w-full max-w-md">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search opportunities, proposals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-input bg-card/50 py-2 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
        />
      </form>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        <NotificationsDropdown items={notifications} />

        {/* User email + sign out */}
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">{userEmail}</span>
          <button
            onClick={handleSignOut}
            type="button"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
