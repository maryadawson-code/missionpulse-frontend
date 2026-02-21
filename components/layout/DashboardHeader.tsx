// filepath: components/layout/DashboardHeader.tsx
'use client'

import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface DashboardHeaderProps {
  userEmail: string | null
}

export default function DashboardHeader({ userEmail }: DashboardHeaderProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-[#00050F] px-6">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
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
          className="w-full rounded-lg border border-gray-700 bg-gray-900/50 py-2 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 outline-none transition-colors focus:border-[#00E5FA]/50 focus:ring-1 focus:ring-[#00E5FA]/25"
        />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Notifications placeholder */}
        <button
          type="button"
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
          {/* Unread indicator */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#00E5FA]" />
        </button>

        {/* User email + sign out */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{userEmail}</span>
          <button
            onClick={handleSignOut}
            type="button"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
