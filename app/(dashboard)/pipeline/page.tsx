// filepath: app/(dashboard)/pipeline/page.tsx

import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Pipeline — MissionPulse',
}
import { resolveRole, hasPermission, isInternalRole } from '@/lib/rbac/config'
import { PipelineTable } from '@/components/modules/PipelineTable'
import { ViewToggle } from './ViewToggle'
import { CreateOpportunityButton } from './CreateOpportunityModal'
import { Skeleton } from '@/components/ui/skeleton'
import type { Opportunity } from '@/lib/types'

const KanbanView = dynamic(
  () => import('./KanbanView').then((m) => m.KanbanView),
  {
    loading: () => (
      <div className="grid grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    ),
  }
)

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: { q?: string; view?: string }
}) {
  const supabase = await createClient()

  // Resolve canEdit permission
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let canEdit = false
  let isExternal = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()
    const role = resolveRole(profile?.role)
    canEdit = hasPermission(role, 'pipeline', 'canEdit')
    isExternal = !isInternalRole(role)
  }

  // ─── Fetch Opportunities ────────────────────────────────────
  // External roles (partner, subcontractor, consultant) only see assigned opportunities
  let assignedOppIds: string[] | null = null
  if (isExternal && user) {
    const { data: assignments } = await supabase
      .from('opportunity_assignments')
      .select('opportunity_id')
      .eq('assignee_email', user.email ?? '')
    assignedOppIds = (assignments ?? []).map((a) => a.opportunity_id).filter(Boolean)
  }

  let query = supabase
    .from('opportunities')
    .select('id, title, agency, ceiling, pwin, phase, status, due_date, submission_date, set_aside, owner_id, priority, solicitation_number')
    .order('updated_at', { ascending: false })

  if (assignedOppIds !== null) {
    query = assignedOppIds.length > 0
      ? query.in('id', assignedOppIds)
      : query.in('id', ['__none__'])  // No assignments → show nothing
  }

  const { data: opportunities, error } = await query

  const opps = (opportunities ?? []) as Opportunity[]
  const view = searchParams.view ?? 'table'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {opps.length} opportunit{opps.length === 1 ? 'y' : 'ies'} in pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle />
          {canEdit && <CreateOpportunityButton />}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-600 dark:text-red-400">
          Failed to load pipeline: {error.message}
        </div>
      )}

      {/* Pipeline Views */}
      {!error && view === 'kanban' && <KanbanView opportunities={opps} canEdit={canEdit} />}
      {!error && view !== 'kanban' && (
        <PipelineTable opportunities={opps} initialSearch={searchParams.q ?? ''} canEdit={canEdit} />
      )}
    </div>
  )
}
