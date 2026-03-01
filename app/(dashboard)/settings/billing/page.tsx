import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { getPlans, getCompanySubscription } from '@/lib/billing/plans'
import { getTokenBalance } from '@/lib/billing/ledger'
import { BillingDashboard } from './BillingDashboard'

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'admin', 'canView')) {
    redirect('/dashboard')
  }

  const companyId = profile?.company_id
  const isExecutive = ['executive', 'admin', 'CEO', 'COO'].includes(role)

  const plans = await getPlans()
  const subscription = companyId
    ? await getCompanySubscription(companyId)
    : null
  const balance = companyId ? await getTokenBalance(companyId) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your plan, purchase tokens, and view billing history.
        </p>
      </div>

      <BillingDashboard
        plans={plans.map((p) => ({
          slug: p.slug,
          name: p.name,
          monthly_price: p.monthly_price,
          annual_price: p.annual_price,
          monthly_token_limit: p.monthly_token_limit,
          max_users: p.max_users,
          max_opportunities: p.max_opportunities,
          features: p.features as unknown as Record<string, boolean>,
        }))}
        currentPlanSlug={subscription?.plan?.slug ?? null}
        billingInterval={subscription?.billing_interval ?? 'monthly'}
        balance={balance}
        isExecutive={isExecutive}
        autoOverageEnabled={subscription?.auto_overage_enabled ?? false}
      />
    </div>
  )
}
