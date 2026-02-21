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
    href: '/',
    iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4',
  },
  {
    module: 'pipeline',
    label: 'Pipeline',
    href: '/pipeline',
    iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    module: 'proposals',
    label: 'Proposals',
    href: '/proposals',
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    module: 'pricing',
    label: 'Pricing',
    href: '/pricing',
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    module: 'strategy',
    label: 'Strategy',
    href: '/strategy',
    iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  },
  {
    module: 'blackhat',
    label: 'Black Hat',
    href: '/blackhat',
    iconPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  {
    module: 'compliance',
    label: 'Compliance',
    href: '/compliance',
    iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    module: 'personnel',
    label: 'Personnel',
    href: '/personnel',
    iconPath: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  },
  {
    module: 'workflow_board',
    label: 'Workflow',
    href: '/workflow',
    iconPath: 'M4 6h16M4 10h16M4 14h16M4 18h16',
  },
  {
    module: 'documents',
    label: 'Documents',
    href: '/documents',
    iconPath: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z',
  },
  {
    module: 'documents',
    label: 'Playbook',
    href: '/playbook',
    iconPath: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    module: 'ai_chat',
    label: 'AI Assistant',
    href: '/ai',
    iconPath: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
  },
  {
    module: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    iconPath: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    module: 'admin',
    label: 'Admin',
    href: '/admin',
    iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  },
  {
    module: 'audit_log',
    label: 'Audit Log',
    href: '/audit',
    iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    module: 'integrations',
    label: 'Integrations',
    href: '/integrations',
    iconPath: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-6.364-6.364L4.5 8.257m9 4.5l1.757-1.757',
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
              (item.href !== '/' && pathname.startsWith(item.href))

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
          href="/settings"
          className={`
            group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
            ${
              pathname === '/settings'
                ? 'bg-[#00E5FA]/10 text-[#00E5FA]'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
            }
          `}
        >
          <svg
            className={`h-5 w-5 flex-shrink-0 ${
              pathname === '/settings' ? 'text-[#00E5FA]' : 'text-gray-500 group-hover:text-gray-400'
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
