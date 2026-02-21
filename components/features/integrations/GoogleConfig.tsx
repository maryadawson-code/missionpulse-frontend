'use client'

import {
  Cloud,
  Calendar,
  FolderOpen,
  FileText,
  Mail,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────

interface GoogleConfigProps {
  isConnected: boolean
  userName: string | null
  userEmail: string | null
  lastSync: string | null
  canEdit: boolean
}

// ─── Component ───────────────────────────────────────────────

export function GoogleConfig({
  isConnected,
  userName,
  userEmail,
  lastSync,
  canEdit,
}: GoogleConfigProps) {
  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isConnected ? 'bg-emerald-500/10' : 'bg-gray-800'
              }`}
            >
              <Cloud
                className={`h-5 w-5 ${isConnected ? 'text-emerald-400' : 'text-gray-500'}`}
              />
            </div>
            <div>
              <h2 className="font-semibold text-white">Google Workspace</h2>
              {isConnected ? (
                <p className="text-sm text-emerald-400">
                  Connected as {userName ?? userEmail ?? 'Google User'}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Not connected</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>

        {lastSync && (
          <p className="mt-3 text-xs text-gray-500">
            Last synced: {new Date(lastSync).toLocaleString()}
          </p>
        )}

        {!isConnected && canEdit && (
          <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <p className="text-sm text-gray-400 mb-3">
              Connect to Google Workspace to enable Drive document storage, Calendar event push,
              and Gmail notifications.
            </p>
            <p className="text-xs text-gray-500">
              Required environment variables:{' '}
              <code className="text-cyan-400">GOOGLE_CLIENT_ID</code>,{' '}
              <code className="text-cyan-400">GOOGLE_CLIENT_SECRET</code>,{' '}
              <code className="text-cyan-400">GOOGLE_REDIRECT_URI</code>
            </p>
          </div>
        )}
      </div>

      {/* Capabilities */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Google Drive */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="h-5 w-5 text-cyan-400" />
            <h3 className="font-semibold text-white">Google Drive</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-cyan-400/60" />
              Save documents to Drive (auto-organized by opportunity)
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-cyan-400/60" />
              Folder structure: MissionPulse / [Opportunity Title] /
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-cyan-400/60" />
              Browse and download Drive files from within MissionPulse
            </li>
          </ul>
        </div>

        {/* Google Docs */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-cyan-400" />
            <h3 className="font-semibold text-white">Google Docs</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <ExternalLink className="h-4 w-4 mt-0.5 shrink-0 text-cyan-400/60" />
              Open proposal volumes in Google Docs for collaborative editing
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-cyan-400/60" />
              Export generated DOCX files to Google Docs format
            </li>
          </ul>
        </div>

        {/* Google Calendar */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-cyan-400" />
            <h3 className="font-semibold text-white">Google Calendar</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-cyan-400/60" />
              Gate review dates pushed to your calendar
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-cyan-400/60" />
              Color team sessions with appropriate color coding
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-cyan-400/60" />
              Submission deadlines with reminders (24hr + 30min)
            </li>
          </ul>
        </div>

        {/* Gmail */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-5 w-5 text-cyan-400" />
            <h3 className="font-semibold text-white">Gmail Notifications</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-cyan-400/60" />
              MissionPulse notifications via your Gmail account
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-cyan-400/60" />
              Alternative to native email — uses your existing inbox
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
