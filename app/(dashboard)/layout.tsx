// filepath: app/(dashboard)/layout.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getRolePermissions,
  isInternalRole,
  hasForceCUIWatermark,
  getClassificationCeiling,
  getRoleDisplayName,
  getSessionTimeout,
} from '@/lib/rbac/config'
import Sidebar from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { PartnerWatermark } from '@/components/layout/PartnerWatermark'
import { CUIBanner } from '@/components/rbac/CUIBanner'
import { RoleProvider } from '@/lib/rbac/RoleContext'
import { SessionTimeoutGuard } from '@/components/layout/SessionTimeoutGuard'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { KeyboardShortcuts } from '@/components/layout/KeyboardShortcuts'
import { SkipNav } from '@/components/layout/SkipNav'
import type { ModulePermission } from '@/lib/types'


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  // ─── Auth Gate ──────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // ─── Profile + Role Resolution ──────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, company_id')
    .eq('id', user.id)
    .single()

  // Default to 'partner' (most restrictive) if no profile or role found
  const userRole = profile?.role ?? 'partner'

  // ─── RBAC Permission Resolution ─────────────────────────────
  let permissions: Record<string, ModulePermission> = {}
  try {
    permissions = getRolePermissions(userRole)
  } catch {
    // Fallback: deny all if RBAC config fails
    const modules = ['dashboard','pipeline','proposals','pricing','strategy','blackhat','compliance','workflow_board','ai_chat','documents','analytics','admin','integrations','audit_log','personnel']
    for (const m of modules) permissions[m] = { shouldRender: false, canView: false, canEdit: false }
    permissions.dashboard = { shouldRender: true, canView: true, canEdit: false }
  }

  // ─── User Notifications for Header Dropdown + Sidebar Badge ──
  let headerNotifications: {
    id: string
    title: string
    message: string | null
    notification_type: string
    priority: string | null
    is_read: boolean
    link_url: string | null
    link_text: string | null
    created_at: string | null
  }[] = []
  let unreadNotifications = 0
  try {
    const { data: notifRows } = await supabase
      .from('notifications')
      .select('id, title, message, notification_type, priority, is_read, link_url, link_text, created_at')
      .eq('user_id', user.id)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(10)

    headerNotifications = (notifRows ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      notification_type: n.notification_type,
      priority: n.priority,
      is_read: n.is_read ?? false,
      link_url: n.link_url,
      link_text: n.link_text,
      created_at: n.created_at,
    }))
    unreadNotifications = headerNotifications.filter((n) => !n.is_read).length
  } catch {
    // Non-critical
  }

  const isExternal = !isInternalRole(userRole)
  const companyName = profile?.full_name ?? user.email ?? 'External User'
  const forceCUI = hasForceCUIWatermark(userRole)
  const classificationCeiling = getClassificationCeiling(userRole)
  const sessionTimeout = getSessionTimeout(userRole)

  // Determine CUI marking type for global banner
  const cuiMarking: 'SP-PROPIN' | 'SP-PRVCY' | null = forceCUI
    ? classificationCeiling.includes('PRVCY')
      ? 'SP-PRVCY'
      : 'SP-PROPIN'
    : null

  // RoleContext value — shared with all client children
  const roleContextValue = {
    role: userRole,
    permissions,
    displayName: getRoleDisplayName(userRole),
    isExternal,
    forceCUIWatermark: forceCUI,
    classificationCeiling,
  }

  return (
    <RoleProvider value={roleContextValue}>
      <SkipNav />
      <SessionTimeoutGuard timeoutSeconds={sessionTimeout} />
      <GlobalSearch />
      <KeyboardShortcuts />
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        {/* Watermark overlay for external roles or CUI-forced roles */}
        {(isExternal || forceCUI) && <PartnerWatermark companyName={companyName} />}

        {/* Sidebar — desktop: always visible; mobile: hidden */}
        <aside className="hidden lg:flex" aria-label="Main navigation">
          <Sidebar
            permissions={permissions}
            userDisplayName={profile?.full_name ?? user.email ?? null}
            userRole={userRole}
            unreadNotifications={unreadNotifications}
          />
        </aside>

        {/* Mobile nav drawer (hidden on desktop) */}
        <MobileNav>
          <Sidebar
            permissions={permissions}
            userDisplayName={profile?.full_name ?? user.email ?? null}
            userRole={userRole}
            unreadNotifications={unreadNotifications}
          />
        </MobileNav>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader userEmail={user.email ?? null} notifications={headerNotifications} />

          <main id="main-content" className="flex-1 overflow-y-auto p-6">
            {/* Global CUI banner for forceCUIWatermark roles */}
            {cuiMarking && <CUIBanner marking={cuiMarking} className="mb-4" />}
            {children}
          </main>
        </div>
      </div>
    </RoleProvider>
  )
}
