// filepath: app/(dashboard)/admin/insights/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { assessDeadlineRisks } from '@/lib/ai/proactive/deadline-risk'
import type { RiskLevel } from '@/lib/ai/proactive/deadline-risk'

const riskColors: Record<RiskLevel, string> = {
  critical: '#EF4444',
  at_risk: '#F59E0B',
  on_track: '#10B981',
}

const riskLabels: Record<RiskLevel, string> = {
  critical: 'Critical',
  at_risk: 'At Risk',
  on_track: 'On Track',
}

export default async function ProactiveInsightsPage() {
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

  const companyId = profile?.company_id
  let report = null
  if (companyId) {
    try {
      report = await assessDeadlineRisks(companyId)
    } catch {
      // Non-critical
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Proactive AI Insights</h1>
        <p className="text-sm text-muted-foreground">
          Deadline risk assessment — AI-powered monitoring of proposal timelines
        </p>
      </div>

      {!report || report.totalSections === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No active proposals with deadlines found. Insights will appear when
            proposals are in Capture Planning or Proposal Development phases.
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-card p-5">
              <p className="text-sm text-muted-foreground">Total Sections</p>
              <p className="text-3xl font-bold">{report.totalSections}</p>
            </div>
            <div className="rounded-lg border bg-card p-5">
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-3xl font-bold text-red-500">{report.critical}</p>
            </div>
            <div className="rounded-lg border bg-card p-5">
              <p className="text-sm text-muted-foreground">At Risk</p>
              <p className="text-3xl font-bold text-yellow-500">{report.atRisk}</p>
            </div>
            <div className="rounded-lg border bg-card p-5">
              <p className="text-sm text-muted-foreground">On Track</p>
              <p className="text-3xl font-bold text-green-500">{report.onTrack}</p>
            </div>
          </div>

          {/* Risk distribution bar */}
          <div className="rounded-lg border bg-card p-5">
            <p className="text-sm font-medium mb-3">Risk Distribution</p>
            <div className="flex h-4 rounded-full overflow-hidden">
              {report.critical > 0 && (
                <div
                  className="bg-red-500"
                  style={{ width: `${(report.critical / report.totalSections) * 100}%` }}
                />
              )}
              {report.atRisk > 0 && (
                <div
                  className="bg-yellow-500"
                  style={{ width: `${(report.atRisk / report.totalSections) * 100}%` }}
                />
              )}
              {report.onTrack > 0 && (
                <div
                  className="bg-green-500"
                  style={{ width: `${(report.onTrack / report.totalSections) * 100}%` }}
                />
              )}
            </div>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500" /> Critical
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" /> At Risk
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> On Track
              </span>
            </div>
          </div>

          {/* Section detail table */}
          <div className="rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Section Risk Detail</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Section</th>
                    <th className="text-left p-3 font-medium">Opportunity</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Completion</th>
                    <th className="text-right p-3 font-medium">Days Left</th>
                    <th className="text-right p-3 font-medium">Risk Score</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sections.map((section) => (
                    <tr key={`${section.opportunityId}-${section.sectionId}`} className="border-b last:border-0">
                      <td className="p-3 font-medium">{section.sectionName}</td>
                      <td className="p-3 text-muted-foreground">{section.opportunityTitle}</td>
                      <td className="p-3 text-center">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${riskColors[section.riskLevel]}20`,
                            color: riskColors[section.riskLevel],
                          }}
                        >
                          {riskLabels[section.riskLevel]}
                        </span>
                      </td>
                      <td className="p-3 text-right">{section.completionPct}%</td>
                      <td className="p-3 text-right">{section.daysRemaining}d</td>
                      <td className="p-3 text-right">
                        <span
                          className="font-mono"
                          style={{ color: riskColors[section.riskLevel] }}
                        >
                          {section.riskScore}
                        </span>
                      </td>
                      <td className="p-3">
                        {section.suggestedActions.length > 0 ? (
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {section.suggestedActions.map((action, i) => (
                              <li key={i}>• {action}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Assessed at {new Date(report.assessedAt).toLocaleString()} — Risk scores based on velocity projection
            against due dates. Velocity = completion % per day since section start.
          </p>
        </>
      )}
    </div>
  )
}
