// filepath: app/(dashboard)/admin/models/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

const MODEL_CATALOG = [
  {
    id: 'claude-haiku',
    name: 'Claude Haiku 4.5',
    engine: 'AskSage (FedRAMP)',
    costPer1k: '$0.00025',
    maxTokens: '4,096',
    tasks: ['Summarize', 'Classify'],
    tier: 'Economy',
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet 4.5',
    engine: 'AskSage (FedRAMP)',
    costPer1k: '$0.003',
    maxTokens: '8,192',
    tasks: ['Chat', 'Compliance', 'Capture', 'Contracts'],
    tier: 'Standard',
  },
  {
    id: 'claude-opus',
    name: 'Claude Opus 4',
    engine: 'AskSage (FedRAMP)',
    costPer1k: '$0.015',
    maxTokens: '8,192',
    tasks: ['Strategy', 'Writer', 'Orals'],
    tier: 'Premium',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    engine: 'AskSage (FedRAMP)',
    costPer1k: '$0.005',
    maxTokens: '4,096',
    tasks: ['Pricing'],
    tier: 'Standard',
  },
]

const BUDGET_THRESHOLD = 75

export default async function ModelSelectionPage() {
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
  if (!hasPermission(role, 'admin', 'canView')) redirect('/dashboard')

  // Get current month's spend
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: usageRows } = await supabase
    .from('token_usage')
    .select('estimated_cost_usd')
    .gte('created_at', startOfMonth.toISOString())

  const monthlySpend = (usageRows ?? []).reduce(
    (sum, row) => sum + (row.estimated_cost_usd ?? 0),
    0
  )
  const budgetLimit = Number(process.env.AI_MONTHLY_BUDGET_USD ?? '500')
  const spendPct = budgetLimit > 0 ? (monthlySpend / budgetLimit) * 100 : 0
  const isOverThreshold = spendPct >= BUDGET_THRESHOLD

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Model Selection</h1>
        <p className="text-sm text-muted-foreground">
          Task-to-model mapping with automatic budget guard — models downgrade when spend exceeds {BUDGET_THRESHOLD}%
        </p>
      </div>

      {/* Budget card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="font-medium">Monthly AI Budget</p>
          <p className="text-sm text-muted-foreground">
            ${monthlySpend.toFixed(2)} / ${budgetLimit.toFixed(2)}
          </p>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all"
            style={{
              width: `${Math.min(100, spendPct)}%`,
              backgroundColor: spendPct > 90 ? '#EF4444' : spendPct > 75 ? '#F59E0B' : '#10B981',
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{spendPct.toFixed(1)}% used</span>
          {isOverThreshold && (
            <span className="text-yellow-500 font-medium">
              Budget guard active — models auto-downgraded
            </span>
          )}
        </div>
      </div>

      {/* Model catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {MODEL_CATALOG.map((model) => (
          <div key={model.id} className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{model.name}</h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor:
                    model.tier === 'Premium' ? '#7C3AED20' :
                    model.tier === 'Standard' ? '#3B82F620' : '#6B728020',
                  color:
                    model.tier === 'Premium' ? '#7C3AED' :
                    model.tier === 'Standard' ? '#3B82F6' : '#6B7280',
                }}
              >
                {model.tier}
              </span>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Engine: {model.engine}</p>
              <p>Cost: {model.costPer1k} per 1K tokens</p>
              <p>Max output: {model.maxTokens} tokens</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {model.tasks.map((task) => (
                <span
                  key={task}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium"
                >
                  {task}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Task routing table */}
      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Task Routing</h2>
          <p className="text-xs text-muted-foreground">
            Each AI agent is assigned a primary model with automatic fallback
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Agent</th>
                <th className="text-left p-3 font-medium">Primary Model</th>
                <th className="text-left p-3 font-medium">Fallback</th>
                <th className="text-left p-3 font-medium">CUI Routing</th>
              </tr>
            </thead>
            <tbody>
              {[
                { agent: 'Chat', primary: 'Claude Sonnet', fallback: 'Claude Haiku' },
                { agent: 'Strategy', primary: 'Claude Opus', fallback: 'Claude Sonnet' },
                { agent: 'Compliance', primary: 'Claude Sonnet', fallback: 'Claude Haiku' },
                { agent: 'Capture', primary: 'Claude Sonnet', fallback: 'Claude Haiku' },
                { agent: 'Writer', primary: 'Claude Opus', fallback: 'Claude Sonnet' },
                { agent: 'Contracts', primary: 'Claude Sonnet', fallback: 'Claude Haiku' },
                { agent: 'Orals', primary: 'Claude Opus', fallback: 'Claude Sonnet' },
                { agent: 'Pricing', primary: 'GPT-4o', fallback: 'Claude Sonnet' },
                { agent: 'Summarize', primary: 'Claude Haiku', fallback: 'Claude Haiku' },
                { agent: 'Classify', primary: 'Claude Haiku', fallback: 'Claude Haiku' },
              ].map((row) => (
                <tr key={row.agent} className="border-b last:border-0">
                  <td className="p-3 font-medium">{row.agent}</td>
                  <td className="p-3">{row.primary}</td>
                  <td className="p-3 text-muted-foreground">{row.fallback}</td>
                  <td className="p-3 text-xs text-cyan-500">AskSage only</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        All CUI-classified content routes exclusively through AskSage (FedRAMP IL5). Budget guard
        downgrades models at {BUDGET_THRESHOLD}% spend — e.g., Opus → Sonnet, Sonnet → Haiku.
      </p>
    </div>
  )
}
