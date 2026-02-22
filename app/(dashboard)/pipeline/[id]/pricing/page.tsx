import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { CUIBanner } from '@/components/rbac/CUIBanner'
import { CostVolumeManager } from '@/components/features/pricing/CostVolumeManager'
import { PricingAI } from '@/components/features/pricing/PricingAI'

interface Props {
  params: { id: string }
}

export default async function OpportunityPricingPage({ params }: Props) {
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
  if (!hasPermission(role, 'pricing', 'shouldRender')) {
    return null
  }

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, title, agency, description, naics_code, set_aside, ceiling')
    .eq('id', params.id)
    .single()

  if (!opportunity) redirect('/pipeline')

  // Fetch cost volumes with labor categories
  const { data: costVolumes } = await supabase
    .from('cost_volumes')
    .select('id, volume_name, status, contract_type, base_period_months, fringe_rate, overhead_rate, ga_rate, wrap_rate, fee_percent, direct_labor_total, total_proposed, cost_labor_categories(id, labor_category, level, headcount, hourly_rate, loaded_rate, annual_hours, total_hours, total_cost, sort_order)')
    .eq('opportunity_id', params.id)
    .order('created_at', { ascending: true })

  // Fetch compliance requirements for context
  const { data: requirements } = await supabase
    .from('compliance_requirements')
    .select('requirement')
    .eq('opportunity_id', params.id)
    .limit(20)

  return (
    <div className="space-y-6">
      <CUIBanner marking="SP-PROPIN" />

      {/* CUI Watermark overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.03,
          fontSize: '6rem',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          color: '#f59e0b',
          transform: 'rotate(-30deg)',
          userSelect: 'none',
        }}
      >
        CUI//SP-PROPIN
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">
          Pricing — {opportunity.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Build cost volumes, manage labor categories, and generate BOE for{' '}
          {opportunity.agency ?? 'this opportunity'}.
        </p>
      </div>

      <CostVolumeManager
        opportunityId={opportunity.id}
        costVolumes={(costVolumes ?? []).map((v) => ({
          ...v,
          cost_labor_categories: v.cost_labor_categories ?? [],
        }))}
      />

      <PricingAI
        opportunity={{
          id: opportunity.id,
          title: opportunity.title ?? '',
          agency: opportunity.agency ?? 'Unknown',
          description: opportunity.description ?? '',
          naicsCode: opportunity.naics_code,
          ceiling: opportunity.ceiling,
        }}
        requirements={(requirements ?? []).map((r) => r.requirement)}
        existingLCATs={(costVolumes ?? []).flatMap((v) =>
          (v.cost_labor_categories ?? []).map((l) => l.labor_category)
        )}
      />
    </div>
  )
}
