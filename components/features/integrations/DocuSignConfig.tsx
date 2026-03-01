'use client'

import {
  FileSignature,
  Shield,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────

interface DocuSignConfigProps {
  isConnected: boolean
  userName: string | null
  environment: string
  lastSync: string | null
  canEdit: boolean
}

// ─── Component ───────────────────────────────────────────────

export function DocuSignConfig({
  isConnected,
  userName,
  environment,
  lastSync,
  canEdit,
}: DocuSignConfigProps) {
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
              <FileSignature
                className={`h-5 w-5 ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
              />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">DocuSign eSignature</h2>
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">Connected as {userName ?? 'DocuSign User'}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    environment === 'production'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {environment === 'production' ? 'Production' : 'Demo'}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not connected</p>
              )}
            </div>
          </div>

          {isConnected ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {lastSync && (
          <p className="mt-3 text-xs text-muted-foreground">
            Last activity: {new Date(lastSync).toLocaleString()}
          </p>
        )}

        {!isConnected && canEdit && (
          <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Connect DocuSign to enable e-signature routing for gate approvals, NDAs, and
              teaming agreements.
            </p>
            <p className="text-xs text-muted-foreground">
              Required environment variables:{' '}
              <code className="text-primary">DOCUSIGN_CLIENT_ID</code>,{' '}
              <code className="text-primary">DOCUSIGN_CLIENT_SECRET</code>,{' '}
              <code className="text-primary">DOCUSIGN_REDIRECT_URI</code>
            </p>
          </div>
        )}
      </div>

      {/* Signature Status Legend */}
      <div className="rounded-xl border border-border bg-card/50 p-5">
        <h3 className="font-semibold text-foreground mb-3">Signature Status Tracking</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-xs font-medium text-foreground">Pending</p>
              <p className="text-xs text-muted-foreground">Awaiting signature</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-xs font-medium text-foreground">Signed</p>
              <p className="text-xs text-muted-foreground">All parties signed</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-xs font-medium text-foreground">Declined</p>
              <p className="text-xs text-muted-foreground">Signature refused</p>
            </div>
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gate Approvals */}
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Gate Approvals</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Send Go/No-Go decisions for e-signature
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Signed documents auto-attached to opportunity record
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Audit trail for all signature events
            </li>
          </ul>
        </div>

        {/* NDAs & Teaming */}
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">NDAs & Teaming Agreements</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              NDA template routing for partner onboarding
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Multi-party routing with sequential signing order
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Download signed copies from MissionPulse
            </li>
          </ul>
        </div>

        {/* Certifications */}
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Certifications</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Certification attestation documents
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Compliance documentation with signed chain
            </li>
          </ul>
        </div>

        {/* Webhook Events */}
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileSignature className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Event Tracking</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              Real-time status updates via DocuSign Connect
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              All signature events logged to audit trail
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
