/**
 * Autonomous Agent Orchestrator — Multi-Agent Pipeline
 * Sprint 35 (T-35.1) — Phase L v2.0
 *
 * Coordinates multi-agent workflows where specialized agents
 * (strategy, compliance, writer, pricing, etc.) execute in
 * sequence or parallel based on workflow templates.
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'
import type { TaskType, AIResponse } from '@/lib/ai/types'

// ─── Types ──────────────────────────────────────────────────────

export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export interface AgentStep {
  agentId: TaskType
  label: string
  dependsOn: TaskType[]
  status: AgentStatus
  result: AIResponse | null
  startedAt: string | null
  completedAt: string | null
  error: string | null
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  steps: Array<{
    agentId: TaskType
    label: string
    dependsOn: TaskType[]
  }>
}

export interface OrchestrationRun {
  id: string
  templateId: string
  opportunityId: string
  companyId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  steps: AgentStep[]
  startedAt: string
  completedAt: string | null
}

// ─── Built-in Workflow Templates ────────────────────────────────

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'full-proposal',
    name: 'Full Proposal Cycle',
    description: 'Complete proposal development from strategy to pricing',
    steps: [
      { agentId: 'strategy', label: 'Capture Strategy', dependsOn: [] },
      { agentId: 'compliance', label: 'Compliance Analysis', dependsOn: [] },
      { agentId: 'writer', label: 'Technical Volume', dependsOn: ['strategy'] },
      { agentId: 'pricing', label: 'Cost Model', dependsOn: ['writer'] },
      { agentId: 'contracts', label: 'Contract Review', dependsOn: ['compliance'] },
      { agentId: 'orals', label: 'Orals Preparation', dependsOn: ['writer', 'pricing'] },
    ],
  },
  {
    id: 'gate-review',
    name: 'Gate Review Prep',
    description: 'Prepare materials for a bid/no-bid gate review',
    steps: [
      { agentId: 'strategy', label: 'Competitive Analysis', dependsOn: [] },
      { agentId: 'compliance', label: 'Requirements Compliance', dependsOn: [] },
      { agentId: 'pricing', label: 'ROM Estimate', dependsOn: ['strategy'] },
      { agentId: 'capture', label: 'Capture Assessment', dependsOn: ['strategy', 'compliance'] },
    ],
  },
  {
    id: 'risk-scan',
    name: 'Contract Risk Scan',
    description: 'Analyze contract and compliance risks for an opportunity',
    steps: [
      { agentId: 'compliance', label: 'FAR/DFARS Analysis', dependsOn: [] },
      { agentId: 'contracts', label: 'Terms & Conditions', dependsOn: ['compliance'] },
    ],
  },
]

// ─── Orchestrator Class ─────────────────────────────────────────

export class AgentOrchestrator {
  private run: OrchestrationRun

  constructor(
    templateId: string,
    opportunityId: string,
    companyId: string
  ) {
    const template = WORKFLOW_TEMPLATES.find(t => t.id === templateId)
    if (!template) throw new Error(`Unknown workflow template: ${templateId}`)

    this.run = {
      id: crypto.randomUUID(),
      templateId,
      opportunityId,
      companyId,
      status: 'pending',
      steps: template.steps.map(s => ({
        agentId: s.agentId,
        label: s.label,
        dependsOn: s.dependsOn,
        status: 'pending',
        result: null,
        startedAt: null,
        completedAt: null,
        error: null,
      })),
      startedAt: new Date().toISOString(),
      completedAt: null,
    }
  }

  /**
   * Execute the workflow, running steps as their dependencies complete.
   */
  async execute(
    agentRunner: (_agentId: TaskType, _context: string) => Promise<AIResponse>
  ): Promise<OrchestrationRun> {
    this.run.status = 'running'
    await this.saveProgress()

    const context = await this.buildContext()

    while (this.hasPendingSteps()) {
      const ready = this.getReadySteps()
      if (ready.length === 0) {
        // Deadlock — remaining steps have unresolved dependencies
        this.run.status = 'failed'
        break
      }

      // Run ready steps in parallel
      const executions = ready.map(async (step) => {
        step.status = 'running'
        step.startedAt = new Date().toISOString()

        try {
          const priorResults = this.run.steps
            .filter(s => s.status === 'completed' && s.result)
            .map(s => `[${s.label}]:\n${s.result?.content ?? ''}`)
            .join('\n\n')

          const fullContext = `${context}\n\n--- Prior Agent Outputs ---\n${priorResults}`
          step.result = await agentRunner(step.agentId, fullContext)
          step.status = 'completed'
          step.completedAt = new Date().toISOString()
        } catch (err) {
          step.status = 'failed'
          step.error = err instanceof Error ? err.message : 'Unknown error'
          step.completedAt = new Date().toISOString()
        }
      })

      await Promise.allSettled(executions)
      await this.saveProgress()
    }

    const hasFailures = this.run.steps.some(s => s.status === 'failed')
    this.run.status = hasFailures ? 'failed' : 'completed'
    this.run.completedAt = new Date().toISOString()
    await this.saveProgress()

    return this.run
  }

  /** Get the current run state. */
  getRun(): OrchestrationRun { return this.run }

  // ─── Private ───────────────────────────────────────────────

  private hasPendingSteps(): boolean {
    return this.run.steps.some(s => s.status === 'pending')
  }

  private getReadySteps(): AgentStep[] {
    return this.run.steps.filter(step => {
      if (step.status !== 'pending') return false
      return step.dependsOn.every(depId =>
        this.run.steps.some(s => s.agentId === depId && s.status === 'completed')
      )
    })
  }

  private async buildContext(): Promise<string> {
    const supabase = await createClient()

    const { data: opp } = await supabase
      .from('opportunities')
      .select('title, agency, description, naics_code, set_aside, ceiling, due_date')
      .eq('id', this.run.opportunityId)
      .single()

    if (!opp) return 'No opportunity context available.'

    return [
      `Title: ${opp.title}`,
      `Agency: ${opp.agency ?? 'Unknown'}`,
      `NAICS: ${opp.naics_code ?? 'N/A'}`,
      `Set-Aside: ${opp.set_aside ?? 'Full & Open'}`,
      `Value: ${opp.ceiling ? `$${opp.ceiling.toLocaleString()}` : 'TBD'}`,
      `Due: ${opp.due_date ?? 'TBD'}`,
      `Description: ${opp.description ?? 'No description'}`,
    ].join('\n')
  }

  private async saveProgress(): Promise<void> {
    const supabase = await createClient()

    // Store run state in ai_interactions as an orchestration record
    await supabase
      .from('ai_interactions')
      .upsert({
        id: this.run.id,
        agent_type: 'orchestrator',
        company_id: this.run.companyId,
        opportunity_id: this.run.opportunityId,
        prompt: `Workflow: ${this.run.templateId}`,
        response: JSON.stringify({
          status: this.run.status,
          steps: this.run.steps.map(s => ({
            agentId: s.agentId,
            label: s.label,
            status: s.status,
            error: s.error,
          })),
          startedAt: this.run.startedAt,
          completedAt: this.run.completedAt,
        }),
      })
  }
}

// ─── Convenience ────────────────────────────────────────────────

/**
 * Get all orchestration runs for a company.
 */
export async function getOrchestrationRuns(
  companyId: string
): Promise<Array<{ id: string; templateId: string; status: string; startedAt: string }>> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ai_interactions')
    .select('id, prompt, response, created_at')
    .eq('company_id', companyId)
    .eq('agent_type', 'orchestrator')
    .order('created_at', { ascending: false })
    .limit(50)

  return (data ?? []).map(row => {
    const parsed = row.response ? JSON.parse(row.response) as { status: string } : { status: 'unknown' }
    return {
      id: row.id,
      templateId: (row.prompt ?? '').replace('Workflow: ', ''),
      status: parsed.status,
      startedAt: row.created_at ?? new Date().toISOString(),
    }
  })
}
