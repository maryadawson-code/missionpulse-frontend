// filepath: app/(dashboard)/pipeline/[id]/swimlane/page.tsx

import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'

const SwimlaneBoard = dynamic(
  () => import('@/components/features/swimlane/SwimlaneBoard').then((m) => m.SwimlaneBoard),
  {
    loading: () => (
      <div className="grid grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    ),
  }
)

interface SwimlanePageProps {
  params: Promise<{ id: string }>
}

export default async function SwimlanePage({ params }: SwimlanePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'proposals', 'shouldRender')) return null
  const canEdit = hasPermission(role, 'proposals', 'canEdit')

  // Verify opportunity exists (RLS-enforced)
  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .select('id, title')
    .eq('id', id)
    .single()

  if (oppError || !opportunity) notFound()

  // Fetch proposal sections for this opportunity
  const { data: sections } = await supabase
    .from('proposal_sections')
    .select('id, section_title, volume, status, due_date, writer_id, reviewer_id, sort_order')
    .eq('opportunity_id', id)
    .order('sort_order', { ascending: true })

  // Fetch team members for owner assignment dropdown
  const { data: teamMembers } = await supabase
    .from('opportunity_assignments')
    .select('assignee_name, assignee_email')
    .eq('opportunity_id', id)

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Pipeline', href: '/pipeline' },
        { label: opportunity.title, href: `/pipeline/${id}` },
        { label: 'Swimlane' },
      ]} />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Swimlane</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {opportunity.title} — {(sections ?? []).length} section{(sections ?? []).length === 1 ? '' : 's'}
        </p>
      </div>

      <SwimlaneBoard
        opportunityId={id}
        sections={sections ?? []}
        teamMembers={teamMembers ?? []}
        canEdit={canEdit}
      />
    </div>
  )
}
