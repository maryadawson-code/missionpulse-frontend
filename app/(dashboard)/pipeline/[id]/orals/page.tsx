import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { OralsPrep } from '@/components/features/orals/OralsPrep'

interface Props {
  params: { id: string }
}

export default async function OralsPage({ params }: Props) {
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

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, title, agency, description')
    .eq('id', params.id)
    .single()

  if (!opportunity) redirect('/pipeline')

  // Fetch compliance requirements for context
  const { data: requirements } = await supabase
    .from('compliance_requirements')
    .select('requirement')
    .eq('opportunity_id', params.id)
    .limit(20)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Orals Preparation</h1>
        <p className="mt-1 text-sm text-gray-500">
          AI-generated evaluator questions, coaching tips, and speaker notes for{' '}
          {opportunity.title}.
        </p>
      </div>

      <OralsPrep
        opportunity={{
          id: opportunity.id,
          title: opportunity.title ?? '',
          agency: opportunity.agency ?? 'Unknown',
          description: opportunity.description ?? '',
        }}
        requirements={(requirements ?? []).map((r) => r.requirement)}
      />
    </div>
  )
}
