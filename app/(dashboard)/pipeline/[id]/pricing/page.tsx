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

  // Fetch ODCs (Other Direct Costs)
  const volumeIds = (costVolumes ?? []).map((v) => v.id)
  let odcs: { id: string; category: string; description: string | null; quantity: number | null; unit_cost: number | null; total_cost: number | null; period: string | null; recurring: boolean | null }[] = []
  if (volumeIds.length > 0) {
    const { data: odcData } = await supabase
      .from('cost_odcs')
      .select('id, category, description, quantity, unit_cost, total_cost, period, recurring')
      .in('cost_volume_id', volumeIds)
      .order('category', { ascending: true })
    odcs = odcData ?? []
  }

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

      {/* Other Direct Costs */}
      {odcs.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Other Direct Costs ({odcs.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-2 py-1.5 font-medium text-gray-500">Category</th>
                  <th className="px-2 py-1.5 font-medium text-gray-500">Description</th>
                  <th className="px-2 py-1.5 font-medium text-gray-500 text-right">Qty</th>
                  <th className="px-2 py-1.5 font-medium text-gray-500 text-right">Unit Cost</th>
                  <th className="px-2 py-1.5 font-medium text-gray-500 text-right">Total</th>
                  <th className="px-2 py-1.5 font-medium text-gray-500">Period</th>
                </tr>
              </thead>
              <tbody>
                {odcs.map((odc) => (
                  <tr key={odc.id} className="border-b border-gray-800/50">
                    <td className="px-2 py-1.5 text-white font-medium">{odc.category}</td>
                    <td className="px-2 py-1.5 text-gray-400">{odc.description ?? '—'}</td>
                    <td className="px-2 py-1.5 text-gray-300 text-right">{odc.quantity ?? '—'}</td>
                    <td className="px-2 py-1.5 text-gray-300 text-right">
                      {odc.unit_cost != null
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(odc.unit_cost)
                        : '—'}
                    </td>
                    <td className="px-2 py-1.5 text-white font-medium text-right">
                      {odc.total_cost != null
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(odc.total_cost)
                        : '—'}
                    </td>
                    <td className="px-2 py-1.5 text-gray-400">
                      {odc.period ?? '—'}
                      {odc.recurring && (
                        <span className="ml-1 rounded bg-blue-500/15 px-1 py-0.5 text-[10px] text-blue-300">
                          recurring
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-700">
                  <td colSpan={4} className="px-2 py-1.5 font-semibold text-gray-400 text-right">Total ODCs</td>
                  <td className="px-2 py-1.5 font-bold text-white text-right">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      odcs.reduce((s, o) => s + (o.total_cost ?? 0), 0)
                    )}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

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
