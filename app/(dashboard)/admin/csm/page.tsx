// filepath: app/(dashboard)/admin/csm/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

export default async function CSMDashboardPage() {
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
  if (!hasPermission(role, 'admin', 'canView')) redirect('/dashboard')

  const companyId = profile?.company_id ?? ''

  // Enterprise tier gate
  const { data: subscription } = await supabase
    .from('company_subscriptions')
    .select('plan_id')
    .eq('company_id', companyId)
    .single()

  const { data: planData } = subscription?.plan_id
    ? await supabase.from('subscription_plans').select('slug').eq('id', subscription.plan_id).single()
    : { data: null }

  if (planData?.slug !== 'enterprise') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Customer Success Dashboard</h1>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground mb-4">Customer Success Management is available on the Enterprise plan.</p>
          <a href="/plans" className="text-[#00E5FA] hover:underline">Upgrade to Enterprise →</a>
        </div>
      </div>
    )
  }

  // Get key metrics for CSM overview
  const [
    { count: totalUsers },
    { count: activeOpps },
    { count: totalProposals },
    { count: aiQueries },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
    supabase
      .from('opportunities')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .in('phase', ['Capture Planning', 'Proposal Development']),
    supabase
      .from('opportunities')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
    supabase
      .from('ai_interactions')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
  ])

  // Get recent activity
  const { data: recentActivity } = await supabase
    .from('activity_feed')
    .select('action_type, description, created_at, entity_type')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customer Success Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Account health overview — platform adoption, engagement, and usage metrics
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-5">
          <p className="text-xs text-muted-foreground">Team Members</p>
          <p className="text-3xl font-bold">{totalUsers ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-xs text-muted-foreground">Active Opportunities</p>
          <p className="text-3xl font-bold text-cyan-400">{activeOpps ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-xs text-muted-foreground">Total Proposals</p>
          <p className="text-3xl font-bold">{totalProposals ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-xs text-muted-foreground">AI Queries</p>
          <p className="text-3xl font-bold text-cyan-400">{aiQueries ?? 0}</p>
        </div>
      </div>

      {/* Health indicators */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-4">Account Health Indicators</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Platform Adoption</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${Math.min(100, (totalUsers ?? 0) * 20)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {totalUsers ?? 0} users
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">AI Engagement</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-cyan-400"
                  style={{ width: `${Math.min(100, (aiQueries ?? 0) / 5)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {aiQueries ?? 0} queries
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Pipeline Activity</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${Math.min(100, (activeOpps ?? 0) * 10)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {activeOpps ?? 0} active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Recent Activity</h3>
        </div>
        <div className="divide-y">
          {(recentActivity ?? []).length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No recent activity recorded.
            </div>
          ) : (
            (recentActivity ?? []).map((item, i) => (
              <div key={i} className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm">{item.description ?? item.action_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.entity_type} &middot; {item.action_type}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
