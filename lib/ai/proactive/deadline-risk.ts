/**
 * Proactive AI — Deadline Risk Alerts
 *
 * Monitors proposal timelines and flags at-risk sections.
 * Inputs: section due dates, completion %, historical velocity.
 * Output: risk score per section with recommended actions.
 *
 * Risk levels:
 * - On Track (green): projected completion before due date
 * - At Risk (yellow): projected completion within 3 days of due date
 * - Critical (red): projected completion after due date
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ───────────────────────────────────────────────────

export type RiskLevel = 'on_track' | 'at_risk' | 'critical'

export interface SectionRisk {
  sectionId: string
  sectionName: string
  opportunityId: string
  opportunityTitle: string
  dueDate: string
  completionPct: number
  projectedCompletionDate: string
  daysRemaining: number
  daysBehind: number // positive = behind schedule
  riskLevel: RiskLevel
  riskScore: number // 0-100
  velocity: number // percentage points per day
  suggestedActions: string[]
}

export interface DeadlineRiskReport {
  assessedAt: string
  totalSections: number
  onTrack: number
  atRisk: number
  critical: number
  sections: SectionRisk[]
}

// ─── Risk Assessment ─────────────────────────────────────────

/**
 * Assess deadline risk for all active sections in a company.
 */
export async function assessDeadlineRisks(
  companyId: string
): Promise<DeadlineRiskReport> {
  const supabase = await createClient()

  // Get active opportunities with deadlines
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, title, due_date, phase, metadata')
    .eq('company_id', companyId)
    .not('due_date', 'is', null)
    .in('phase', ['Capture Planning', 'Proposal Development'])
    .order('deadline', { ascending: true })

  if (!opportunities || opportunities.length === 0) {
    return {
      assessedAt: new Date().toISOString(),
      totalSections: 0,
      onTrack: 0,
      atRisk: 0,
      critical: 0,
      sections: [],
    }
  }

  const allRisks: SectionRisk[] = []

  for (const opp of opportunities) {
    const metadata = opp.metadata as Record<string, unknown> | null
    const sections = (metadata?.sections as Array<{
      id: string
      name: string
      due_date?: string
      completion_pct?: number
      started_at?: string
    }>) ?? []

    // If no sections metadata, treat the whole opportunity as one section
    if (sections.length === 0) {
      const risk = assessSingleDeadline(
        opp.id,
        opp.title,
        opp.id,
        opp.title,
        opp.due_date!,
        estimateOpportunityCompletion(opp.phase ?? ''),
        null
      )
      allRisks.push(risk)
      continue
    }

    for (const section of sections) {
      const sectionDue = section.due_date ?? opp.due_date!
      const risk = assessSingleDeadline(
        opp.id,
        opp.title,
        section.id,
        section.name,
        sectionDue,
        section.completion_pct ?? 0,
        section.started_at ?? null
      )
      allRisks.push(risk)
    }
  }

  // Sort by risk level (critical first) then by days remaining
  allRisks.sort((a, b) => {
    const levelOrder: Record<RiskLevel, number> = { critical: 0, at_risk: 1, on_track: 2 }
    const levelDiff = levelOrder[a.riskLevel] - levelOrder[b.riskLevel]
    if (levelDiff !== 0) return levelDiff
    return a.daysRemaining - b.daysRemaining
  })

  return {
    assessedAt: new Date().toISOString(),
    totalSections: allRisks.length,
    onTrack: allRisks.filter((r) => r.riskLevel === 'on_track').length,
    atRisk: allRisks.filter((r) => r.riskLevel === 'at_risk').length,
    critical: allRisks.filter((r) => r.riskLevel === 'critical').length,
    sections: allRisks,
  }
}

/**
 * Assess risk for a single section/deadline.
 */
function assessSingleDeadline(
  opportunityId: string,
  opportunityTitle: string,
  sectionId: string,
  sectionName: string,
  dueDate: string,
  completionPct: number,
  startedAt: string | null
): SectionRisk {
  const now = new Date()
  const due = new Date(dueDate)
  const daysRemaining = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const remainingPct = 100 - completionPct

  // Calculate velocity (percentage points completed per day)
  let velocity = 0
  if (startedAt) {
    const started = new Date(startedAt)
    const daysSinceStart = Math.max(1, (now.getTime() - started.getTime()) / (1000 * 60 * 60 * 24))
    velocity = completionPct / daysSinceStart
  } else {
    // Default assumption: 5% per day
    velocity = 5
  }

  // Project completion date
  const daysToComplete = velocity > 0 ? remainingPct / velocity : Infinity
  const projectedCompletion = new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000)
  const daysBehind = Math.ceil(
    (projectedCompletion.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Determine risk level
  let riskLevel: RiskLevel = 'on_track'
  if (daysBehind > 0) {
    riskLevel = 'critical'
  } else if (daysBehind > -3) {
    // Within 3 days buffer
    riskLevel = 'at_risk'
  }

  // Risk score: 0 (safe) to 100 (very late)
  let riskScore = 0
  if (daysRemaining <= 0) {
    riskScore = 100 // Past due
  } else if (daysBehind > 0) {
    riskScore = Math.min(100, 60 + daysBehind * 5)
  } else if (daysBehind > -3) {
    riskScore = 40 + (3 + daysBehind) * 7
  } else {
    riskScore = Math.max(0, 40 - Math.abs(daysBehind) * 3)
  }

  // Generate suggested actions
  const actions = generateSuggestedActions(riskLevel, daysBehind, remainingPct, velocity, daysRemaining)

  return {
    sectionId,
    sectionName,
    opportunityId,
    opportunityTitle,
    dueDate,
    completionPct,
    projectedCompletionDate: projectedCompletion.toISOString().split('T')[0],
    daysRemaining: Math.max(0, daysRemaining),
    daysBehind: Math.max(0, daysBehind),
    riskLevel,
    riskScore,
    velocity: Math.round(velocity * 10) / 10,
    suggestedActions: actions,
  }
}

// ─── Action Suggestions ──────────────────────────────────────

function generateSuggestedActions(
  level: RiskLevel,
  daysBehind: number,
  remainingPct: number,
  velocity: number,
  daysRemaining: number
): string[] {
  const actions: string[] = []

  if (level === 'critical') {
    actions.push(`Section is projected ${daysBehind} day(s) behind schedule`)
    if (remainingPct > 50) {
      actions.push('Consider assigning additional team members to accelerate')
    }
    if (velocity < 3) {
      actions.push('Current velocity is very low — identify and remove blockers')
    }
    actions.push('Escalate to capture manager for reallocation decision')
  } else if (level === 'at_risk') {
    actions.push('Section completion is tight — monitor daily')
    if (daysRemaining < 7) {
      actions.push('Less than a week remaining — prioritize this section')
    }
    actions.push('Consider reducing scope or shifting lower-priority content')
  } else {
    if (daysRemaining < 14 && remainingPct > 30) {
      actions.push('On track but significant work remains — maintain momentum')
    }
  }

  return actions
}

// ─── Helpers ─────────────────────────────────────────────────

function estimateOpportunityCompletion(phase: string): number {
  const phaseCompletion: Record<string, number> = {
    'Long Range': 5,
    'Opportunity Assessment': 15,
    'Capture Planning': 35,
    'Proposal Development': 65,
    'Post-Submission': 90,
    'Awarded': 100,
    'Lost': 100,
    'No-Bid': 100,
  }
  return phaseCompletion[phase] ?? 0
}

/**
 * Create notifications for at-risk and critical sections.
 */
export async function createDeadlineAlerts(
  companyId: string,
  report: DeadlineRiskReport
): Promise<{ alertsCreated: number }> {
  const supabase = await createClient()
  let alertsCreated = 0

  // Only alert on at-risk and critical sections
  const alertable = report.sections.filter(
    (s) => s.riskLevel === 'at_risk' || s.riskLevel === 'critical'
  )

  for (const section of alertable) {
    await supabase.from('activity_log').insert({
      company_id: companyId,
      action: 'deadline_risk_alert',
      entity_type: 'opportunity',
      entity_id: section.opportunityId,
      description: `[${section.riskLevel.toUpperCase()}] ${section.sectionName} on "${section.opportunityTitle}" — ${section.daysBehind > 0 ? `${section.daysBehind} days behind` : 'at risk of slipping'}`,
      metadata: JSON.parse(JSON.stringify({
        risk_level: section.riskLevel,
        risk_score: section.riskScore,
        days_remaining: section.daysRemaining,
        days_behind: section.daysBehind,
        completion_pct: section.completionPct,
        suggested_actions: section.suggestedActions,
      })),
    })
    alertsCreated++
  }

  return { alertsCreated }
}
