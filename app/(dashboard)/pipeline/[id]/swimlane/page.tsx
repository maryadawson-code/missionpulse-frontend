// filepath: app/(dashboard)/pipeline/[id]/swimlane/page.tsx

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SwimlaneBoard } from '@/components/features/swimlane/SwimlaneBoard'

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
      <div>
        <h1 className="text-2xl font-bold text-white">Swimlane</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {opportunity.title} — {(sections ?? []).length} section{(sections ?? []).length === 1 ? '' : 's'}
        </p>
      </div>

      <SwimlaneBoard
        opportunityId={id}
        sections={sections ?? []}
        teamMembers={teamMembers ?? []}
      />
    </div>
  )
}
