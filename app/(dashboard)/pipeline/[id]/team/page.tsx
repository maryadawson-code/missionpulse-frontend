// filepath: app/(dashboard)/pipeline/[id]/team/page.tsx

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TeamList } from '@/components/features/team/TeamList'

interface TeamPageProps {
  params: Promise<{ id: string }>
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .select('id, title')
    .eq('id', id)
    .single()

  if (oppError || !opportunity) notFound()

  const { data: assignments } = await supabase
    .from('opportunity_assignments')
    .select('id, assignee_name, assignee_email, role, created_at')
    .eq('opportunity_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {opportunity.title} — {(assignments ?? []).length} member{(assignments ?? []).length === 1 ? '' : 's'}
        </p>
      </div>

      <TeamList
        opportunityId={id}
        assignments={assignments ?? []}
      />
    </div>
  )
}
