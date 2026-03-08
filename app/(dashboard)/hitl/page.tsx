import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { ReviewQueue } from '@/components/features/hitl/ReviewQueue'

export default async function HITLPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'workflow_board', 'shouldRender')) redirect('/dashboard')

  const canEdit = hasPermission(role, 'workflow_board', 'canEdit')

  // Query HITL queue items for this company
  const companyId = profile?.company_id
  let items: {
    id: string
    type: 'compliance' | 'contract' | 'document'
    title: string
    description: string
    status: string
    opportunityTitle: string | null
    opportunityId: string | null
    updatedAt: string | null
  }[] = []

  if (companyId) {
    const { data: queueItems } = await supabase
      .from('hitl_queue')
      .select(
        'id, content_type, section, ai_output, status, opportunity_id, updated_at, confidence_score, priority'
      )
      .eq('company_id', companyId)
      .in('status', ['pending', 'in_review', 'changes_requested'])
      .order('updated_at', { ascending: false })
      .limit(100)

    if (queueItems) {
      // Look up opportunity titles for display
      const oppIds = Array.from(
        new Set(queueItems.map((q) => q.opportunity_id).filter(Boolean))
      ) as string[]
      let oppMap = new Map<string, string>()

      if (oppIds.length > 0) {
        const { data: opps } = await supabase
          .from('opportunities')
          .select('id, title')
          .in('id', oppIds)

        if (opps) {
          oppMap = new Map(opps.map((o) => [o.id, o.title ?? 'Untitled']))
        }
      }

      items = queueItems.map((q) => ({
        id: q.id,
        type: mapContentType(q.content_type),
        title: q.section ?? 'Untitled',
        description: (q.ai_output ?? '').slice(0, 200),
        status: q.status ?? 'pending',
        opportunityTitle: q.opportunity_id
          ? oppMap.get(q.opportunity_id) ?? null
          : null,
        opportunityId: q.opportunity_id ?? null,
        updatedAt: q.updated_at,
      }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Human-in-the-Loop Review
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-generated content requiring human approval before use in proposals.
        </p>
      </div>

      <ReviewQueue items={items} canEdit={canEdit} />
    </div>
  )
}

function mapContentType(
  contentType: string
): 'compliance' | 'contract' | 'document' {
  switch (contentType) {
    case 'compliance':
      return 'compliance'
    case 'contract':
    case 'clause':
      return 'contract'
    default:
      return 'document'
  }
}
