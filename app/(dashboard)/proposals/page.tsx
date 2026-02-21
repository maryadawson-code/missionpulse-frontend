import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { ReviewQueue } from '@/components/features/hitl/ReviewQueue'

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
    redirect('/')
  }

  // Fetch compliance requirements needing review (status = 'Addressed' but not 'Verified')
  const { data: compReqs } = await supabase
    .from('compliance_requirements')
    .select('id, reference, requirement, status, opportunity_id, updated_at')
    .eq('status', 'Addressed')
    .order('updated_at', { ascending: false })
    .limit(50)

  // Fetch contract clauses needing review
  const { data: clauses } = await supabase
    .from('contract_clauses')
    .select('id, clause_number, clause_title, compliance_status, opportunity_id, updated_at')
    .eq('compliance_status', 'Review Needed')
    .order('updated_at', { ascending: false })
    .limit(50)

  // Fetch documents needing review
  const { data: docs } = await supabase
    .from('documents')
    .select('id, document_name, description, status, opportunity_id, updated_at')
    .eq('status', 'in_review')
    .order('updated_at', { ascending: false })
    .limit(50)

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Review Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Items pending human review. Approve, reject, or request changes.
        </p>
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

      <ReviewQueue items={items} />
    </div>
  )
}
