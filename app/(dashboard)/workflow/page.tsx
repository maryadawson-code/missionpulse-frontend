// filepath: app/(dashboard)/workflow/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission, isInternalRole } from '@/lib/rbac/config'
import { WorkflowBoard } from '@/components/features/workflow/WorkflowBoard'

export default async function WorkflowPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'workflow_board', 'shouldRender')) {
    return null
  }
  const canEdit = hasPermission(role, 'workflow_board', 'canEdit')
  const internal = isInternalRole(role)

  // Fetch active opportunities for the selector
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, title')
    .in('status', ['Active', 'active', 'In Progress'])
    .order('updated_at', { ascending: false })
    .limit(50)

  // Fetch all proposal sections (or filtered for external roles)
  let sectionsQuery = supabase
    .from('proposal_sections')
    .select('id, section_title, volume, status, due_date, writer_id, reviewer_id, sort_order, opportunity_id')
    .order('sort_order', { ascending: true })

  if (!internal) {
    // External roles only see sections for opportunities they're assigned to
    const { data: assignments } = await supabase
      .from('opportunity_assignments')
      .select('opportunity_id')
      .eq('assignee_email', user.email ?? '')

    const assignedOppIds = (assignments ?? []).map((a) => a.opportunity_id)
    if (assignedOppIds.length > 0) {
      sectionsQuery = sectionsQuery.in('opportunity_id', assignedOppIds)
    } else {
      sectionsQuery = sectionsQuery.eq('opportunity_id', '__none__')
    }
  }

  const { data: sections } = await sectionsQuery

  // Summary counts
  const allSections = sections ?? []
  const draftCount = allSections.filter((s) => s.status === 'draft' || !s.status).length
  const reviewCount = allSections.filter((s) =>
    s.status === 'pink_review' || s.status === 'green_review' || s.status === 'red_review'
  ).length
  const revisionCount = allSections.filter((s) => s.status === 'revision').length
  const finalCount = allSections.filter((s) => s.status === 'final').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Workflow Board</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage proposal sections across color team stages.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Draft</p>
          <p className="mt-1 text-xl font-bold text-muted-foreground">{draftCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-400">In Review</p>
          <p className="mt-1 text-xl font-bold text-blue-300">{reviewCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400">Revision</p>
          <p className="mt-1 text-xl font-bold text-amber-300">{revisionCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">Final</p>
          <p className="mt-1 text-xl font-bold text-emerald-300">{finalCount}</p>
        </div>
      </div>

      <WorkflowBoard
        opportunities={(opportunities ?? []).map((o) => ({ id: o.id, title: o.title }))}
        sections={allSections}
        canEdit={canEdit}
      />
    </div>
  )
}
