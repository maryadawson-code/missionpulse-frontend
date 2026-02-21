import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole } from '@/lib/rbac/config'
import { getModulePermission } from '@/lib/rbac/config'
import { ImportWizard } from '@/components/features/settings/ImportWizard'

export default async function ImportPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // RBAC: require admin module access for data import
  const effectiveRole = resolveRole(profile.role)
  const perm = getModulePermission(effectiveRole, 'admin')
  if (!perm || !perm.canView) redirect('/')

  const canImport = ['admin', 'executive', 'operations', 'CEO', 'COO'].includes(effectiveRole)

  if (!canImport) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Data Import</h1>
        <div className="rounded-xl border border-red-900/50 bg-red-900/10 p-6 text-center">
          <p className="text-red-400">You do not have permission to import data.</p>
          <p className="mt-1 text-sm text-gray-500">
            Contact your administrator to request import access.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Data Import</h1>
        <p className="text-sm text-gray-400 mt-1">
          Import opportunities, contacts, and past performance from CSV or Excel files.
        </p>
      </div>

      <ImportWizard
        userId={profile.id}
        companyId={profile.company_id ?? ''}
      />
    </div>
  )
}
