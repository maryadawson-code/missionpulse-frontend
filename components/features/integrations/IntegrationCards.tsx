import { Link2, RefreshCw } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

interface Integration {
  id: string
  name: string
  provider: string | null
  status: string | null
  last_sync: string | null
  sync_frequency: string | null
  error_message: string | null
}

interface IntegrationCardsProps {
  integrations: Integration[]
}

const AVAILABLE_INTEGRATIONS = [
  {
    provider: 'sam_gov',
    name: 'SAM.gov',
    description: 'Search and import federal opportunities from SAM.gov',
    href: '/integrations/sam-gov',
    color: '#1a5276',
  },
  {
    provider: 'hubspot',
    name: 'HubSpot CRM',
    description: 'Bi-directional sync of opportunities and contacts',
    href: '/integrations/hubspot',
    color: '#ff7a59',
  },
  {
    provider: 'govwin',
    name: 'GovWin IQ',
    description: 'Import opportunity intelligence and competitive data',
    href: '/integrations/govwin',
    color: '#2e86c1',
  },
  {
    provider: 'teams',
    name: 'Microsoft 365',
    description: 'Teams notifications, SharePoint docs, and Outlook sync',
    href: '/integrations/m365',
    color: '#5b5fc7',
  },
  {
    provider: 'salesforce',
    name: 'Salesforce',
    description: 'Sync opportunities and accounts with Salesforce CRM',
    href: '/integrations/salesforce',
    color: '#00a1e0',
  },
  {
    provider: 'slack',
    name: 'Slack',
    description: 'Channel notifications and proposal update alerts',
    href: '/integrations/slack',
    color: '#4a154b',
  },
  {
    provider: 'docusign',
    name: 'DocuSign',
    description: 'Electronic signatures and document workflow',
    href: '/integrations/docusign',
    color: '#ff4438',
  },
  {
    provider: 'google',
    name: 'Google Workspace',
    description: 'Drive, Docs, and Calendar integration',
    href: '/integrations/google',
    color: '#4285f4',
  },
  {
    provider: 'usaspending',
    name: 'USAspending',
    description: 'Federal award data and spending analytics',
    href: '/integrations/usaspending',
    color: '#112e51',
  },
]

function statusIndicator(status: string | null) {
  switch (status) {
    case 'active':
    case 'connected':
      return 'bg-emerald-400'
    case 'syncing':
      return 'bg-blue-400 animate-pulse'
    case 'error':
      return 'bg-red-400'
    default:
      return 'bg-muted-foreground'
  }
}

export function IntegrationCards({ integrations }: IntegrationCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {AVAILABLE_INTEGRATIONS.map((avail) => {
        const connected = integrations.find(
          (i) => i.provider === avail.provider
        )
        const isConnected =
          connected?.status === 'active' || connected?.status === 'connected'

        return (
          <div
            key={avail.provider}
            className="rounded-xl border border-border bg-card p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: avail.color }}
                >
                  {avail.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {avail.name}
                  </h4>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className={`h-2 w-2 rounded-full ${connected ? statusIndicator(connected.status) : 'bg-gray-600'}`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {isConnected
                    ? 'Connected'
                    : connected?.status === 'error'
                      ? 'Error'
                      : 'Disconnected'}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {avail.description}
            </p>

            {connected?.last_sync && (
              <p className="text-[10px] text-muted-foreground">
                Last sync:{' '}
                {new Date(connected.last_sync).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}

            {connected?.error_message && (
              <p className="text-[10px] text-red-400 truncate" title={connected.error_message}>
                {connected.error_message}
              </p>
            )}

            <div className="flex gap-2">
              <Link href={avail.href}>
                <Button variant="outline" size="sm">
                  {isConnected ? (
                    <>
                      <RefreshCw className="h-3 w-3" />
                      Configure
                    </>
                  ) : (
                    <>
                      <Link2 className="h-3 w-3" />
                      Connect
                    </>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
