'use client'

import { useTransition } from 'react'
import {
  Cloud,
  Calendar,
  FolderOpen,
  FileText,
  Mail,
  CheckCircle2,
  ExternalLink,
  Link2,
  Link2Off,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAuthUrl, disconnectIntegration } from '@/app/(dashboard)/integrations/actions'

// ─── Types ───────────────────────────────────────────────────

interface GoogleConfigProps {
  isConnected: boolean
  isAvailable: boolean
  userName: string | null
  userEmail: string | null
  lastSync: string | null
  canEdit: boolean
}

// ─── Component ───────────────────────────────────────────────

export function GoogleConfig({
  isConnected,
  isAvailable,
  userName,
  userEmail,
  lastSync,
  canEdit,
}: GoogleConfigProps) {
  const [isPending, startTransition] = useTransition()

  function handleConnect() {
    startTransition(async () => {
      const { url } = await getAuthUrl('google')
      if (!url) return
      const popup = window.open(url, 'google-oauth', 'width=600,height=700')
      if (!popup) window.location.href = url
    })
  }

  function handleDisconnect() {
    startTransition(async () => {
      await disconnectIntegration('google')
      window.location.reload()
    })
  }
  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="rounded-xl border border-border bg-card/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isConnected ? 'bg-emerald-500/10' : 'bg-muted'
              }`}
            >
              <Cloud
                className={`h-5 w-5 ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
              />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Google Workspace</h2>
              {isConnected ? (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Connected as {userName ?? userEmail ?? 'Google User'}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Not connected</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected && (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            )}
            {isAvailable && canEdit && (
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
                    Connect Google
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
        </div>

        {lastSync && (
          <p className="mt-3 text-xs text-muted-foreground">
            Last synced: {new Date(lastSync).toLocaleString()}
          </p>
        )}
      </div>

      {/* Capabilities */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Google Drive */}
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Google Drive</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Save documents to Drive (auto-organized by opportunity)
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Folder structure: MissionPulse / [Opportunity Title] /
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Browse and download Drive files from within MissionPulse
            </li>
          </ul>
        </div>

        {/* Google Docs */}
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Google Docs</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ExternalLink className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Open proposal volumes in Google Docs for collaborative editing
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Export generated DOCX files to Google Docs format
            </li>
          </ul>
        </div>

        {/* Google Calendar */}
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Google Calendar</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Gate review dates pushed to your calendar
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Color team sessions with appropriate color coding
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Submission deadlines with reminders (24hr + 30min)
            </li>
          </ul>
        </div>

        {/* Gmail */}
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Gmail Notifications</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              MissionPulse notifications via your Gmail account
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Alternative to native email — uses your existing inbox
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
