// filepath: app/(dashboard)/pricing/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { CUIBanner } from '@/components/rbac/CUIBanner'

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatRate(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function statusColor(status: string | null): string {
  switch (status) {
    case 'approved':
    case 'final':
      return 'bg-emerald-500/20 text-emerald-300'
    case 'in_review':
    case 'review':
      return 'bg-amber-500/20 text-amber-300'
    case 'draft':
      return 'bg-slate-500/20 text-slate-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'pricing', 'shouldRender')) {
    redirect('/dashboard')
  }

  // Fetch pricing models
  const { data: models, error: modelsError } = await supabase
    .from('pricing_models')
    .select('id, name, contract_type, status, version, total_price, total_direct_labor, base_period_months, updated_at')
    .order('updated_at', { ascending: false })
    .limit(20)

  // Fetch pricing line items
  const { data: items, error: itemsError } = await supabase
    .from('pricing_items')
    .select('id, description, clin, labor_category, unit, quantity, unit_price, proposed_rate, gsa_rate, extended_price, basis_of_estimate, updated_at')
    .order('clin', { ascending: true })
    .limit(100)

  const modelList = models ?? []
  const itemList = items ?? []
  const totalValue = modelList.reduce((sum, m) => sum + (m.total_price ?? 0), 0)

  return (
    <div className="space-y-6">
      <CUIBanner marking="SP-PROPIN" />
      <div>
        <h1 className="text-2xl font-bold text-white">Pricing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Build and manage government contract pricing models, rate tables, and cost estimates.
        </p>
      </div>

      {(modelsError || itemsError) && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load pricing data: {modelsError?.message ?? itemsError?.message}
        </div>
      )}

      {/* Pricing Models */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Pricing Models</h2>
            <p className="text-xs text-gray-500 mt-1">Contract pricing structures and cost volumes</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total Modeled Value</p>
            <p className="text-lg font-bold font-mono text-[#00E5FA]">{formatCurrency(totalValue)}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Model Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Contract Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Version</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Total Price</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Direct Labor</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Period (mo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {modelList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    No pricing models created yet. Models will appear as cost volumes are developed.
                  </td>
                </tr>
              ) : (
                modelList.map((model) => (
                  <tr key={model.id} className="transition-colors hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-200">{model.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {(model.contract_type ?? 'FFP').replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(model.status)}`}>
                        {(model.status ?? 'draft').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">{model.version ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-200">{formatCurrency(model.total_price)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-300">{formatCurrency(model.total_direct_labor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">{model.base_period_months ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Line Items */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Pricing Line Items</h2>
          <p className="text-xs text-gray-500 mt-1">CLIN-level pricing with labor categories and rates</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">CLIN</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Description</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Labor Cat</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Qty</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Unit Price</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Proposed Rate</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Extended</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {itemList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    No line items yet. Add CLINs and labor categories to build out pricing.
                  </td>
                </tr>
              ) : (
                itemList.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-gray-800/30">
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-300">{item.clin ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-200 max-w-xs truncate">{item.description}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">{item.labor_category ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-400">
                      {item.quantity ?? '—'} {item.unit ?? ''}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-400">{formatRate(item.unit_price)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-300">{formatRate(item.proposed_rate)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-200">{formatCurrency(item.extended_price)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        {modelList.length} pricing model{modelList.length !== 1 ? 's' : ''}, {itemList.length} line item{itemList.length !== 1 ? 's' : ''}. Pricing data is classified CUI//SP-PROPIN.
      </p>
    </div>
  )
}
