import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { TokenUsageCharts } from '@/components/features/admin/TokenUsageCharts'

const MONTHLY_BUDGET = Number(process.env.AI_MONTHLY_BUDGET_USD ?? '500')

export default async function AIUsagePage() {
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
  // Only executive, operations, admin can see token usage
  if (!hasPermission(role, 'admin', 'canView')) {
    redirect('/')
  }

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Usage Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Token consumption, cost tracking, and budget monitoring for AI
          operations.
        </p>
      </div>

      <TokenUsageCharts
        entries={entries ?? []}
        monthlyBudget={MONTHLY_BUDGET}
      />
    </div>
  )
}
