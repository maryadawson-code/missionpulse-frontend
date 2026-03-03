/**
 * GovWin IQ Auto-Enrichment — enrich opportunities with agency intel.
 *
 * Fetches competitor data, budget forecasts, and acquisition timelines
 * from GovWin and merges into the opportunity metadata.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import {
  getCompetitors,
  getAgencyIntel,
  type GovWinOpportunity,
} from './client'
import { isGovWinConnected } from './auth'

// ─── Types ───────────────────────────────────────────────────

interface EnrichmentResult {
  success: boolean
  enriched: boolean
  competitors: number
  error?: string
}

interface MappedFields {
  agency_intel: Record<string, unknown> | null
  competitors: Array<{
    name: string
    isIncumbent: boolean
    source: string
  }>
  enriched_at: string
}

// ─── Functions ──────────────────────────────────────────────

/**
 * Enrich an opportunity with GovWin data.
 * Fetches agency intel, budget forecasts, and competitor tracking.
 */
export async function enrichOpportunity(
  opportunityId: string
): Promise<EnrichmentResult> {
  const supabase = await createClient()

  // Get opportunity details
  const { data: opp } = await supabase
    .from('opportunities')
    .select('id, title, agency, company_id, govwin_id, metadata')
    .eq('id', opportunityId)
    .single()

  if (!opp) return { success: false, enriched: false, competitors: 0, error: 'Not found' }

  const companyId = opp.company_id as string
  if (!(await isGovWinConnected(companyId))) {
    return { success: false, enriched: false, competitors: 0, error: 'GovWin not connected' }
  }

  const enrichedData: MappedFields = {
    agency_intel: null,
    competitors: [],
    enriched_at: new Date().toISOString(),
  }

  // Fetch agency intel
  const agency = opp.agency as string | null
  if (agency) {
    const { intel } = await getAgencyIntel(agency)
    if (intel) {
      enrichedData.agency_intel = {
        budget_forecast: intel.budgetForecast,
        fiscal_year: intel.fiscalYear,
        acquisition_timeline: intel.acquisitionTimeline,
        incumbent: intel.incumbentContractor,
        recompete_date: intel.recompeteDate,
      }
    }
  }

  // Fetch competitors if we have a GovWin ID
  const govwinId = opp.govwin_id as string | null
  if (govwinId) {
    const { competitors } = await getCompetitors(govwinId)
    enrichedData.competitors = competitors.map((c) => ({
      name: c.name,
      isIncumbent: c.isIncumbent,
      source: 'govwin',
    }))
  }

  // Merge into existing metadata
  const existingMeta = (opp.metadata as Record<string, unknown>) ?? {}
  await supabase
    .from('opportunities')
    .update({
      metadata: JSON.parse(
        JSON.stringify({
          ...existingMeta,
          govwin_enrichment: enrichedData,
        })
      ),
    })
    .eq('id', opportunityId)

  // Log enrichment
  const { data: userData } = await supabase.auth.getUser()
  if (userData.user) {
    await supabase.from('audit_logs').insert({
      action: 'govwin_enrichment',
      user_id: userData.user.id,
      table_name: 'opportunities',
      record_id: opportunityId,
      metadata: JSON.parse(
        JSON.stringify({
          competitors_found: enrichedData.competitors.length,
          has_agency_intel: enrichedData.agency_intel !== null,
        })
      ),
    })
  }

  return {
    success: true,
    enriched: true,
    competitors: enrichedData.competitors.length,
  }
}

/**
 * Map GovWin opportunity fields to MissionPulse opportunity fields.
 */
export function mapGovWinToOpportunity(
  govwinData: GovWinOpportunity
): Record<string, unknown> {
  return {
    title: govwinData.title,
    agency: govwinData.agency,
    ceiling: govwinData.estimatedValue,
    naics_code: govwinData.naicsCode,
    set_aside: govwinData.setAside,
    solicitation_number: govwinData.solicitationNumber,
    due_date: govwinData.dueDate,
    description: govwinData.description,
    govwin_id: govwinData.id,
    phase: 'Long Range',
    status: 'active',
    deal_source: 'govwin',
  }
}

/**
 * Schedule enrichment for background processing.
 * Stores in a queue for the daily sync function.
 */
export async function scheduleEnrichment(
  opportunityId: string
): Promise<{ queued: boolean }> {
  const supabase = await createClient()

  const { data: opp } = await supabase
    .from('opportunities')
    .select('metadata')
    .eq('id', opportunityId)
    .single()

  const meta = (opp?.metadata as Record<string, unknown>) ?? {}

  await supabase
    .from('opportunities')
    .update({
      metadata: JSON.parse(
        JSON.stringify({
          ...meta,
          enrichment_queued: true,
          enrichment_queued_at: new Date().toISOString(),
        })
      ),
    })
    .eq('id', opportunityId)

  return { queued: true }
}
