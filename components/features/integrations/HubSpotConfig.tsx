'use client'

import { useTransition } from 'react'
import { Link2, Link2Off, RefreshCw, ArrowLeftRight, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getAuthUrl, disconnectIntegration } from '@/app/(dashboard)/integrations/actions'

interface HubSpotConfigProps {
  isConnected: boolean
  isAvailable: boolean
  lastSync: string | null
  errorMessage: string | null
}

const FIELD_MAPPINGS = [
  { mp: 'Title', hs: 'Deal Name', direction: 'bidirectional' },
  { mp: 'Agency', hs: 'Company', direction: 'mp_to_hs' },
  { mp: 'Ceiling', hs: 'Amount', direction: 'bidirectional' },
  { mp: 'Shipley Phase', hs: 'Deal Stage', direction: 'mp_to_hs' },
  { mp: 'pWin', hs: 'Probability', direction: 'mp_to_hs' },
  { mp: 'Due Date', hs: 'Close Date', direction: 'bidirectional' },
  { mp: 'Status', hs: 'Deal Status', direction: 'mp_to_hs' },
  { mp: 'Contact Name', hs: 'Contact', direction: 'hs_to_mp' },
  { mp: 'Contact Email', hs: 'Contact Email', direction: 'hs_to_mp' },
]

export function HubSpotConfig({
  isConnected,
  isAvailable,
  lastSync,
  errorMessage,
}: HubSpotConfigProps) {
  const [isPending, startTransition] = useTransition()

  function handleConnect() {
    startTransition(async () => {
      const { url } = await getAuthUrl('hubspot')
      if (!url) return
      const popup = window.open(url, 'hubspot-oauth', 'width=600,height=700')
      if (!popup) window.location.href = url
    })
  }

  function handleDisconnect() {
    startTransition(async () => {
      await disconnectIntegration('hubspot')
      window.location.reload()
    })
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-sm font-bold bg-[#ff7a59]">
              HS
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                HubSpot CRM
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div
                  className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-gray-500'}`}
                />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>

          {isAvailable && (
            <Button
              variant={isConnected ? 'outline' : 'default'}
              onClick={isConnected ? handleDisconnect : handleConnect}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isConnected ? (
                <>
                  <Link2Off className="h-4 w-4" />
                  Disconnect
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Connect HubSpot
                </>
              )}
            </Button>
          )}
          {!isAvailable && !isConnected && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              Coming Soon
            </span>
          )}
        </div>

        {lastSync && (
          <p className="text-xs text-muted-foreground mt-3">
            Last synced:{' '}
            {new Date(lastSync).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}

        {errorMessage && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">Error: {errorMessage}</p>
        )}

      </div>

      {/* Sync Settings */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Sync Configuration
          </h3>
          {isConnected && (
            <Button variant="outline" size="sm">
              <RefreshCw className="h-3 w-3" />
              Manual Sync
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {['MissionPulse → HubSpot', 'HubSpot → MissionPulse', 'Bidirectional'].map(
            (dir) => (
              <label
                key={dir}
                className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/10"
              >
                <input
                  type="radio"
                  name="syncDirection"
                  value={dir}
                  defaultChecked={dir === 'Bidirectional'}
                  className="rounded-full border-border text-primary"
                  disabled={!isConnected}
                />
                <span className="text-xs text-foreground">{dir}</span>
              </label>
            )
          )}
        </div>
      </div>

      {/* Field Mapping */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Field Mapping
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            How MissionPulse fields map to HubSpot deal properties
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                  MissionPulse
                </th>
                <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground text-center">
                  Direction
                </th>
                <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                  HubSpot
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {FIELD_MAPPINGS.map((mapping) => (
                <tr key={mapping.mp} className="hover:bg-muted/10">
                  <td className="px-4 py-2 text-xs text-foreground">
                    {mapping.mp}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <ArrowLeftRight className="h-3 w-3 mx-auto text-muted-foreground" />
                  </td>
                  <td className="px-4 py-2 text-xs text-foreground">
                    {mapping.hs}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
