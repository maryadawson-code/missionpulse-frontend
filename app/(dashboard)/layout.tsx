// filepath: app/(dashboard)/layout.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRolePermissions } from '@/lib/rbac/config'
import Sidebar from '@/components/layout/Sidebar'
import DashboardHeader from '@/components/layout/DashboardHeader'
import type { ModulePermission } from '@/lib/types'


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

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
  // getRolePermissions reads roles_permissions_config.json and returns
  // the module permissions for the given role.
  // This function is expected from Sprint 2's lib/rbac/config.ts.
  const permissions: Record<string, ModulePermission> = getRolePermissions(userRole)

  return (
    <div className="flex h-screen overflow-hidden bg-[#00050F] text-gray-100">
      {/* Sidebar — RBAC-filtered navigation */}
      <Sidebar
        permissions={permissions}
        userDisplayName={profile?.full_name ?? user.email ?? null}
        userRole={userRole}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader userEmail={user.email ?? null} />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
