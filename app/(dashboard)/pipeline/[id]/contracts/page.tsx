import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { ContractScanner } from '@/components/features/contracts/ContractScanner'
import { AIClauseAnalysis } from '@/components/features/contracts/AIClauseAnalysis'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

interface ContractsPageProps {
  params: Promise<{ id: string }>
}

export default async function ContractsPage({ params }: ContractsPageProps) {
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
  if (!hasPermission(role, 'compliance', 'shouldRender')) return null

  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .select('id, title')
    .eq('id', id)
    .single()

  if (oppError || !opportunity) notFound()

  const { data: clauses } = await supabase
    .from('contract_clauses')
    .select(
      'id, clause_number, clause_title, clause_type, full_text, risk_level, compliance_status, notes, reviewed_at, reviewed_by, created_at, updated_at'
    )
    .eq('opportunity_id', id)
    .order('clause_number', { ascending: true })

  const items = clauses ?? []
  const compliant = items.filter((c) => c.compliance_status === 'Compliant').length
  const reviewNeeded = items.filter((c) => c.compliance_status === 'Review Needed').length
  const highRisk = items.filter((c) => c.risk_level === 'High').length

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opportunity.title, href: `/pipeline/${id}` },
          { label: 'Contracts' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contract Scanner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {opportunity.title} — {items.length} clause{items.length !== 1 ? 's' : ''} tracked
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Clauses</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{items.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Compliant</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{compliant}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Review Needed</p>
          <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{reviewNeeded}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">High Risk</p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{highRisk}</p>
        </div>
      </div>

      {/* AI Clause Analysis */}
      <AIClauseAnalysis
        clauses={items.map((c) => ({
          id: c.id,
          clause_number: c.clause_number,
          clause_title: c.clause_title ?? '',
          full_text: c.full_text,
        }))}
        opportunityId={id}
      />

      <ContractScanner clauses={items} opportunityId={id} />
    </div>
  )
}
