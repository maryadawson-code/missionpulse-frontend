// filepath: app/(dashboard)/integrations/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { IntegrationCards, INTEGRATION_COUNT } from '@/components/features/integrations/IntegrationCards'

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
    return null
  }

  const { data: integrations, error } = await supabase
    .from('integrations')
    .select(
      'id, name, provider, status, last_sync, sync_frequency, error_message'
    )
    .order('name', { ascending: true })

  const items = integrations ?? []
  const connected = items.filter(
    (i) => i.status === 'active' || i.status === 'connected'
  )
  const errored = items.filter((i) => i.status === 'error')
  const healthStatus =
    errored.length > 0 ? 'degraded' : connected.length > 0 ? 'healthy' : 'idle'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage external service connections including SAM.gov, GovWin,
          HubSpot, and other data sources.
        </p>
      </div>

      {/* Health summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">System Health</p>
          <div className="flex items-center gap-2 mt-1">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                healthStatus === 'healthy' ? 'bg-emerald-400' :
                healthStatus === 'degraded' ? 'bg-yellow-400 animate-pulse' :
                'bg-gray-500'
              }`}
            />
            <span className="text-sm font-semibold capitalize">{healthStatus}</span>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Connected</p>
          <p className="text-2xl font-bold text-emerald-400">{connected.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Errors</p>
          <p className="text-2xl font-bold text-red-400">{errored.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Available</p>
          <p className="text-2xl font-bold">{INTEGRATION_COUNT}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-600 dark:text-red-400">
          Failed to load integrations: {error.message}
        </div>
      )}

      <IntegrationCards integrations={items} />
    </div>
  )
}
