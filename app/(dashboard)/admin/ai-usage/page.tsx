import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { TokenUsageCharts } from '@/components/features/admin/TokenUsageCharts'
import { TokenGauge } from '@/components/features/admin/TokenGauge'
import { BurnRateProjection } from '@/components/features/admin/BurnRateProjection'
import { getCompanySubscription } from '@/lib/billing/plans'
import { getTokenBalance } from '@/lib/billing/ledger'
import { getBurnRateProjection } from '@/lib/billing/burn-rate'

const MONTHLY_BUDGET = Number(process.env.AI_MONTHLY_BUDGET_USD ?? '500')

export default async function AIUsagePage() {
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

  // Get current month start
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: entries } = await supabase
    .from('token_usage')
    .select(
      'id, agent_id, input_tokens, output_tokens, estimated_cost_usd, created_at, metadata'
    )
    .gte('created_at', startOfMonth.toISOString())
    .order('created_at', { ascending: false })
    .limit(500)

  // Plan-aware data (if company has a subscription)
  const subscription = companyId
    ? await getCompanySubscription(companyId)
    : null
  const balance = companyId ? await getTokenBalance(companyId) : null
  const burnRate = companyId
    ? await getBurnRateProjection(companyId)
    : null

  const planName = subscription?.plan?.name ?? 'No Plan'
  const usagePercent = balance?.usage_percent ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Usage Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Token consumption, budget monitoring, and burn rate projection.
        </p>
      </div>

      {/* Plan-aware gauge + burn rate */}
      {balance && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TokenGauge
            consumed={balance.consumed}
            allocated={balance.allocated}
            purchased={balance.purchased}
            planName={planName}
            usagePercent={usagePercent}
            showUpgradeCta={usagePercent >= 75}
          />
          {burnRate && (
            <BurnRateProjection
              avgDailyTokens={burnRate.avg_daily_tokens}
              projectedExhaustionDate={burnRate.projected_exhaustion_date}
              daysRemaining={burnRate.days_remaining}
              periodEnd={balance.period_end}
            />
          )}
        </div>
      )}

      <TokenUsageCharts
        entries={entries ?? []}
        monthlyBudget={MONTHLY_BUDGET}
      />
    </div>
  )
}
