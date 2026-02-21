'use client'

import { useState } from 'react'
import {
  Link2,
  Link2Off,
  Cloud,
  FileText,
  Calendar,
  FolderOpen,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types ───────────────────────────────────────────────────

interface M365ConfigProps {
  isConnected: boolean
  userName: string | null
  lastSync: string | null
  errorMessage: string | null
  onedriveRoot: string
}

// ─── Component ───────────────────────────────────────────────

export function M365Config({
  isConnected,
  userName,
  lastSync,
  errorMessage,
  onedriveRoot,
}: M365ConfigProps) {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  function handleTestConnection() {
    setTestStatus('testing')
    setTimeout(() => {
      setTestStatus(isConnected ? 'success' : 'error')
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Microsoft 365</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? 'bg-emerald-400' : 'bg-gray-500'
                  }`}
                />
                <span className="text-xs text-gray-400">
                  {isConnected ? `Connected${userName ? ` as ${userName}` : ''}` : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
              >
                {testStatus === 'testing' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : testStatus === 'success' ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : null}
                Test
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
                  Connect M365
                </>
              )}
            </Button>
          </div>
        </div>

        {lastSync && (
          <p className="text-xs text-gray-500 mt-3">
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
          <div className="mt-4 rounded-lg border border-gray-800 bg-gray-900/80 p-4">
            <p className="text-xs text-gray-400">
              Configure <code className="text-[#00E5FA]">M365_CLIENT_ID</code>,{' '}
              <code className="text-[#00E5FA]">M365_CLIENT_SECRET</code>, and{' '}
              <code className="text-[#00E5FA]">M365_TENANT_ID</code> in your
              environment to enable Microsoft 365 integration.
            </p>
          </div>
        )}
      </div>

      {/* Capabilities */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="h-4 w-4 text-[#00E5FA]" />
            <h4 className="text-xs font-semibold text-white">OneDrive Storage</h4>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Save generated documents directly to OneDrive. Auto-organized into{' '}
            <code className="text-[#00E5FA]">{onedriveRoot}/[Opportunity]/[Volume]/</code>
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-[#00E5FA]" />
            <h4 className="text-xs font-semibold text-white">Word Online Editing</h4>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Open proposal volumes in Word Online for real-time collaborative editing.
            Changes sync back to MissionPulse.
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-[#00E5FA]" />
            <h4 className="text-xs font-semibold text-white">Calendar Sync</h4>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Push gate reviews, color team sessions, and submission deadlines
            to Outlook calendar.
          </p>
        </div>
      </div>

      {/* OneDrive Folder Structure */}
      {isConnected && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Folder Structure</h3>
          <div className="rounded-lg border border-gray-800 bg-gray-900/80 p-4 font-mono text-xs text-gray-400">
            <p>{onedriveRoot}/</p>
            <p className="pl-4">├── [Opportunity Title]/</p>
            <p className="pl-8">├── Technical Volume/</p>
            <p className="pl-8">├── Management Volume/</p>
            <p className="pl-8">├── Cost Volume/</p>
            <p className="pl-8">├── Compliance Matrix/</p>
            <p className="pl-8">└── Binder/</p>
          </div>
        </div>
      )}
    </div>
  )
}
