// filepath: lib/billing/pilot-conversion.ts

/**
 * Pilot-to-Annual Conversion — ROI generation and upgrade flow.
 *
 * Auto-triggered at Day 25: banner + ROI report.
 * One-click upgrade to Stripe Checkout with pilot credit applied.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { getTokenBalance } from './ledger'
import { calculateEngagement } from './engagement'

// ─── Types ──────────────────────────────────────────────────

export interface ROIReport {
  proposalsDrafted: number
  aiQueriesCount: number
  timeSavedHours: number
  complianceItemsTracked: number
  documentsGenerated: number
  teamMembersActive: number
  engagementScore: number
  tokensConsumed: number
  tokensAllocated: number
  daysActive: number
  estimatedManualHours: number
}

export interface PilotStatus {
  isPilot: boolean
  daysRemaining: number
  showBanner: boolean
  showExpiredMessage: boolean
  pilotCreditCents: number
}

// ─── Constants ──────────────────────────────────────────────

const AVG_TIME_SAVED_PER_AI_QUERY_MINUTES = 12
const AVG_MANUAL_HOURS_PER_PROPOSAL = 520

// ─── Functions ──────────────────────────────────────────────

/**
 * Get the pilot status for display in dashboard banner.
 */
export async function getPilotStatus(
  companyId: string
): Promise<PilotStatus> {
  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('company_subscriptions')
    .select('status, pilot_end_date, pilot_amount_cents')
    .eq('company_id', companyId)
    .single()

  if (!sub) {
    return {
      isPilot: false,
      daysRemaining: 0,
      showBanner: false,
      showExpiredMessage: false,
      pilotCreditCents: 0,
    }
  }

  const status = sub.status as string
  const endDate = sub.pilot_end_date
    ? new Date(sub.pilot_end_date as string)
    : null
  const now = Date.now()
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - now) / (24 * 60 * 60 * 1000)))
    : 0

  return {
    isPilot: status === 'pilot',
    daysRemaining,
    showBanner: status === 'pilot' && daysRemaining <= 5,
    showExpiredMessage: status === 'expired',
    pilotCreditCents: (sub.pilot_amount_cents as number) ?? 0,
  }
}

/**
 * Generate ROI report from actual pilot usage data.
 */
export async function generateROIReport(
  companyId: string
): Promise<ROIReport> {
  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('company_subscriptions')
    .select('pilot_start_date')
    .eq('company_id', companyId)
    .single()

  const startDate = sub?.pilot_start_date
    ? new Date(sub.pilot_start_date as string)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const daysActive = Math.ceil(
    (Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000)
  )

  // Count proposals created during pilot
  const { count: proposalsDrafted } = await supabase
    .from('opportunities')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('created_at', startDate.toISOString())

  // Count AI queries
  const { count: aiQueriesCount } = await supabase
    .from('token_usage')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())

  // Count compliance items
  const { count: complianceItemsTracked } = await supabase
    .from('compliance_requirements')
    .select('id', { count: 'exact', head: true })

  // Count documents
  const { count: documentsGenerated } = await supabase
    .from('company_documents')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('created_at', startDate.toISOString())

  // Count active team members
  const { count: teamMembersActive } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)

  // Get engagement score
  const engagement = await calculateEngagement(companyId)

  // Get token balance
  const balance = await getTokenBalance(companyId)

  const queries = aiQueriesCount ?? 0
  const timeSavedMinutes = queries * AVG_TIME_SAVED_PER_AI_QUERY_MINUTES
  const timeSavedHours = Math.round(timeSavedMinutes / 60)

  const proposals = proposalsDrafted ?? 0
  const estimatedManualHours = proposals * AVG_MANUAL_HOURS_PER_PROPOSAL

  return {
    proposalsDrafted: proposals,
    aiQueriesCount: queries,
    timeSavedHours,
    complianceItemsTracked: complianceItemsTracked ?? 0,
    documentsGenerated: documentsGenerated ?? 0,
    teamMembersActive: teamMembersActive ?? 0,
    engagementScore: engagement.score,
    tokensConsumed: balance?.consumed ?? 0,
    tokensAllocated: balance?.allocated ?? 0,
    daysActive,
    estimatedManualHours,
  }
}
