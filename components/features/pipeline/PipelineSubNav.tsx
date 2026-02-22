'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePermissions } from '@/lib/rbac/RoleContext'

interface SubNavItem {
  href: string
  label: string
  module: string
  permission: 'shouldRender' | 'canView'
}

export function PipelineSubNav({ opportunityId }: { opportunityId: string }) {
  const pathname = usePathname()
  const { permissions } = usePermissions()

  const basePath = `/pipeline/${opportunityId}`

  const items: SubNavItem[] = [
    { href: basePath, label: 'Overview', module: 'pipeline', permission: 'canView' },
    { href: `${basePath}/compliance`, label: 'Compliance', module: 'compliance', permission: 'shouldRender' },
    { href: `${basePath}/contracts`, label: 'Contracts', module: 'compliance', permission: 'shouldRender' },
    { href: `${basePath}/shredder`, label: 'Shredder', module: 'compliance', permission: 'shouldRender' },
    { href: `${basePath}/strategy`, label: 'Strategy', module: 'strategy', permission: 'shouldRender' },
    { href: `${basePath}/pricing`, label: 'Pricing', module: 'pricing', permission: 'shouldRender' },
    { href: `${basePath}/swimlane`, label: 'Swimlane', module: 'proposals', permission: 'shouldRender' },
    { href: `${basePath}/documents`, label: 'Documents', module: 'documents', permission: 'shouldRender' },
    { href: `${basePath}/team`, label: 'Team', module: 'pipeline', permission: 'canView' },
    { href: `${basePath}/launch`, label: 'Launch', module: 'proposals', permission: 'shouldRender' },
    { href: `${basePath}/orals`, label: 'Orals', module: 'proposals', permission: 'shouldRender' },
    { href: `${basePath}/intel`, label: 'Intel', module: 'pipeline', permission: 'canView' },
    { href: `${basePath}/risks`, label: 'Risks', module: 'pipeline', permission: 'canView' },
    { href: `${basePath}/volumes`, label: 'Volumes', module: 'proposals', permission: 'shouldRender' },
    { href: `${basePath}/qa`, label: 'Q&A', module: 'proposals', permission: 'shouldRender' },
    { href: `${basePath}/amendments`, label: 'Amendments', module: 'compliance', permission: 'shouldRender' },
    { href: `${basePath}/gate-reviews`, label: 'Gates', module: 'pipeline', permission: 'canView' },
  ]

  const visibleItems = items.filter(
    (item) => permissions[item.module]?.[item.permission] === true
  )

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-1">
      {visibleItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
