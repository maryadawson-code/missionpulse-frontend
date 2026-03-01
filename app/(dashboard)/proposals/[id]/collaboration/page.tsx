// filepath: app/(dashboard)/proposals/[id]/collaboration/page.tsx
/**
 * Collaboration Page
 *
 * Server Component showing real-time artifact sync status, recent
 * activity, and connected tool distribution for a proposal.
 *
 * Three sections:
 * 1. ArtifactStatusGrid — sync status of all volumes via SyncStatusOverview
 * 2. Activity feed — recent activity_log entries for this opportunity
 * 3. Tool distribution — static cards for connected cloud tools
 *
 * v1.3 Sprint 30 -- Cross-Document Intelligence
 */
import { redirect } from 'next/navigation'
import {
  FileText,
  Clock,
  Wrench,
  ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createSyncClient } from '@/lib/supabase/sync-client'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { SyncStatusOverview } from '@/components/features/launch/SyncStatusOverview'
import type { SyncStatus, DocumentSource } from '@/lib/types/sync'

// -- Types ------------------------------------------------------------------

interface ActivityEntry {
  id: string
  action: string
  timestamp: string | null
  user_name: string | null
  details: Record<string, unknown> | null
}

interface ConnectedTool {
  name: string
  description: string
  source: DocumentSource
  icon: string
  connected: boolean
}

// -- Constants --------------------------------------------------------------

const CONNECTED_TOOLS: ConnectedTool[] = [
  {
    name: 'Word Online',
    description: 'Collaborative document editing for tech and management volumes',
    source: 'word_online',
    icon: 'W',
    connected: true,
  },
  {
    name: 'Excel Online',
    description: 'Spreadsheet editing for cost models and compliance matrices',
    source: 'excel_online',
    icon: 'X',
    connected: true,
  },
  {
    name: 'Google Docs',
    description: 'Real-time collaborative editing with Google Workspace',
    source: 'google_docs',
    icon: 'G',
    connected: true,
  },
  {
    name: 'Google Sheets',
    description: 'Spreadsheet collaboration for pricing and data analysis',
    source: 'google_sheets',
    icon: 'S',
    connected: false,
  },
  {
    name: 'PowerPoint Online',
    description: 'Presentation editing for gate decision decks',
    source: 'pptx_online',
    icon: 'P',
    connected: false,
  },
  {
    name: 'MissionPulse',
    description: 'Native editor for in-platform section authoring',
    source: 'missionpulse',
    icon: 'M',
    connected: true,
  },
]

const TOOL_ICON_COLORS: Record<string, string> = {
  W: 'bg-blue-600 text-white',
  X: 'bg-green-600 text-white',
  G: 'bg-blue-500 text-white',
  S: 'bg-emerald-500 text-white',
  P: 'bg-orange-500 text-white',
  M: 'bg-[#00E5FA]/20 text-[#00E5FA]',
}

// -- Helpers ----------------------------------------------------------------

function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

// -- Page -------------------------------------------------------------------

export default async function CollaborationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch opportunity
  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, title, status')
    .eq('id', id)
    .single()

  if (!opportunity) {
    redirect('/proposals')
  }

  // Fetch recent activity for this opportunity
  const { data: activityRows } = await supabase
    .from('activity_log')
    .select('id, action, timestamp, user_name, details')
    .order('timestamp', { ascending: false })
    .limit(20)

  // Filter activity entries related to this opportunity
  const activityEntries: ActivityEntry[] = (activityRows ?? [])
    .filter((entry) => {
      if (!entry.details || typeof entry.details !== 'object' || Array.isArray(entry.details)) {
        return false
      }
      const details = entry.details as Record<string, unknown>
      return (
        details.entity_id === id ||
        details.opportunity_id === id
      )
    })
    .map((entry) => ({
      id: entry.id,
      action: entry.action,
      timestamp: entry.timestamp,
      user_name: entry.user_name,
      details:
        entry.details && typeof entry.details === 'object' && !Array.isArray(entry.details)
          ? (entry.details as Record<string, unknown>)
          : null,
    }))

  // Fetch sync states to determine which tools are actively used
  const syncClient = await createSyncClient()
  const { data: syncStates } = await syncClient
    .from('document_sync_state')
    .select('cloud_provider, sync_status, metadata')

  // Count active providers
  const activeProviders = new Set<string>()
  for (const state of syncStates ?? []) {
    if (state.cloud_provider) {
      activeProviders.add(state.cloud_provider)
    }
    const metadata = (state.metadata ?? {}) as Record<string, unknown>
    if (metadata.edit_source) {
      activeProviders.add(metadata.edit_source as string)
    }
  }

  // Compute sync summary for the header
  const allSyncStatuses = (syncStates ?? []).map(
    (s) => s.sync_status as SyncStatus
  )
  const syncedCount = allSyncStatuses.filter(
    (s) => s === 'synced' || s === 'idle'
  ).length
  const totalSynced = allSyncStatuses.length
  const _overallHealth =
    totalSynced > 0 ? Math.round((syncedCount / totalSynced) * 100) : 100

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Proposals', href: '/proposals' },
          { label: opportunity.title, href: `/proposals/${id}` },
          { label: 'Collaboration' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Collaboration &mdash; {opportunity.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time sync status, recent activity, and connected collaboration
          tools.
        </p>
      </div>

      {/* Section 1: Artifact Status Grid */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#00E5FA]" />
          <h2 className="text-sm font-semibold text-foreground">
            Artifact Sync Status
          </h2>
        </div>
        <SyncStatusOverview opportunityId={id} />
      </section>

      {/* Section 2: Activity Feed */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#00E5FA]" />
          <h2 className="text-sm font-semibold text-foreground">
            Recent Activity
          </h2>
        </div>

        <div className="rounded-xl border border-border bg-card">
          {activityEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-6 w-6 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No recent activity for this opportunity.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activityEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 px-5 py-3"
                >
                  {/* Avatar */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {getInitials(entry.user_name)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {entry.user_name ?? 'System'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatAction(entry.action)}
                    </p>
                    {entry.details && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {typeof entry.details.entity_type === 'string' && (
                          <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {entry.details.entity_type}
                          </span>
                        )}
                        {typeof entry.details.status_change === 'string' && (
                          <span className="inline-block rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-300">
                            {entry.details.status_change}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section 3: Tool Distribution */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-[#00E5FA]" />
          <h2 className="text-sm font-semibold text-foreground">
            Connected Tools
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CONNECTED_TOOLS.map((tool) => {
            const isActive =
              activeProviders.has(tool.source) || tool.connected

            return (
              <div
                key={tool.source}
                className={`rounded-xl border p-4 transition-colors ${
                  isActive
                    ? 'border-border bg-card'
                    : 'border-border/50 bg-card/50 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Tool Icon */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                      TOOL_ICON_COLORS[tool.icon] ?? 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {tool.icon}
                  </div>

                  {/* Tool Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {tool.name}
                      </p>
                      {isActive ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-500/15 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-500/30">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>

                {/* Footer with link */}
                {isActive && (
                  <div className="mt-3 flex items-center gap-1 text-[10px] text-[#00E5FA]">
                    <ExternalLink className="h-3 w-3" />
                    <span>
                      Connected via {tool.source.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
