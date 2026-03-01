import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { getCacheMetrics } from '@/lib/cache/semantic-cache'
import { Skeleton } from '@/components/ui/skeleton'

const AIUsageAnalytics = dynamic(
  () => import('@/components/features/analytics/AIUsageAnalytics').then((m) => m.AIUsageAnalytics),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
  }
)

export default async function AIUsageAnalyticsPage() {
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
  if (!hasPermission(role, 'analytics', 'canView')) {
    redirect('/dashboard')
  }

  // Fetch last 90 days of token usage
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: entries } = await supabase
    .from('token_usage')
    .select(
      'id, agent_id, input_tokens, output_tokens, estimated_cost_usd, created_at, opportunity_id, metadata'
    )
    .gte('created_at', ninetyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(2000)

  // Fetch opportunities for cost-per-proposal mapping
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, title')

  const oppMap: Record<string, string> = {}
  for (const opp of opportunities ?? []) {
    oppMap[opp.id] = opp.title ?? opp.id.slice(0, 8)
  }

  // Cache metrics
  const cacheMetrics = await getCacheMetrics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          AI Usage Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Token costs by model, cost per proposal, agent distribution, and
          cache performance.
        </p>
      </div>

      <AIUsageAnalytics
        entries={entries ?? []}
        opportunityMap={oppMap}
        cacheMetrics={cacheMetrics}
      />
    </div>
  )
}
