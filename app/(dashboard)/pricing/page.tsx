// filepath: app/(dashboard)/pricing/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { CUIBanner } from '@/components/rbac/CUIBanner'
import { PricingPageClient } from './PricingPageClient'

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
    return null
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

  // Fetch labor categories (company-wide)
  const { data: lcats } = await supabase
    .from('labor_categories')
    .select('id, family, level_name, level, gsa_lcat, bill_rate_low, bill_rate_high, years_experience')
    .order('family', { ascending: true })
    .order('level', { ascending: true })
    .limit(200)

  // Aggregate ceiling for price-to-win reference
  const { data: ceilingAgg } = await supabase
    .from('opportunities')
    .select('ceiling')
    .in('status', ['Active', 'active', 'In Progress'])

  const totalCeiling = (ceilingAgg ?? []).reduce(
    (sum, o) => sum + (o.ceiling ? Number(o.ceiling) : 0),
    0
  )

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

      <PricingPageClient
        models={models ?? []}
        items={items ?? []}
        lcats={lcats ?? []}
        pipelineCeiling={totalCeiling}
      />
    </div>
  )
}
