import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { getTokenBalance } from '@/lib/billing/ledger'
import TokenUsageClient from './TokenUsageClient'

interface AgentBreakdown {
  agent: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
  count: number
}

interface UserBreakdown {
  userId: string
  email: string
  totalTokens: number
  cost: number
  count: number
}

interface DailyTrend {
  date: string
  tokens: number
  cost: number
}

export default async function TokenUsagePage() {
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
  if (!hasPermission(role, 'analytics', 'shouldRender')) redirect('/dashboard')

  const companyId = profile?.company_id
  const balance = companyId ? await getTokenBalance(companyId) : null

  // Fetch token_usage rows for this billing period
  const periodStart = balance?.period_start ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  // Get all usage rows in this user's company (via the user IDs in the company)
  const { data: companyProfiles } = companyId
    ? await supabase
        .from('profiles')
        .select('id, email:id')
        .eq('company_id', companyId)
    : { data: null }

  const userIds = companyProfiles?.map((p) => p.id) ?? [user.id]

  const { data: usageRows } = await supabase
    .from('token_usage')
    .select('agent_id, input_tokens, output_tokens, estimated_cost_usd, user_id, created_at')
    .in('user_id', userIds)
    .gte('created_at', periodStart)
    .order('created_at', { ascending: false })
    .limit(10000)

  // Look up user emails
  const uniqueUserIds = Array.from(new Set((usageRows ?? []).map((r) => r.user_id)))
  let userEmailMap = new Map<string, string>()
  if (uniqueUserIds.length > 0) {
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', uniqueUserIds)

    if (userProfiles) {
      userEmailMap = new Map(
        userProfiles.map((p) => [
          p.id,
          (p.email as string) ?? p.id.slice(0, 8),
        ])
      )
    }
  }

  // Compute per-agent breakdown
  const agentMap = new Map<string, AgentBreakdown>()
  for (const row of usageRows ?? []) {
    const total = (row.input_tokens ?? 0) + (row.output_tokens ?? 0)
    const existing = agentMap.get(row.agent_id)
    if (existing) {
      existing.inputTokens += row.input_tokens ?? 0
      existing.outputTokens += row.output_tokens ?? 0
      existing.totalTokens += total
      existing.cost += row.estimated_cost_usd ?? 0
      existing.count += 1
    } else {
      agentMap.set(row.agent_id, {
        agent: row.agent_id,
        inputTokens: row.input_tokens ?? 0,
        outputTokens: row.output_tokens ?? 0,
        totalTokens: total,
        cost: row.estimated_cost_usd ?? 0,
        count: 1,
      })
    }
  }

  // Compute per-user breakdown
  const userMap = new Map<string, UserBreakdown>()
  for (const row of usageRows ?? []) {
    const total = (row.input_tokens ?? 0) + (row.output_tokens ?? 0)
    const existing = userMap.get(row.user_id)
    if (existing) {
      existing.totalTokens += total
      existing.cost += row.estimated_cost_usd ?? 0
      existing.count += 1
    } else {
      userMap.set(row.user_id, {
        userId: row.user_id,
        email: userEmailMap.get(row.user_id) ?? row.user_id.slice(0, 8),
        totalTokens: total,
        cost: row.estimated_cost_usd ?? 0,
        count: 1,
      })
    }
  }

  // Compute daily trend (last 30 days)
  const dayMap = new Map<string, { tokens: number; cost: number }>()
  for (const row of usageRows ?? []) {
    const day = (row.created_at ?? '').slice(0, 10)
    if (!day) continue
    const total = (row.input_tokens ?? 0) + (row.output_tokens ?? 0)
    const existing = dayMap.get(day)
    if (existing) {
      existing.tokens += total
      existing.cost += row.estimated_cost_usd ?? 0
    } else {
      dayMap.set(day, { tokens: total, cost: row.estimated_cost_usd ?? 0 })
    }
  }

  const perAgent = Array.from(agentMap.values()).sort((a, b) => b.totalTokens - a.totalTokens)
  const perUser = Array.from(userMap.values()).sort((a, b) => b.totalTokens - a.totalTokens)
  const dailyTrend: DailyTrend[] = Array.from(dayMap.entries())
    .map(([date, v]) => ({ date, tokens: v.tokens, cost: v.cost }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const totalTokens = perAgent.reduce((sum, a) => sum + a.totalTokens, 0)
  const totalCost = perAgent.reduce((sum, a) => sum + a.cost, 0)

  return (
    <TokenUsageClient
      balance={balance}
      totalTokens={totalTokens}
      totalCost={totalCost}
      perAgent={perAgent}
      perUser={perUser}
      dailyTrend={dailyTrend}
    />
  )
}
