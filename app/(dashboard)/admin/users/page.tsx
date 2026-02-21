import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { UserManagement } from '@/components/features/admin/UserManagement'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'admin', 'canView')) {
    redirect('/')
  }

  const { data: users } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, role, company, status, last_login, created_at'
    )
    .order('created_at', { ascending: false })

  const { data: invitations } = await supabase
    .from('user_invitations')
    .select('id, email, full_name, role, status, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Invite users, assign roles, and manage access across your
          organization.
        </p>
      </div>

      <UserManagement
        users={users ?? []}
        invitations={invitations ?? []}
      />
    </div>
  )
}
