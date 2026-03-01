// filepath: components/layout/Sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { RBACModule, ModulePermission } from '@/lib/types'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

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
    href: '/pipeline',
    iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    module: 'compliance',
    label: 'RFP Shredder',
    href: '/shredder',
    iconPath: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  },
  {
    module: 'pipeline',
    label: 'War Room',
    href: '/war-room',
    iconPath: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
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
    href: '/ai-chat',
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

// ─── Section Grouping ───────────────────────────────────────────
const PRIMARY_MODULES = ['dashboard', 'pipeline', 'proposals', 'workflow_board', 'ai_chat', 'documents']
const _RESOURCES_MODULES = ['_resources']
const ADMIN_MODULES = ['admin', 'integrations', 'audit_log']
// Everything else (strategy, blackhat, compliance, pricing, analytics, personnel, playbook) is secondary

// ─── CUI / Sensitivity Badges ───────────────────────────────────
const CUI_BADGES: Record<string, { label: string; color: string }> = {
  pricing: { label: 'CUI', color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  blackhat: { label: 'Private', color: 'bg-red-500/20 text-red-600 dark:text-red-400' },
}

// ─── Props ──────────────────────────────────────────────────────
interface SidebarProps {
  permissions: Record<string, ModulePermission>
  userDisplayName: string | null
  userRole: string | null
  unreadNotifications?: number
}

export default function Sidebar({ permissions, userDisplayName, userRole, unreadNotifications = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Filter nav items: invisible RBAC — only render items where shouldRender=true
  const visibleItems = NAV_ITEMS.filter((item) => {
    const perm = permissions[item.module]
    return perm?.shouldRender === true
  })

  // Split into section groups
  // Playbook shares the 'documents' module but belongs in secondary
  const primary = visibleItems.filter(
    (i) => (PRIMARY_MODULES.includes(i.module) || i.href === '/shredder') && i.href !== '/playbook'
  )
  const secondary = visibleItems.filter(
    (i) =>
      ((!PRIMARY_MODULES.includes(i.module) && !ADMIN_MODULES.includes(i.module)) ||
      i.href === '/playbook') && i.href !== '/shredder'
  )
  const admin = visibleItems.filter((i) => ADMIN_MODULES.includes(i.module))

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background lg:hidden"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

    <aside className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-border bg-background transition-transform lg:static lg:translate-x-0 ${
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    }`}>
      {/* Logo / Brand */}
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <svg
            className="h-5 w-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <span className="text-sm font-semibold text-foreground tracking-wide">
          MissionPulse
        </span>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded p-1 text-muted-foreground hover:text-foreground lg:hidden"
          aria-label="Close menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <ul className="space-y-1">
          {/* Primary section */}
          {primary.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))
            const badge = CUI_BADGES[item.module]

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`
                    group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                >
                  <svg
                    className={`h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
                  </svg>
                  {item.label}
                  {badge && (
                    <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}

          {/* Secondary (Analysis) section */}
          {secondary.length > 0 && (
            <li className="px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Analysis</span>
            </li>
          )}
          {secondary.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))
            const badge = CUI_BADGES[item.module]

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`
                    group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                >
                  <svg
                    className={`h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
                  </svg>
                  {item.label}
                  {badge && (
                    <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}

          {/* Resources section — visible if pipeline is visible */}
          {permissions['pipeline']?.shouldRender && (
            <li className="px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resources</span>
            </li>
          )}
          {permissions['pipeline']?.shouldRender && [
            { href: '/debriefs', label: 'Debriefs', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { href: '/reports', label: 'Reports', iconPath: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { href: '/win-loss', label: 'Win/Loss', iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            { href: '/capacity', label: 'Capacity', iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
            { href: '/subcontractors', label: 'Subcontractors', iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
            { href: '/partners', label: 'Partners', iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { href: '/past-performance', label: 'Past Perf.', iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
            { href: '/feedback', label: 'Feedback', iconPath: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
          ].map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`
                    group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                >
                  <svg
                    className={`h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
                  </svg>
                  {item.label}
                </Link>
              </li>
            )
          })}

          {/* Admin section */}
          {admin.length > 0 && (
            <li className="px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Admin</span>
            </li>
          )}
          {admin.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))
            const badge = CUI_BADGES[item.module]

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`
                    group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                >
                  <svg
                    className={`h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
                  </svg>
                  {item.label}
                  {badge && (
                    <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom links — Notifications + Settings */}
      <div className="border-t border-border px-3 py-2 space-y-1">
        <Link
          href="/notifications"
          aria-current={pathname === '/notifications' ? 'page' : undefined}
          className={`
            group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
            ${
              pathname === '/notifications'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }
          `}
        >
          <svg
            className={`h-5 w-5 flex-shrink-0 ${
              pathname === '/notifications' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          Notifications
          {unreadNotifications > 0 && (
            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {unreadNotifications > 99 ? '99+' : unreadNotifications}
            </span>
          )}
        </Link>
        <Link
          href="/settings"
          aria-current={pathname === '/settings' ? 'page' : undefined}
          className={`
            group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
            ${
              pathname === '/settings'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }
          `}
        >
          <svg
            className={`h-5 w-5 flex-shrink-0 ${
              pathname === '/settings' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
          Settings
        </Link>
        <Link
          href="/help"
          aria-current={pathname === '/help' ? 'page' : undefined}
          className={`
            group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
            ${
              pathname === '/help'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }
          `}
        >
          <svg
            className={`h-5 w-5 flex-shrink-0 ${
              pathname === '/help' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          Help
        </Link>
      </div>

      {/* User Footer */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">
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
            <p className="truncate text-sm font-medium text-foreground">
              {userDisplayName ?? 'Unknown User'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {userRole?.replace(/_/g, ' ') ?? 'No role'}
            </p>
          </div>
          <ThemeToggle />
          <button
            onClick={async () => {
              const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
              )
              await supabase.auth.signOut()
              router.push('/login')
              router.refresh()
            }}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-red-600 dark:text-red-400"
            title="Sign out"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
    </>
  )
}
