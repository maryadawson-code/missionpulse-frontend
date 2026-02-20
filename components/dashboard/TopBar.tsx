// filepath: components/dashboard/TopBar.tsx
'use client'

import { usePathname } from 'next/navigation'

interface TopBarProps {
  userName: string | null
  userEmail: string
  avatarUrl: string | null
  onToggleMobile: () => void
}

function generateBreadcrumbs(pathname: string): Array<{ label: string; href: string }> {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: Array<{ label: string; href: string }> = [
    { label: 'Dashboard', href: '/' },
  ]

  const labelMap: Record<string, string> = {
    pipeline: 'Pipeline',
    'war-room': 'War Room',
    compliance: 'Compliance',
    pricing: 'Pricing',
    blackhat: 'Black Hat',
    admin: 'Admin',
    settings: 'Settings',
    new: 'New',
    edit: 'Edit',
  }

  let path = ''
  for (const segment of segments) {
    path += `/${segment}`
    const label = labelMap[segment] ?? segment
    // Skip UUID-looking segments in display but keep in href
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        segment
      )
    crumbs.push({
      label: isUuid ? 'Detail' : label,
      href: path,
    })
  }

  return crumbs
}

export function TopBar({
  userName,
  userEmail,
  avatarUrl,
  onToggleMobile,
}: TopBarProps) {
  const pathname = usePathname()
  const breadcrumbs = generateBreadcrumbs(pathname)
  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : userEmail.slice(0, 2).toUpperCase()

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:px-6">
      {/* Left: hamburger + breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onToggleMobile}
          className="lg:hidden rounded-md p-1.5 text-slate hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Toggle navigation"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden sm:block">
          <ol className="flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, idx) => (
              <li key={crumb.href} className="flex items-center gap-1.5">
                {idx > 0 && <span className="text-slate-600">/</span>}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-white font-medium">{crumb.label}</span>
                ) : (
                  <a
                    href={crumb.href}
                    className="text-slate hover:text-white transition-colors"
                  >
                    {crumb.label}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Mobile: just show current page */}
        <span className="sm:hidden text-sm font-medium text-white">
          {breadcrumbs[breadcrumbs.length - 1]?.label ?? 'Dashboard'}
        </span>
      </div>

      {/* Right: user avatar */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white leading-tight">
            {userName ?? userEmail}
          </p>
          {userName && (
            <p className="text-xs text-slate leading-tight">{userEmail}</p>
          )}
        </div>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={userName ?? userEmail}
            className="h-8 w-8 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-cyan/10 text-xs font-semibold text-cyan">
            {initials}
          </div>
        )}
      </div>
    </header>
  )
}
