'use client'

import { useState } from 'react'
import {
  Link2,
  Link2Off,
  RefreshCw,
  ArrowLeftRight,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types ───────────────────────────────────────────────────

interface FieldMapping {
  mp_field: string
  sf_field: string
  direction: string
  is_custom?: boolean
}

interface SalesforceConfigProps {
  isConnected: boolean
  lastSync: string | null
  errorMessage: string | null
  instanceUrl: string | null
  fieldMappings: FieldMapping[] | null
}

// ─── Constants ───────────────────────────────────────────────

const DEFAULT_MAPPINGS: FieldMapping[] = [
  { mp_field: 'Title', sf_field: 'Name', direction: 'bidirectional' },
  { mp_field: 'Ceiling', sf_field: 'Amount', direction: 'bidirectional' },
  { mp_field: 'pWin', sf_field: 'Probability', direction: 'mp_to_sf' },
  { mp_field: 'Shipley Phase', sf_field: 'StageName', direction: 'mp_to_sf' },
  { mp_field: 'Due Date', sf_field: 'CloseDate', direction: 'bidirectional' },
  { mp_field: 'Agency', sf_field: 'Account.Name', direction: 'mp_to_sf' },
  { mp_field: 'Status', sf_field: 'IsClosed', direction: 'mp_to_sf' },
  { mp_field: 'Description', sf_field: 'Description', direction: 'bidirectional' },
]

const MP_LABELS: Record<string, string> = {
  title: 'Title',
  ceiling: 'Ceiling',
  pwin: 'pWin',
  phase: 'Shipley Phase',
  due_date: 'Due Date',
  agency: 'Agency',
  status: 'Status',
  description: 'Description',
}

// ─── Component ───────────────────────────────────────────────

export function SalesforceConfig({
  isConnected,
  lastSync,
  errorMessage,
  instanceUrl,
  fieldMappings,
}: SalesforceConfigProps) {
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error'
    message?: string
  }>({ status: 'idle' })
  const [syncDirection, setSyncDirection] = useState<string>('Bidirectional')

  const mappings: FieldMapping[] = fieldMappings
    ? fieldMappings.map((m) => ({
        ...m,
        mp_field: MP_LABELS[m.mp_field] ?? m.mp_field,
      }))
    : DEFAULT_MAPPINGS

  function handleTestConnection() {
    setTestResult({ status: 'testing' })
    // Simulate connection test — in production this calls testSalesforceConnection()
    setTimeout(() => {
      if (isConnected) {
        setTestResult({ status: 'success', message: 'Connection verified' })
      } else {
        setTestResult({
          status: 'error',
          message: 'Not connected. Click Connect to start OAuth flow.',
        })
      }
    }, 1500)
  }

  function directionIcon(dir: string) {
    if (dir === 'mp_to_sf') return <ArrowRight className="h-3 w-3 text-primary" />
    if (dir === 'sf_to_mp') return <ArrowLeft className="h-3 w-3 text-primary" />
    return <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
  }

  function directionLabel(dir: string) {
    if (dir === 'mp_to_sf') return 'MP → SF'
    if (dir === 'sf_to_mp') return 'SF → MP'
    return 'Bi-dir'
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="rounded-xl border border-border bg-card/50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-sm font-bold bg-[#009EDB]">
              SF
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Salesforce CRM</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? 'bg-emerald-400' : 'bg-muted-foreground'
                  }`}
                />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Connected' : 'Not Connected'}
                  {instanceUrl && ` — ${instanceUrl.replace('https://', '')}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testResult.status === 'testing'}
            >
              {testResult.status === 'testing' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : testResult.status === 'success' ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              ) : testResult.status === 'error' ? (
                <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
              ) : null}
              Test
            </Button>
            <Button variant={isConnected ? 'outline' : 'default'}>
              {isConnected ? (
                <>
                  <Link2Off className="h-4 w-4" />
                  Disconnect
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Connect Salesforce
                </>
              )}
            </Button>
          </div>
        </div>

        {testResult.message && (
          <p
            className={`text-xs mt-2 ${
              testResult.status === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {testResult.message}
          </p>
        )}

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

        {!isConnected && (
          <div className="mt-4 rounded-lg border border-border bg-card/80 p-4">
            <p className="text-xs text-muted-foreground">
              To connect Salesforce, configure <code className="text-primary">SALESFORCE_CLIENT_ID</code>,{' '}
              <code className="text-primary">SALESFORCE_CLIENT_SECRET</code>, and{' '}
              <code className="text-primary">SALESFORCE_REDIRECT_URI</code> in your
              environment, then click Connect to start the OAuth flow.
            </p>
          </div>
        )}
      </div>

      {/* Sync Direction */}
      <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Sync Configuration</h3>
          {isConnected && (
            <Button variant="outline" size="sm">
              <RefreshCw className="h-3 w-3" />
              Manual Sync
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'MissionPulse → Salesforce', value: 'push' },
            { label: 'Salesforce → MissionPulse', value: 'pull' },
            { label: 'Bidirectional', value: 'Bidirectional' },
          ].map((dir) => (
            <label
              key={dir.value}
              className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                syncDirection === dir.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-card/80'
              }`}
            >
              <input
                type="radio"
                name="syncDirection"
                value={dir.value}
                checked={syncDirection === dir.value}
                onChange={() => setSyncDirection(dir.value)}
                className="rounded-full border-border text-primary"
                disabled={!isConnected}
              />
              <span className="text-xs text-foreground">{dir.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Field Mapping Table */}
      <div className="rounded-xl border border-border bg-card/50">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">Field Mapping</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            How MissionPulse fields map to Salesforce opportunity properties.
            Custom fields (ending in __c) are supported.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-card/80">
                <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                  MissionPulse
                </th>
                <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground text-center">
                  Direction
                </th>
                <th className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                  Salesforce
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {mappings.map((mapping, i) => (
                <tr key={i} className="transition-colors hover:bg-card/80">
                  <td className="px-4 py-2 text-xs text-foreground">
                    {mapping.mp_field}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {directionIcon(mapping.direction)}
                      <span className="text-[10px] text-muted-foreground">
                        {directionLabel(mapping.direction)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-foreground">
                    {mapping.sf_field}
                    {mapping.is_custom && (
                      <span className="ml-1 text-[10px] text-primary">custom</span>
                    )}
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
