'use client'

import { useState, useTransition } from 'react'
import {
  Link2,
  Link2Off,
  Bell,
  Hash,
  MessageSquare,
  Shield,
  Clock,
  Users,
  TrendingUp,
  Brain,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAuthUrl, disconnectIntegration } from '@/app/(dashboard)/integrations/actions'

// ─── Types ───────────────────────────────────────────────────

interface NotificationPrefs {
  gate_approval: boolean
  deadline_warning: boolean
  hitl_pending: boolean
  pwin_change: boolean
  assignment: boolean
}

interface SlackConfigProps {
  isConnected: boolean
  isAvailable: boolean
  teamName: string | null
  lastSync: string | null
  errorMessage: string | null
  notificationPrefs: NotificationPrefs | null
}

const NOTIFICATION_TYPES = [
  {
    key: 'gate_approval' as const,
    label: 'Gate Approvals',
    description: 'Go/No-Go decisions requiring executive approval',
    icon: Shield,
  },
  {
    key: 'deadline_warning' as const,
    label: 'Deadline Warnings',
    description: '48hr and 24hr alerts before submission deadlines',
    icon: Clock,
  },
  {
    key: 'hitl_pending' as const,
    label: 'HITL Queue Items',
    description: 'AI tasks requiring human review and approval',
    icon: Brain,
  },
  {
    key: 'pwin_change' as const,
    label: 'pWin Changes',
    description: 'Probability of win changes exceeding 10%',
    icon: TrendingUp,
  },
  {
    key: 'assignment' as const,
    label: 'Team Assignments',
    description: 'New team member assignments to opportunities',
    icon: Users,
  },
]

// ─── Component ───────────────────────────────────────────────

export function SlackConfig({
  isConnected,
  isAvailable,
  teamName,
  lastSync,
  errorMessage,
  notificationPrefs,
}: SlackConfigProps) {
  const [isPending, startTransition] = useTransition()

  function handleConnect() {
    startTransition(async () => {
      const { url } = await getAuthUrl('slack')
      if (!url) return
      const popup = window.open(url, 'slack-oauth', 'width=600,height=700')
      if (!popup) window.location.href = url
    })
  }

  function handleDisconnect() {
    startTransition(async () => {
      await disconnectIntegration('slack')
      window.location.reload()
    })
  }

  const [prefs, setPrefs] = useState<NotificationPrefs>(
    notificationPrefs ?? {
      gate_approval: true,
      deadline_warning: true,
      hitl_pending: true,
      pwin_change: true,
      assignment: true,
    }
  )

  function togglePref(key: keyof NotificationPrefs) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="rounded-xl border border-border bg-card/50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-[#4A154B]">
              <Hash className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Slack</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? 'bg-emerald-400' : 'bg-muted-foreground'
                  }`}
                />
                <span className="text-xs text-muted-foreground">
                  {isConnected
                    ? `Connected${teamName ? ` to ${teamName}` : ''}`
                    : 'Not Connected'}
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
                  Connect Slack
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
            Last notification:{' '}
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

      {/* Notification Preferences */}
      <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Choose which MissionPulse events trigger Slack notifications.
        </p>

        <div className="space-y-2">
          {NOTIFICATION_TYPES.map((notif) => {
            const Icon = notif.icon
            return (
              <label
                key={notif.key}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  prefs[notif.key]
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border hover:bg-card/80'
                }`}
              >
                <input
                  type="checkbox"
                  checked={prefs[notif.key]}
                  onChange={() => togglePref(notif.key)}
                  className="rounded border-border text-primary"
                  disabled={!isConnected}
                />
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">{notif.label}</p>
                  <p className="text-[10px] text-muted-foreground">{notif.description}</p>
                </div>
              </label>
            )
          })}
        </div>

        {isConnected && (
          <Button variant="outline" size="sm">
            Save Preferences
          </Button>
        )}
      </div>

      {/* Channel Configuration */}
      <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Channel Configuration</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Each opportunity can have a linked Slack channel for focused team communication.
          Channels can be auto-created or linked to existing channels.
        </p>

        <div className="rounded-lg border border-border bg-card/80 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Channel naming convention:</span>
          </div>
          <code className="text-xs text-primary">#mp-[opportunity-title]</code>
        </div>

        {!isConnected && (
          <p className="text-[10px] text-muted-foreground">
            Connect Slack to configure channel mappings.
          </p>
        )}
      </div>
    </div>
  )
}
