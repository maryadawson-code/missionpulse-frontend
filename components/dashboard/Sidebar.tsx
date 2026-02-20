'use client'

/**
 * Sidebar — RBAC-filtered navigation
 * Invisible RBAC: items with shouldRender=false don't appear
 * © 2026 Mission Meets Tech
 */
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Profile } from '@/lib/supabase/types'
import { ROLE_TO_CONFIG, type ModuleId } from '@/lib/supabase/types'
import { ROLES as RBAC_CONFIG } from '@/lib/rbac/config'

interface NavItem {
  id: ModuleId
  label: string
  href: string
  icon: string
  group: string
  cuiMarking?: string
}

const NAV_ITEMS: NavItem[] = [
  // Core Operations
  { id: 'pipeline', label: 'Pipeline', href: '/pipeline', icon: '🎯', group: 'Core Operations' },
  { id: 'war_room', label: 'War Room', href: '/pipeline', icon: '⚔️', group: 'Core Operations' },
  { id: 'swimlane', label: 'Swimlane', href: '/swimlane', icon: '🏊', group: 'Core Operations' },
  // Capture & Strategy
  { id: 'rfp_shredder', label: 'RFP Shredder', href: '/rfp-shredder', icon: '📄', group: 'Capture & Strategy' },
  { id: 'black_hat', label: 'Black Hat', href: '/black-hat', icon: '🎩', group: 'Capture & Strategy' },
  // Compliance & Contracts
  { id: 'iron_dome', label: 'Iron Dome', href: '/iron-dome', icon: '🛡️', group: 'Compliance & Contracts' },
  { id: 'contract_scanner', label: 'Contract Scanner', href: '/contract-scanner', icon: '📑', group: 'Compliance & Contracts' },
  // Pricing
  { id: 'pricing', label: 'Pricing Engine', href: '/pricing', icon: '💰', group: 'Pricing', cuiMarking: 'CUI' },
  // Review & Delivery
  { id: 'hitl', label: 'HITL Review', href: '/hitl', icon: '👤', group: 'Review & Delivery' },
  { id: 'orals', label: 'Orals Studio', href: '/orals', icon: '🎤', group: 'Review & Delivery' },
  // Teaming
  { id: 'frenemy', label: 'Teaming / Frenemy', href: '/teaming', icon: '🤝', group: 'Teaming & Partners' },
  // Intelligence
  { id: 'agent_hub', label: 'Agent Hub', href: '/agent-hub', icon: '🤖', group: 'Intelligence' },
  { id: 'playbook', label: 'Lessons Playbook', href: '/playbook', icon: '📖', group: 'Intelligence' },
  // Launch & Post-Award
  { id: 'launch', label: 'Launch & ROI', href: '/launch', icon: '🚀', group: 'Launch & Post-Award' },
  { id: 'post_award', label: 'Post-Award', href: '/post-award', icon: '📦', group: 'Launch & Post-Award' },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const roleKey = ROLE_TO_CONFIG[profile.role] || 'viewer'
  const roleConfig = RBAC_CONFIG[roleKey]

  // Filter nav items by RBAC shouldRender
  const visibleItems = NAV_ITEMS.filter((item) => {
    const perm = roleConfig?.modules?.[item.id]
    return perm?.shouldRender !== false
  })

  // Group items
  const groups = visibleItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  return (
    <aside
      className={`flex flex-col border-r border-white/10 bg-[#000A1A] transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00E5FA] to-[#0099AA]">
              <span className="text-sm font-bold text-[#00050F]">MP</span>
            </div>
            <span className="text-sm font-semibold text-white">MissionPulse</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {group}
              </p>
            )}
            {items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`mx-2 mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-[#00E5FA]/10 text-[#00E5FA]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!collapsed && item.cuiMarking && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                      {item.cuiMarking}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        {!collapsed && (
          <p className="text-[10px] text-slate-500">
            MissionPulse v2.0 · CMMC L2
          </p>
        )}
      </div>
    </aside>
  )
}
