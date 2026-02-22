import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { LaunchControl } from '@/components/features/launch/LaunchControl'

interface Props {
  params: { id: string }
}

export default async function LaunchPage({ params }: Props) {
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
    .select('id, title, agency, status, pwin, due_date')
    .eq('id', params.id)
    .single()

  if (!opportunity) redirect('/pipeline')

  // Compliance status
  const { data: requirements } = await supabase
    .from('compliance_requirements')
    .select('id, status')
    .eq('opportunity_id', params.id)

  const totalReqs = requirements?.length ?? 0
  const verifiedReqs = requirements?.filter((r) => r.status === 'verified' || r.status === 'addressed').length ?? 0
  const compliancePct = totalReqs > 0 ? Math.round((verifiedReqs / totalReqs) * 100) : 0

  // Gate decisions
  const { data: gateDecisions } = await supabase
    .from('gate_reviews')
    .select('id, gate_name, gate_number, decision, pwin_at_gate, conditions, created_at')
    .eq('opportunity_id', params.id)
    .order('gate_number', { ascending: true })

  // Team members count
  const { count: teamCount } = await supabase
    .from('opportunity_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('opportunity_id', params.id)

  // Documents count
  const { count: docCount } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('opportunity_id', params.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Launch Control — {opportunity.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Submission readiness dashboard for {opportunity.agency ?? 'this opportunity'}.
        </p>
      </div>

      <LaunchControl
        opportunity={{
          id: opportunity.id,
          title: opportunity.title,
          status: opportunity.status ?? 'draft',
          pwin: opportunity.pwin ?? 0,
          dueDate: opportunity.due_date ?? null,
        }}
        complianceStats={{
          total: totalReqs,
          verified: verifiedReqs,
          percentage: compliancePct,
        }}
        gateDecisions={(gateDecisions ?? []).map((g) => ({
          id: g.id,
          gateName: g.gate_name ?? `Gate ${g.gate_number}`,
          gateNumber: g.gate_number ?? 0,
          decision: g.decision ?? 'pending',
          pwinAtGate: g.pwin_at_gate ?? null,
          conditions: Array.isArray(g.conditions) ? g.conditions as string[] : [],
          createdAt: g.created_at ?? '',
        }))}
        teamCount={teamCount ?? 0}
        docCount={docCount ?? 0}
      />
    </div>
  )
}
