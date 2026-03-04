// filepath: app/(dashboard)/admin/roles/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { CustomRoleBuilder } from '@/components/features/admin/CustomRoleBuilder'

export default async function CustomRolesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'admin', 'canEdit')) redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Custom Roles</h1>
        <p className="text-sm text-muted-foreground">
          Create custom roles with granular module-level permissions. Enterprise plan required.
        </p>
      </div>
      <CustomRoleBuilder companyId={profile?.company_id ?? ''} />
    </div>
  )
}
