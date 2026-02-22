'use client'

import { useState, useTransition } from 'react'
import { Bell, Mail, Smartphone, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'

interface NotificationPref {
  notification_type: string
  email_enabled: boolean
  in_app_enabled: boolean
  push_enabled: boolean
}

interface NotificationPreferencesProps {
  preferences: NotificationPref[]
  onSave: (prefs: NotificationPref[]) => Promise<{ success: boolean; error?: string }>
}

const NOTIFICATION_TYPES = [
  { type: 'gate_approval', label: 'Gate Approvals', description: 'When a section moves through a review gate' },
  { type: 'color_team_deadline', label: 'Color Team Deadlines', description: 'Upcoming color team review dates' },
  { type: 'pwin_change', label: 'pWin Changes', description: 'When an opportunity\'s win probability changes' },
  { type: 'section_assigned', label: 'Section Assignments', description: 'When you are assigned a new section to write or review' },
  { type: 'comment_reply', label: 'Comment Replies', description: 'When someone replies to your comment' },
  { type: 'deadline_approaching', label: 'Deadline Reminders', description: 'Reminders for upcoming due dates' },
  { type: 'compliance_gap', label: 'Compliance Gaps', description: 'New compliance gaps detected' },
  { type: 'team_invite', label: 'Team Invitations', description: 'When you are invited to an opportunity' },
  { type: 'document_uploaded', label: 'Document Uploads', description: 'New documents uploaded to your opportunities' },
  { type: 'ai_analysis_complete', label: 'AI Analysis Complete', description: 'When an AI agent finishes processing' },
]

export function NotificationPreferences({ preferences, onSave }: NotificationPreferencesProps) {
  const [prefs, setPrefs] = useState<NotificationPref[]>(() => {
    const map = new Map(preferences.map((p) => [p.notification_type, p]))
    return NOTIFICATION_TYPES.map((nt) => ({
      notification_type: nt.type,
      email_enabled: map.get(nt.type)?.email_enabled ?? true,
      in_app_enabled: map.get(nt.type)?.in_app_enabled ?? true,
      push_enabled: map.get(nt.type)?.push_enabled ?? false,
    }))
  })
  const [isPending, startTransition] = useTransition()

  function toggle(type: string, channel: 'email_enabled' | 'in_app_enabled' | 'push_enabled') {
    setPrefs((prev) =>
      prev.map((p) =>
        p.notification_type === type ? { ...p, [channel]: !p[channel] } : p
      )
    )
  }

  function handleSave() {
    startTransition(async () => {
      const result = await onSave(prefs)
      if (result.success) {
        addToast('success', 'Notification preferences saved')
      } else {
        addToast('error', result.error ?? 'Failed to save preferences')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span className="w-64" />
          <span className="w-16 text-center inline-flex items-center justify-center gap-1">
            <Mail className="h-3 w-3" /> Email
          </span>
          <span className="w-16 text-center inline-flex items-center justify-center gap-1">
            <Bell className="h-3 w-3" /> In-App
          </span>
          <span className="w-16 text-center inline-flex items-center justify-center gap-1">
            <Smartphone className="h-3 w-3" /> Push
          </span>
        </div>
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          Save
        </Button>
      </div>

      {/* Notification rows */}
      <div className="divide-y divide-border rounded-lg border border-border">
        {NOTIFICATION_TYPES.map((nt) => {
          const pref = prefs.find((p) => p.notification_type === nt.type)
          if (!pref) return null

          return (
            <div key={nt.type} className="flex items-center gap-6 px-4 py-3">
              <div className="w-64 min-w-0">
                <p className="text-sm font-medium text-foreground">{nt.label}</p>
                <p className="text-[10px] text-muted-foreground">{nt.description}</p>
              </div>
              <div className="w-16 flex justify-center">
                <button
                  onClick={() => toggle(nt.type, 'email_enabled')}
                  className={`h-5 w-9 rounded-full transition-colors ${
                    pref.email_enabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white transition-transform ${
                      pref.email_enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <div className="w-16 flex justify-center">
                <button
                  onClick={() => toggle(nt.type, 'in_app_enabled')}
                  className={`h-5 w-9 rounded-full transition-colors ${
                    pref.in_app_enabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white transition-transform ${
                      pref.in_app_enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <div className="w-16 flex justify-center">
                <button
                  onClick={() => toggle(nt.type, 'push_enabled')}
                  className={`h-5 w-9 rounded-full transition-colors ${
                    pref.push_enabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white transition-transform ${
                      pref.push_enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
