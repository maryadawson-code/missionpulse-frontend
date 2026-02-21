// filepath: app/(dashboard)/audit/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { getRecentActivity } from '@/lib/actions/audit'

function formatTimestamp(ts: string | null): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function AuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'audit_log', 'shouldRender')) {
    redirect('/')
  }

  const { data: activities, error } = await getRecentActivity(50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="mt-1 text-sm text-gray-500">
          System activity, user actions, and change history for security and compliance auditing.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load audit log: {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Action
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    No audit records found
                  </td>
                </tr>
              ) : (
                activities.map((item) => {
                  const details = item.details as Record<string, unknown> | null
                  const detailStr = details
                    ? Object.entries(details)
                        .filter(([k]) => !['user_id', 'resource_type'].includes(k))
                        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
                        .join(', ')
                    : '—'

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-gray-800/30">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                        {formatTimestamp(item.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-200">
                        {item.user_name ?? 'System'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                          {(item.user_role ?? 'unknown').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {formatAction(item.action)}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-xs text-gray-500" title={detailStr}>
                        {detailStr}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Showing {activities.length} most recent records. Audit logs are immutable per NIST 800-53 AU-9.
      </p>
    </div>
  )
}
