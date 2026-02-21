import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, getModulePermission } from '@/lib/rbac/config'
import { listJobs } from '@/lib/ai/fine-tune/job-manager'
import { FineTuneAdmin } from '@/components/features/admin/FineTuneAdmin'

export default async function FineTunePage() {
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

  // RBAC: executive only
  const effectiveRole = resolveRole(profile.role)
  const perm = getModulePermission(effectiveRole, 'admin')
  if (!perm || !perm.canView) redirect('/')

  const executiveRoles = ['executive', 'admin', 'CEO', 'COO']
  if (!executiveRoles.includes(effectiveRole)) redirect('/')

  const jobs = await listJobs(profile.company_id ?? '')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Model Fine-tuning</h1>
        <p className="text-sm text-gray-400 mt-1">
          Train custom AI models using your accepted proposal outputs.
        </p>
      </div>

      <FineTuneAdmin
        userId={profile.id}
        companyId={profile.company_id ?? ''}
        initialJobs={JSON.parse(JSON.stringify(jobs))}
      />
    </div>
  )
}
