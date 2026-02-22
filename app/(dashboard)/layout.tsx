// filepath: app/(dashboard)/layout.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRolePermissions, isInternalRole } from '@/lib/rbac/config'
import { getRecentActivity } from '@/lib/actions/audit'
import Sidebar from '@/components/layout/Sidebar'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { PartnerWatermark } from '@/components/layout/PartnerWatermark'
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

  // ─── Recent Activity for Notifications ────────────────────
  let notifications: { id: string; action: string; user_name: string | null; timestamp: string | null }[] = []
  try {
    const { data: recentActivity } = await getRecentActivity(5)
    notifications = (recentActivity ?? []).map((a) => ({
      id: a.id,
      action: a.action,
      user_name: a.user_name,
      timestamp: a.timestamp,
    }))
  } catch {
    // Non-critical — continue without notifications
  }

  const isExternal = !isInternalRole(userRole)
  const companyName = profile?.full_name ?? user.email ?? 'External User'

  return (
    <div className="flex h-screen overflow-hidden bg-[#00050F] text-gray-100">
      {/* Watermark overlay for external roles */}
      {isExternal && <PartnerWatermark companyName={companyName} />}

      {/* Sidebar — RBAC-filtered navigation */}
      <Sidebar
        permissions={permissions}
        userDisplayName={profile?.full_name ?? user.email ?? null}
        userRole={userRole}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader userEmail={user.email ?? null} notifications={notifications} />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
