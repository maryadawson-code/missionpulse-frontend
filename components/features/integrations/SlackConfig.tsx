'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  teamName,
  lastSync,
  errorMessage,
  notificationPrefs,
}: SlackConfigProps) {
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
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-[#4A154B]">
              <Hash className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Slack</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? 'bg-emerald-400' : 'bg-gray-500'
                  }`}
                />
                <span className="text-xs text-gray-400">
                  {isConnected
                    ? `Connected${teamName ? ` to ${teamName}` : ''}`
                    : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>

          <Button variant={isConnected ? 'outline' : 'default'}>
            {isConnected ? (
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
        </div>

        {lastSync && (
          <p className="text-xs text-gray-500 mt-3">
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
          <p className="text-xs text-red-400 mt-2">Error: {errorMessage}</p>
        )}

        {!isConnected && (
          <div className="mt-4 rounded-lg border border-gray-800 bg-gray-900/80 p-4">
            <p className="text-xs text-gray-400">
              Configure <code className="text-[#00E5FA]">SLACK_CLIENT_ID</code> and{' '}
              <code className="text-[#00E5FA]">SLACK_CLIENT_SECRET</code> in your
              environment, then click Connect to authorize the MissionPulse Slack app.
            </p>
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#00E5FA]" />
          <h3 className="text-sm font-semibold text-white">Notification Preferences</h3>
        </div>
        <p className="text-xs text-gray-500">
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
                    ? 'border-[#00E5FA]/30 bg-[#00E5FA]/5'
                    : 'border-gray-800 hover:bg-gray-900/80'
                }`}
              >
                <input
                  type="checkbox"
                  checked={prefs[notif.key]}
                  onChange={() => togglePref(notif.key)}
                  className="rounded border-gray-600 text-[#00E5FA]"
                  disabled={!isConnected}
                />
                <Icon className="h-4 w-4 text-gray-500 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-white">{notif.label}</p>
                  <p className="text-[10px] text-gray-500">{notif.description}</p>
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
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#00E5FA]" />
          <h3 className="text-sm font-semibold text-white">Channel Configuration</h3>
        </div>
        <p className="text-xs text-gray-500">
          Each opportunity can have a linked Slack channel for focused team communication.
          Channels can be auto-created or linked to existing channels.
        </p>

        <div className="rounded-lg border border-gray-800 bg-gray-900/80 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="h-3 w-3 text-gray-500" />
            <span className="text-xs text-gray-400">Channel naming convention:</span>
          </div>
          <code className="text-xs text-[#00E5FA]">#mp-[opportunity-title]</code>
        </div>

        {!isConnected && (
          <p className="text-[10px] text-gray-600">
            Connect Slack to configure channel mappings.
          </p>
        )}
      </div>
    </div>
  )
}
