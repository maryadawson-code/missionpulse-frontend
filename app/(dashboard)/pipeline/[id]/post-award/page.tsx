import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { PostAwardPanel } from '@/components/features/post-award/PostAwardPanel'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

interface Props {
  params: { id: string }
}

export default async function PostAwardPage({ params }: Props) {
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
  if (!hasPermission(role, 'pipeline', 'shouldRender')) {
    return null
  }

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, title, agency, status')
    .eq('id', params.id)
    .single()

  if (!opportunity) redirect('/pipeline')

  const { data: debriefs } = await supabase
    .from('debriefs')
    .select('id, outcome, strengths, weaknesses, evaluator_feedback, notes, debrief_date')
    .eq('opportunity_id', params.id)
    .order('debrief_date', { ascending: false })

  const { data: lessons } = await supabase
    .from('lessons_learned')
    .select('id, title, description, category, recommendation')
    .eq('opportunity_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opportunity.title, href: `/pipeline/${params.id}` },
          { label: 'Post-Award' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-white">
          Post-Award — {opportunity.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Win/loss tracking, debriefs, and lessons learned for{' '}
          {opportunity.agency ?? 'this opportunity'}.
        </p>
      </div>

      <PostAwardPanel
        opportunityId={opportunity.id}
        currentStatus={opportunity.status ?? 'active'}
        debriefs={debriefs ?? []}
        lessons={lessons ?? []}
      />
    </div>
  )
}
