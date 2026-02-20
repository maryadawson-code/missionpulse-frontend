// FILE: components/dashboard/Sidebar.tsx
// SECURITY: NIST 800-53 Rev 5 CHECKED — Invisible RBAC
// Sprint 2 Fix: null-safe profile.role fallback, correct ModuleId types
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitBranch,
  Swords,
  Waves,
  FileSearch,
  Shield,
  Skull,
  DollarSign,
  UserCheck,
  Mic,
  BookOpen,
  Users,
  Rocket,
  Award,
  ClipboardList,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { ROLES as RBAC_CONFIG } from '@/lib/rbac/config';
import type { Profile, ModuleId } from '@/lib/supabase/types';

// ============================================================
// NAV ITEM DEFINITIONS
// ============================================================

interface NavItem {
  id: ModuleId;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  cuiBanner?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { id: 'pipeline', label: 'Pipeline', href: '/pipeline', icon: GitBranch },
  { id: 'war_room', label: 'War Room', href: '/war-room', icon: Swords },
  { id: 'swimlane', label: 'Swimlane', href: '/swimlane', icon: Waves },
  { id: 'rfp_shredder', label: 'RFP Shredder', href: '/rfp-shredder', icon: FileSearch },
  { id: 'contract_scanner', label: 'Contract Scanner', href: '/contract-scanner', icon: ClipboardList },
  { id: 'iron_dome', label: 'Iron Dome', href: '/compliance', icon: Shield },
  { id: 'black_hat', label: 'Black Hat', href: '/blackhat', icon: Skull, cuiBanner: 'CUI // OPSEC' },
  { id: 'pricing', label: 'Pricing', href: '/pricing', icon: DollarSign, cuiBanner: 'CUI // SP-PROPIN' },
  { id: 'hitl', label: 'Review Queue', href: '/hitl', icon: UserCheck },
  { id: 'orals', label: 'Orals Prep', href: '/orals', icon: Mic },
  { id: 'playbook', label: 'Playbook', href: '/playbook', icon: BookOpen },
  { id: 'frenemy', label: 'Frenemy Intel', href: '/frenemy', icon: Users },
  { id: 'launch', label: 'Launch', href: '/launch', icon: Rocket },
  { id: 'post_award', label: 'Post-Award', href: '/post-award', icon: Award },
  { id: 'agent_hub', label: 'Agent Hub', href: '/agent-hub', icon: Bot },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
];

// ============================================================
// SIDEBAR COMPONENT
// ============================================================

interface SidebarProps {
  profile: Profile | null;
  onSignOut?: () => void;
}

export default function Sidebar({ profile, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // FIX: Null-safe role access with 'Partner' fallback (lowest privilege)
  const userRole = profile?.role ?? 'Partner';
  const roleConfig = RBAC_CONFIG[userRole] ?? RBAC_CONFIG['partner'] ?? null;

  /**
   * Invisible RBAC: If the role config says shouldRender=false,
   * the nav item doesn't appear in the DOM at all.
   */
  const canSeeModule = (moduleId: string): boolean => {
    if (!roleConfig) return false;
    const moduleAccess = roleConfig.modules?.[moduleId as ModuleId];
    // If no config entry exists for this module, hide it (fail closed)
    if (!moduleAccess) return false;
    return moduleAccess.shouldRender && moduleAccess.canView;
  };

  const visibleItems = NAV_ITEMS.filter((item) => canSeeModule(item.id));

  return (
    <aside
      className={`flex flex-col h-screen transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      style={{ backgroundColor: '#0F172A', borderRight: '1px solid #1E293B' }}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-4">
        {!collapsed && (
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: '#00E5FA' }}
          >
            MissionPulse
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-white/5 transition-colors"
          style={{ color: '#94A3B8' }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'text-white'
                  : 'hover:bg-white/5'
              }`}
              style={{
                color: isActive ? '#00E5FA' : '#94A3B8',
                backgroundColor: isActive ? 'rgba(0, 229, 250, 0.08)' : undefined,
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {!collapsed && item.cuiBanner && (
                <span
                  className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}
                >
                  CUI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      {profile && (
        <div
          className="px-3 py-3 flex items-center gap-3"
          style={{ borderTop: '1px solid #1E293B' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: 'rgba(0, 229, 250, 0.15)', color: '#00E5FA' }}
          >
            {(profile.full_name ?? profile.email ?? '?')
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile.full_name ?? profile.email}
              </p>
              <p className="text-xs truncate" style={{ color: '#94A3B8' }}>
                {userRole}
              </p>
            </div>
          )}
          {!collapsed && onSignOut && (
            <button
              onClick={onSignOut}
              className="p-1.5 rounded hover:bg-white/5 transition-colors"
              style={{ color: '#94A3B8' }}
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
