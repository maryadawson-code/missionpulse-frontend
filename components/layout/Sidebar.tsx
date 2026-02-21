// filepath: components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { RBACModule, ModulePermission } from '@/lib/types'

// ─── Nav Item Config ────────────────────────────────────────────
// Maps RBAC module keys to display labels, routes, and icons (SVG paths).
// Only items where shouldRender=true for the user's role will appear.

interface NavItem {
  module: RBACModule
  label: string
  href: string
  iconPath: string
}

const NAV_ITEMS: NavItem[] = [
  {
    module: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4',
  },
  {
    module: 'pipeline',
    label: 'Pipeline',
    href: '/dashboard/pipeline',
    iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    module: 'proposals',
    label: 'Proposals',
    href: '/dashboard/proposals',
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    module: 'pricing',
    label: 'Pricing',
    href: '/dashboard/pricing',
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    module: 'strategy',
    label: 'Strategy',
    href: '/dashboard/strategy',
    iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  },
  {
    module: 'blackhat',
    label: 'Black Hat',
    href: '/dashboard/blackhat',
    iconPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  {
    module: 'compliance',
    label: 'Compliance',
    href: '/dashboard/compliance',
    iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    module: 'workflow_board',
    label: 'Workflow',
    href: '/dashboard/workflow',
    iconPath: 'M4 6h16M4 10h16M4 14h16M4 18h16',
  },
  {
    module: 'documents',
    label: 'Documents',
    href: '/dashboard/documents',
    iconPath: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z',
  },
  {
    module: 'ai_chat',
    label: 'AI Assistant',
    href: '/dashboard/ai',
    iconPath: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
  },
  {
    module: 'analytics',
    label: 'Analytics',
    href: '/dashboard/analytics',
    iconPath: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    module: 'admin',
    label: 'Admin',
    href: '/dashboard/admin',
    iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  },
  {
    module: 'audit_log',
    label: 'Audit Log',
    href: '/dashboard/audit',
    iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
]

// ─── Props ──────────────────────────────────────────────────────
interface SidebarProps {
  permissions: Record<string, ModulePermission>
  userDisplayName: string | null
  userRole: string | null
}

export default function Sidebar({ permissions, userDisplayName, userRole }: SidebarProps) {
  const pathname = usePathname()

  // Filter nav items: invisible RBAC — only render items where shouldRender=true
  const visibleItems = NAV_ITEMS.filter((item) => {
    const perm = permissions[item.module]
    return perm?.shouldRender === true
  })

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-800 bg-[#00050F]">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-800 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00E5FA]/10">
          <svg
            className="h-5 w-5 text-[#00E5FA]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <span className="text-sm font-semibold text-white tracking-wide">
          MissionPulse
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <li key={item.module}>
                <Link
                  href={item.href}
                  className={`
                    group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-[#00E5FA]/10 text-[#00E5FA]'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                    }
                  `}
                >
                  <svg
                    className={`h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-[#00E5FA]' : 'text-gray-500 group-hover:text-gray-400'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
                  </svg>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Settings link — always visible */}
      <div className="border-t border-gray-800 px-3 py-2">
        <Link
          href="/dashboard/settings"
          className={`
            group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
            ${
              pathname === '/dashboard/settings'
                ? 'bg-[#00E5FA]/10 text-[#00E5FA]'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
            }
          `}
        >
          <svg
            className={`h-5 w-5 flex-shrink-0 ${
              pathname === '/dashboard/settings' ? 'text-[#00E5FA]' : 'text-gray-500 group-hover:text-gray-400'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
          Settings
        </Link>
      </div>

      {/* User Footer */}
      <div className="border-t border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xs font-medium text-gray-300">
            {userDisplayName
              ? userDisplayName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : '??'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-200">
              {userDisplayName ?? 'Unknown User'}
            </p>
            <p className="truncate text-xs text-gray-500">
              {userRole?.replace(/_/g, ' ') ?? 'No role'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
