// filepath: app/(dashboard)/admin/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { AdminUserList } from '@/components/modules/AdminUserList'

export default async function AdminPage() {
  const supabase = await createClient()

  // Auth + RBAC gate
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'partner'
  const resolved = resolveRole(role)

  // Invisible RBAC — redirect if not admin
  if (!hasPermission(resolved, 'admin', 'canView')) {
    redirect('/')
  }

  // Fetch all users (admin has elevated access via RLS)
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, company, status, last_login, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Console</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage users and system settings
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load users: {error.message}
        </div>
      )}

      <AdminUserList users={users ?? []} />
    </div>
  )
}
