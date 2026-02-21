// filepath: app/(dashboard)/integrations/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { IntegrationCards } from '@/components/features/integrations/IntegrationCards'

export default async function IntegrationsPage() {
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

  const { data: integrations, error } = await supabase
    .from('integrations')
    .select(
      'id, name, provider, status, last_sync, sync_frequency, error_message'
    )
    .order('name', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage external service connections including SAM.gov, GovWin,
          HubSpot, and other data sources.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load integrations: {error.message}
        </div>
      )}

      <IntegrationCards integrations={integrations ?? []} />
    </div>
  )
}
