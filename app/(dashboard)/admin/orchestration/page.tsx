// filepath: app/(dashboard)/admin/orchestration/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

const AGENTS = [
  {
    id: 'strategy',
    name: 'Strategy Agent',
    model: 'Claude Opus',
    description: 'Competitive analysis, win themes, and capture strategy',
    status: 'active',
  },
  {
    id: 'compliance',
    name: 'Compliance Agent',
    model: 'Claude Sonnet',
    description: 'FAR/DFARS clause analysis and compliance matrix generation',
    status: 'active',
  },
  {
    id: 'writer',
    name: 'Writer Agent',
    model: 'Claude Opus',
    description: 'Proposal section drafting with RFP-aligned content',
    status: 'active',
  },
  {
    id: 'pricing',
    name: 'Pricing Agent',
    model: 'GPT-4o',
    description: 'Price-to-win analysis, CLIN estimation, and rate modeling',
    status: 'active',
  },
  {
    id: 'contracts',
    name: 'Contracts Agent',
    model: 'Claude Sonnet',
    description: 'Contract clause risk assessment and negotiation points',
    status: 'active',
  },
  {
    id: 'orals',
    name: 'Orals Coach',
    model: 'Claude Opus',
    description: 'Presentation coaching, Q&A prep, and evaluator simulation',
    status: 'active',
  },
  {
    id: 'capture',
    name: 'Capture Agent',
    model: 'Claude Sonnet',
    description: 'Gate review preparation, pWin estimation, and decision support',
    status: 'active',
  },
  {
    id: 'chat',
    name: 'General Chat',
    model: 'Claude Sonnet',
    description: 'General-purpose assistant for GovCon queries',
    status: 'active',
  },
]

const WORKFLOWS = [
  {
    name: 'Full Proposal Cycle',
    agents: ['strategy', 'compliance', 'writer', 'pricing'],
    trigger: 'New RFP uploaded',
    description: 'Analyzes RFP → extracts compliance → generates sections → estimates pricing',
  },
  {
    name: 'Gate Review Prep',
    agents: ['capture', 'strategy', 'pricing'],
    trigger: 'Gate review scheduled',
    description: 'Compiles pWin assessment → competitive landscape → pricing snapshot',
  },
  {
    name: 'Contract Risk Scan',
    agents: ['compliance', 'contracts'],
    trigger: 'New contract uploaded',
    description: 'Extracts clauses → identifies risks → generates risk memo',
  },
]

export default async function OrchestrationPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agent Orchestration</h1>
        <p className="text-sm text-muted-foreground">
          Configure autonomous multi-agent workflows. Agents can be chained
          into pipelines triggered by events.
        </p>
      </div>

      {/* Agent catalog */}
      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Agent Catalog</h3>
          <p className="text-xs text-muted-foreground">
            8 specialized agents with task-optimized model selection
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
          {AGENTS.map((agent) => (
            <div key={agent.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{agent.name}</h4>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-muted-foreground">
                    {agent.status}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{agent.description}</p>
              <p className="text-[10px] text-cyan-400">Model: {agent.model}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow templates */}
      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Workflow Templates</h3>
          <p className="text-xs text-muted-foreground">
            Pre-built multi-agent pipelines triggered by platform events
          </p>
        </div>
        <div className="divide-y">
          {WORKFLOWS.map((wf, i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{wf.name}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                  {wf.trigger}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{wf.description}</p>
              <div className="flex items-center gap-2">
                {wf.agents.map((agentId, j) => {
                  const agent = AGENTS.find((a) => a.id === agentId)
                  return (
                    <span key={agentId} className="flex items-center gap-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">
                        {agent?.name ?? agentId}
                      </span>
                      {j < wf.agents.length - 1 && (
                        <span className="text-muted-foreground">→</span>
                      )}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Agent orchestration enables autonomous multi-step workflows. Each agent in a pipeline
        receives the output of the previous agent as context. All executions are logged to the
        audit trail and consume tokens from the company&apos;s allocation.
      </p>
    </div>
  )
}
