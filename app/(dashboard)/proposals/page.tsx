import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission, isInternalRole } from '@/lib/rbac/config'
import { ReviewQueue } from '@/components/features/hitl/ReviewQueue'
import { ProposalOutlineList } from '@/components/features/proposals/ProposalOutlineList'

export const metadata: Metadata = {
  title: 'Proposals — MissionPulse',
}

interface ReviewItem {
  id: string
  type: 'compliance' | 'contract' | 'document'
  title: string
  description: string
  status: string
  opportunityTitle: string | null
  opportunityId: string | null
  updatedAt: string | null
}

export default async function ProposalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'proposals', 'shouldRender')) {
    return null
  }
  const canEdit = hasPermission(role, 'proposals', 'canEdit')

  // External roles only see items from assigned opportunities
  let assignedOppIds: string[] | null = null
  if (!isInternalRole(role)) {
    const { data: assignments } = await supabase
      .from('opportunity_assignments')
      .select('opportunity_id')
      .eq('assignee_email', user.email ?? '')
    assignedOppIds = (assignments ?? []).map((a) => a.opportunity_id).filter(Boolean)
  }

  // Fetch compliance requirements needing review (status = 'Addressed' but not 'Verified')
  let compQuery = supabase
    .from('compliance_requirements')
    .select('id, reference, requirement, status, opportunity_id, updated_at')
    .eq('status', 'Addressed')
    .order('updated_at', { ascending: false })
    .limit(50)
  if (assignedOppIds !== null && assignedOppIds.length > 0) {
    compQuery = compQuery.in('opportunity_id', assignedOppIds)
  } else if (assignedOppIds !== null) {
    compQuery = compQuery.in('opportunity_id', ['__none__'])
  }
  const { data: compReqs } = await compQuery

  // Fetch contract clauses needing review
  let clauseQuery = supabase
    .from('contract_clauses')
    .select('id, clause_number, clause_title, compliance_status, opportunity_id, updated_at')
    .eq('compliance_status', 'Review Needed')
    .order('updated_at', { ascending: false })
    .limit(50)
  if (assignedOppIds !== null && assignedOppIds.length > 0) {
    clauseQuery = clauseQuery.in('opportunity_id', assignedOppIds)
  } else if (assignedOppIds !== null) {
    clauseQuery = clauseQuery.in('opportunity_id', ['__none__'])
  }
  const { data: clauses } = await clauseQuery

  // Fetch documents needing review
  let docQuery = supabase
    .from('documents')
    .select('id, document_name, description, status, opportunity_id, updated_at')
    .eq('status', 'in_review')
    .order('updated_at', { ascending: false })
    .limit(50)
  if (assignedOppIds !== null && assignedOppIds.length > 0) {
    docQuery = docQuery.in('opportunity_id', assignedOppIds)
  } else if (assignedOppIds !== null) {
    docQuery = docQuery.in('opportunity_id', ['__none__'])
  }
  const { data: docs } = await docQuery

  // Get opportunity titles
  const allOppIds = Array.from(
    new Set(
      [
        ...(compReqs ?? []).map((r) => r.opportunity_id),
        ...(clauses ?? []).map((c) => c.opportunity_id),
        ...(docs ?? []).map((d) => d.opportunity_id),
      ].filter((id): id is string => !!id)
    )
  )

  let oppMap: Record<string, string> = {}
  if (allOppIds.length > 0) {
    const { data: opps } = await supabase
      .from('opportunities')
      .select('id, title')
      .in('id', allOppIds)

    oppMap = Object.fromEntries((opps ?? []).map((o) => [o.id, o.title]))
  }

  // Fetch proposal outlines
  const { data: outlines } = await supabase
    .from('proposal_outlines')
    .select('id, outline_name, volume_type, status, opportunity_id, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  const outlineItems = (outlines ?? []).map((o) => ({
    ...o,
    opportunityTitle: o.opportunity_id ? oppMap[o.opportunity_id] ?? null : null,
  }))

  // Fetch opportunities for the create form
  const { data: allOpps } = await supabase
    .from('opportunities')
    .select('id, title')
    .in('status', ['Active', 'active', 'In Progress'])
    .order('updated_at', { ascending: false })
    .limit(50)

  // Merge into unified review items
  const items: ReviewItem[] = [
    ...(compReqs ?? []).map((r) => ({
      id: r.id,
      type: 'compliance' as const,
      title: `${r.reference}: ${(r.requirement ?? '').slice(0, 80)}`,
      description: r.requirement ?? '',
      status: r.status ?? 'Addressed',
      opportunityTitle: r.opportunity_id ? oppMap[r.opportunity_id] ?? null : null,
      opportunityId: r.opportunity_id,
      updatedAt: r.updated_at,
    })),
    ...(clauses ?? []).map((c) => ({
      id: c.id,
      type: 'contract' as const,
      title: `${c.clause_number}: ${c.clause_title ?? 'Untitled'}`,
      description: c.clause_title ?? '',
      status: c.compliance_status ?? 'Review Needed',
      opportunityTitle: c.opportunity_id ? oppMap[c.opportunity_id] ?? null : null,
      opportunityId: c.opportunity_id,
      updatedAt: c.updated_at,
    })),
    ...(docs ?? []).map((d) => ({
      id: d.id,
      type: 'document' as const,
      title: d.document_name,
      description: d.description ?? '',
      status: d.status ?? 'in_review',
      opportunityTitle: d.opportunity_id ? oppMap[d.opportunity_id] ?? null : null,
      opportunityId: d.opportunity_id,
      updatedAt: d.updated_at,
    })),
  ]

  // Sort by updated_at descending
  items.sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    return bTime - aTime
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Proposals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage proposal outlines and review pending items.
        </p>
      </div>

      {/* Proposal Outlines Section */}
      <ProposalOutlineList
        outlines={outlineItems}
        opportunities={(allOpps ?? []).map((o) => ({ id: o.id, title: o.title }))}
        canEdit={canEdit}
      />

      {/* Review Queue Section */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Review Queue</h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Total Pending
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">{items.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Compliance
          </p>
          <p className="mt-1 text-2xl font-bold text-blue-400">
            {items.filter((i) => i.type === 'compliance').length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Contracts
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-400">
            {items.filter((i) => i.type === 'contract').length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Documents
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {items.filter((i) => i.type === 'document').length}
          </p>
        </div>
      </div>

      <ReviewQueue items={items} canEdit={canEdit} />
    </div>
  )
}
