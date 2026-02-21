// filepath: app/(dashboard)/integrations/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusColor(status: string | null): string {
  switch (status) {
    case 'active':
    case 'connected':
      return 'bg-emerald-500/20 text-emerald-300'
    case 'syncing':
      return 'bg-blue-500/20 text-blue-300'
    case 'error':
    case 'failed':
      return 'bg-red-500/20 text-red-300'
    case 'disabled':
    case 'inactive':
      return 'bg-gray-500/20 text-gray-400'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

export default async function IntegrationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
    .select('id, name, provider, status, last_sync, sync_frequency, error_message, created_at')
    .order('name', { ascending: true })

  const items = integrations ?? []
  const activeCount = items.filter((i) => i.status === 'active' || i.status === 'connected').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage external service connections including SAM.gov, GovWin, HubSpot, and other data sources.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load integrations: {error.message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Provider</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Last Sync</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Frequency</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    No integrations configured. Connect external services to sync pipeline data automatically.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-200">
                      {item.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {item.provider}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(item.status)}`}>
                        {(item.status ?? 'inactive').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {formatDate(item.last_sync)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {(item.sync_frequency ?? 'manual').replace(/_/g, ' ')}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-red-400/70" title={item.error_message ?? ''}>
                      {item.error_message ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        {activeCount} active integration{activeCount !== 1 ? 's' : ''} of {items.length} configured.
      </p>
    </div>
  )
}
