import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { SamGovSearch } from '@/components/features/integrations/SamGovSearch'

export default async function SamGovPage() {
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
  if (!hasPermission(role, 'integrations', 'shouldRender')) {
    redirect('/')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">SAM.gov Integration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Search SAM.gov for federal opportunities and import them to your
          pipeline.
        </p>
      </div>

      <SamGovSearch />
    </div>
  )
}
