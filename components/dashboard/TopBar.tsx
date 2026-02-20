'use client'

/**
 * TopBar — User info, role badge, sign out
 * © 2026 Mission Meets Tech
 */
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/actions/auth'
import type { Profile } from '@/lib/supabase/types'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Command Center',
  '/pipeline': 'Pipeline Intelligence',
  '/swimlane': 'Swimlane Board',
  '/rfp-shredder': 'RFP Shredder',
  '/black-hat': 'Black Hat Review',
  '/iron-dome': 'Iron Dome',
  '/contract-scanner': 'Contract Scanner',
  '/pricing': 'Pricing Engine',
  '/hitl': 'HITL Review',
  '/orals': 'Orals Studio',
  '/teaming': 'Teaming / Frenemy',
  '/agent-hub': 'Agent Hub',
  '/playbook': 'Lessons Playbook',
  '/launch': 'Launch & ROI',
  '/post-award': 'Post-Award',
}

export default function TopBar({ profile }: { profile: Profile }) {
  const pathname = usePathname()

  // War Room pages: /war-room/[id]
  const isWarRoom = pathname.startsWith('/war-room/')
  const title = isWarRoom ? 'War Room' : PAGE_TITLES[pathname] || 'MissionPulse'

  const initials = profile.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/10 bg-[#000A1A] px-6">
      {/* Page title */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {isWarRoom && (
          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400">
            ACTIVE PURSUIT
          </span>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Role badge */}
        <span className="rounded-full bg-[#00E5FA]/10 px-3 py-1 text-xs font-medium text-[#00E5FA]">
          {profile.role}
        </span>

        {/* User avatar + name */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#00E5FA] to-[#0099AA] text-xs font-bold text-[#00050F]">
            {initials}
          </div>
          <span className="hidden text-sm text-slate-300 md:block">
            {profile.full_name}
          </span>
        </div>

        {/* Sign out */}
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            Sign Out
          </button>
        </form>
      </div>
    </header>
  )
}
