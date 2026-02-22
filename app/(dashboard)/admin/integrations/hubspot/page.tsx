import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

export default async function HubSpotMappingsPage() {
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
  if (!hasPermission(role, 'admin', 'canView')) return null

  const { data: mappings } = await supabase
    .from('hubspot_field_mappings')
    .select(
      'id, missionpulse_field, hubspot_field, direction, transform_type, is_active, created_at'
    )
    .order('missionpulse_field', { ascending: true })

  // Fetch sync logs
  const { data: syncLogs } = await supabase
    .from('hubspot_sync_log')
    .select('id, sync_direction, sync_status, error_message, hubspot_deal_id, opportunity_id, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  const mappingItems = mappings ?? []
  const logItems = syncLogs ?? []

  const activeMappings = mappingItems.filter((m) => m.is_active === true).length
  const inbound = mappingItems.filter((m) => m.direction === 'inbound').length
  const outbound = mappingItems.filter((m) => m.direction === 'outbound').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">HubSpot Integration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure field mappings between MissionPulse and HubSpot CRM.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Total Mappings</p>
          <p className="mt-1 text-lg font-bold text-white">
            {mappingItems.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Active</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">
            {activeMappings}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Inbound</p>
          <p className="mt-1 text-lg font-bold text-blue-400">{inbound}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Outbound</p>
          <p className="mt-1 text-lg font-bold text-amber-400">{outbound}</p>
        </div>
      </div>

      {/* Field Mappings */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Field Mappings
        </h2>
        {mappingItems.length === 0 ? (
          <div className="rounded-lg border border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No field mappings configured.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/80">
                  <th className="px-3 py-2 text-left font-medium text-gray-400">
                    MissionPulse Field
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-400">
                    Direction
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-400">
                    HubSpot Field
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-400">
                    Transform
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-400">
                    Active
                  </th>
                </tr>
              </thead>
              <tbody>
                {mappingItems.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/20"
                  >
                    <td className="px-3 py-2 font-mono text-sm text-white">
                      {m.missionpulse_field}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          m.direction === 'inbound'
                            ? 'bg-blue-500/15 text-blue-300'
                            : m.direction === 'outbound'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {m.direction === 'inbound'
                          ? 'HS → MP'
                          : m.direction === 'outbound'
                            ? 'MP → HS'
                            : 'Bidirectional'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-sm text-gray-300">
                      {m.hubspot_field}
                    </td>
                    <td className="px-3 py-2 text-gray-400">
                      {m.transform_type ?? 'direct'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          m.is_active ? 'bg-emerald-400' : 'bg-gray-600'
                        }`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sync Logs */}
      {logItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Recent Sync Logs
          </h2>
          <div className="divide-y divide-gray-800 rounded-xl border border-gray-800 bg-gray-900/50">
            {logItems.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      log.sync_status === 'success'
                        ? 'bg-emerald-400'
                        : log.sync_status === 'failed'
                          ? 'bg-red-400'
                          : 'bg-amber-400'
                    }`}
                  />
                  <div>
                    <p className="text-sm text-white">
                      {log.sync_direction ?? 'Sync'}
                    </p>
                    {log.error_message && (
                      <p className="text-[10px] text-red-400">
                        {log.error_message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-500">
                  {log.hubspot_deal_id && (
                    <span>Deal: {log.hubspot_deal_id}</span>
                  )}
                  {log.created_at && (
                    <span>
                      {new Date(log.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
