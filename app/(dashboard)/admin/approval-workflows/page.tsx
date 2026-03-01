import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface WorkflowStep {
  name: string
  approver_role?: string
  required?: boolean
  order?: number
}

export default async function ApprovalWorkflowsPage() {
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
  if (!hasPermission(role, 'admin', 'canView')) return null

  const { data: workflows } = await supabase
    .from('approval_workflows')
    .select('id, name, description, workflow_type, is_active, steps, created_at, updated_at')
    .order('workflow_type', { ascending: true })
    .order('name', { ascending: true })

  const items = workflows ?? []

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Approval Workflows' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-foreground">Approval Workflows</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define approval chains for proposals, gate reviews, and submissions.
          Each workflow defines sequential approval steps with required roles.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No approval workflows configured. Workflows define the sequence of
            approvals required before proposals can advance through gates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((wf) => {
            const steps: WorkflowStep[] = Array.isArray(wf.steps)
              ? (wf.steps as unknown as WorkflowStep[])
              : []

            return (
              <div
                key={wf.id}
                className="rounded-xl border border-border bg-card/50 p-6 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        {wf.name}
                      </h3>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {(wf.workflow_type ?? 'general').replace(/_/g, ' ')}
                      </span>
                      {wf.is_active === false && (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-300">
                          Inactive
                        </span>
                      )}
                    </div>
                    {wf.description && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {wf.description}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Updated {formatDate(wf.updated_at ?? wf.created_at)}
                  </span>
                </div>

                {/* Workflow Steps */}
                {steps.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-2">
                    {steps
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {i > 0 && (
                            <div className="h-px w-6 bg-muted" />
                          )}
                          <div
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                              step.required !== false
                                ? 'border-primary/30 bg-primary/5'
                                : 'border-border bg-muted/50'
                            }`}
                          >
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                              {i + 1}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-foreground">
                                {step.name}
                              </p>
                              {step.approver_role && (
                                <p className="text-[10px] text-muted-foreground">
                                  {step.approver_role.replace(/_/g, ' ')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
