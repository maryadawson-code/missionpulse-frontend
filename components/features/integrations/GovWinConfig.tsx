'use client'

import { useState } from 'react'
import {
  Link2,
  Link2Off,
  RefreshCw,
  Search,
  Download,
  Bell,
  Shield,
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types ───────────────────────────────────────────────────

interface AlertFilters {
  naicsCodes?: string[]
  agencies?: string[]
  setAsides?: string[]
  minValue?: number
}

interface PendingAlert {
  id: string
  title: string
  agency: string
  estimatedValue: number | null
  dueDate: string | null
}

interface GovWinConfigProps {
  isConnected: boolean
  lastSync: string | null
  errorMessage: string | null
  alertCount: number
  alertFilters: AlertFilters | null
  pendingAlerts: PendingAlert[]
}

// ─── Component ───────────────────────────────────────────────

export function GovWinConfig({
  isConnected,
  lastSync,
  errorMessage,
  alertCount,
  alertFilters,
  pendingAlerts,
}: GovWinConfigProps) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [naicsInput, setNaicsInput] = useState(alertFilters?.naicsCodes?.join(', ') ?? '')
  const [agencyInput, setAgencyInput] = useState(alertFilters?.agencies?.join(', ') ?? '')
  const [minValueInput, setMinValueInput] = useState(
    alertFilters?.minValue ? String(alertFilters.minValue) : ''
  )

  function handleManualSync() {
    setSyncStatus('syncing')
    // In production: calls runGovWinSync()
    setTimeout(() => {
      setSyncStatus(isConnected ? 'success' : 'error')
    }, 2000)
  }

  function formatCurrency(value: number | null): string {
    if (value === null) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="rounded-xl border border-border bg-card/50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br from-blue-600 to-purple-600">
              GW
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">GovWin IQ</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? 'bg-emerald-400' : 'bg-muted-foreground'
                  }`}
                />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Connected' : 'Not Connected'}
                  {alertCount > 0 && ` — ${alertCount} new alerts`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                disabled={syncStatus === 'syncing'}
              >
                {syncStatus === 'syncing' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : syncStatus === 'success' ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : syncStatus === 'error' ? (
                  <XCircle className="h-3 w-3 text-red-400" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Sync Now
              </Button>
            )}
            <Button variant={isConnected ? 'outline' : 'default'}>
              {isConnected ? (
                <>
                  <Link2Off className="h-4 w-4" />
                  Disconnect
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Connect GovWin
                </>
              )}
            </Button>
          </div>
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
          <p className="text-xs text-red-400 mt-2">Error: {errorMessage}</p>
        )}

        {!isConnected && (
          <div className="mt-4 rounded-lg border border-border bg-card/80 p-4">
            <p className="text-xs text-muted-foreground">
              Connect your GovWin IQ account to receive opportunity alerts, track competitors,
              and access agency intelligence data. Configure{' '}
              <code className="text-primary">GOVWIN_CLIENT_ID</code> and{' '}
              <code className="text-primary">GOVWIN_CLIENT_SECRET</code> in your environment.
            </p>
          </div>
        )}
      </div>

      {/* Alert Filters */}
      <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Alert Filters</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure which GovWin opportunities trigger alerts in MissionPulse.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">NAICS Codes</label>
            <input
              type="text"
              value={naicsInput}
              onChange={(e) => setNaicsInput(e.target.value)}
              placeholder="541512, 541511, 518210"
              className="w-full rounded-lg border border-border bg-card/80 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              disabled={!isConnected}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Agencies</label>
            <input
              type="text"
              value={agencyInput}
              onChange={(e) => setAgencyInput(e.target.value)}
              placeholder="DoD, DHS, VA"
              className="w-full rounded-lg border border-border bg-card/80 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              disabled={!isConnected}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Minimum Value ($)</label>
            <input
              type="text"
              value={minValueInput}
              onChange={(e) => setMinValueInput(e.target.value)}
              placeholder="1000000"
              className="w-full rounded-lg border border-border bg-card/80 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              disabled={!isConnected}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" size="sm" disabled={!isConnected}>
              <Search className="h-3 w-3" />
              Save Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Pending Alerts / Opportunity Feed */}
      <div className="rounded-xl border border-border bg-card/50">
        <div className="border-b border-border px-5 py-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Opportunity Alerts</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              New GovWin opportunities matching your filters. Import to pipeline with one click.
            </p>
          </div>
          {pendingAlerts.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {pendingAlerts.length} new
            </span>
          )}
        </div>

        {pendingAlerts.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">
              {isConnected
                ? 'No new opportunity alerts. Adjust your filters or run a manual sync.'
                : 'Connect GovWin IQ to receive opportunity alerts.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {pendingAlerts.slice(0, 10).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-card/80 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {alert.title}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-2.5 w-2.5" />
                      {alert.agency}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatCurrency(alert.estimatedValue)}
                    </span>
                    {alert.dueDate && (
                      <span className="text-[10px] text-muted-foreground">
                        Due: {new Date(alert.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="ml-3 shrink-0">
                  <Download className="h-3 w-3" />
                  Import
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Capabilities Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-semibold text-foreground">Opportunity Alerts</h4>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Automatic alerts when new opportunities match your NAICS codes, agency focus,
            and dollar thresholds.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-semibold text-foreground">Competitor Tracking</h4>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            See who else is bidding on your opportunities. Incumbent contractor data
            and win probability estimates.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-semibold text-foreground">Agency Intelligence</h4>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Budget forecasts, acquisition timelines, and procurement patterns
            for target agencies.
          </p>
        </div>
      </div>
    </div>
  )
}
