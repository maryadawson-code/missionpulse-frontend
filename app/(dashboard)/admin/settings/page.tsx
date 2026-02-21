import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { CompanySettings } from '@/components/features/admin/CompanySettings'

export default async function AdminSettingsPage() {
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
  if (!hasPermission(role, 'admin', 'canView')) {
    redirect('/dashboard')
  }

  let company = null
  if (profile?.company_id) {
    const { data } = await supabase
      .from('companies')
      .select('id, name, domain, primary_color, subscription_tier')
      .eq('id', profile.company_id)
      .single()
    company = data
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Company Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your organization profile and branding.
        </p>
      </div>

      <CompanySettings company={company} />
    </div>
  )
}
