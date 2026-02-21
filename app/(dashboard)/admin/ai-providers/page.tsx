import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { ProviderConfig } from '@/components/features/admin/ProviderConfig'

export default async function AIProvidersPage() {
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
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">AI Providers</h1>
        <p className="mt-1 text-sm text-gray-400">
          Configure and monitor AI provider connections. CUI-classified requests
          are automatically routed to FedRAMP-authorized providers.
        </p>
      </div>

      <ProviderConfig />
    </div>
  )
}
