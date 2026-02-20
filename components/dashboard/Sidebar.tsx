// filepath: components/dashboard/Sidebar.tsx
'use client'

import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: string // Simple emoji/symbol for now — swap for Lucide later
  module: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: '◉', module: 'dashboard' },
  { label: 'Pipeline', href: '/pipeline', icon: '⬡', module: 'pipeline' },
  { label: 'Compliance', href: '/compliance', icon: '🛡', module: 'compliance' },
  { label: 'Pricing', href: '/pricing', icon: '💲', module: 'pricing' },
  { label: 'Black Hat', href: '/blackhat', icon: '🎯', module: 'blackhat' },
  { label: 'Admin', href: '/admin', icon: '⚙', module: 'admin' },
  { label: 'Settings', href: '/settings', icon: '⋯', module: 'settings' },
]

interface SidebarProps {
  /** Modules this role is allowed to see (from RBAC config) */
  allowedModules: string[]
  isMobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({
  allowedModules,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname()

  // Invisible RBAC: only render nav items the user's role allows
  const visibleItems = NAV_ITEMS.filter((item) =>
    allowedModules.includes(item.module)
  )

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan/10">
          <span className="text-cyan font-bold text-sm">MP</span>
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">
            MissionPulse
          </p>
          <p className="text-[10px] text-slate leading-tight">
            Mission Meets Tech
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

          return (
            <a
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-cyan/10 text-white font-medium'
                  : 'text-slate hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="w-5 text-center text-xs">{item.icon}</span>
              {item.label}
            </a>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-[10px] text-slate-600">
          Mission. Technology. Transformation.
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-navy">
        {navContent}
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={onCloseMobile}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-56 bg-navy border-r border-border lg:hidden">
            {navContent}
          </aside>
        </>
      )}
    </>
  )
}
