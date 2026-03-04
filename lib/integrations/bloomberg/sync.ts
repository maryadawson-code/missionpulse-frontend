/**
 * Bloomberg Government Sync — Opportunity Import
 * Sprint 34 (T-34.1) — Phase L v2.0
 *
 * Imports opportunities from Bloomberg Government into the
 * MissionPulse pipeline. Deduplicates against existing records.
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'
import { searchOpportunities, type BloombergOpportunity } from './client'

// ─── Types ──────────────────────────────────────────────────────

export interface SyncResult {
  imported: number
  skipped: number
  errors: string[]
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Import opportunities from Bloomberg Government into the pipeline.
 * Skips duplicates based on title + agency match.
 */
export async function syncBloombergOpportunities(
  companyId: string,
  query: { keyword?: string; agency?: string; naics?: string }
): Promise<SyncResult> {
  const supabase = await createClient()
  const results = await searchOpportunities(companyId, query)

  const result: SyncResult = { imported: 0, skipped: 0, errors: [] }

  for (const opp of results) {
    // Check for existing duplicate
    const { data: existing } = await supabase
      .from('opportunities')
      .select('id')
      .eq('company_id', companyId)
      .eq('title', opp.title)
      .eq('agency', opp.agency)
      .single()

    if (existing) {
      result.skipped++
      continue
    }

    const { error } = await supabase
      .from('opportunities')
      .insert({
        company_id: companyId,
        title: opp.title,
        agency: opp.agency,
        ceiling: opp.value,
        due_date: opp.dueDate,
        naics_code: opp.naicsCode,
        set_aside: opp.setAside,
        status: 'identified',
        deal_source: 'bloomberg_gov',
        metadata: JSON.parse(JSON.stringify({
          bloomberg_id: opp.id,
          bloomberg_url: opp.url,
          posted_date: opp.postedDate,
        })),
      })

    if (error) {
      result.errors.push(`Failed to import "${opp.title}": ${error.message}`)
    } else {
      result.imported++
    }
  }

  return result
}

/**
 * Enrich an existing opportunity with Bloomberg Government data.
 */
export async function enrichFromBloomberg(
  companyId: string,
  opportunityId: string,
  bloombergOpp: BloombergOpportunity
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('opportunities')
    .update({
      metadata: JSON.parse(JSON.stringify({
        bloomberg_id: bloombergOpp.id,
        bloomberg_url: bloombergOpp.url,
        bloomberg_status: bloombergOpp.status,
      })),
    })
    .eq('id', opportunityId)
    .eq('company_id', companyId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
