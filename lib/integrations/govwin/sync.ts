/**
 * GovWin IQ Sync Engine
 *
 * Daily sync via Supabase Edge Function (cron).
 * Pulls new opportunity alerts matching configured filters,
 * updates competitor tracking data, and refreshes agency intel.
 *
 * Also callable manually from the GovWin integration page.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import {
  searchGovWinOpportunities,
  getCompetitors,
  type GovWinAlertFilters,
  type GovWinOpportunity,
  type GovWinCompetitor,
} from './client'

// ─── Types ───────────────────────────────────────────────────

interface SyncResult {
  success: boolean
  newAlerts: number
  updatedCompetitors: number
  errors: string[]
}

// ─── Main Sync ──────────────────────────────────────────────

/**
 * Run a full GovWin IQ sync for a company.
 * 1. Fetch new opportunities matching alert filters
 * 2. Update competitor data for linked opportunities
 * 3. Log sync results
 */
export async function runGovWinSync(): Promise<SyncResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return emptyResult('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return emptyResult('No company')

  // Get integration record
  const { data: integration } = await supabase
    .from('integrations')
    .select('id, credentials_encrypted, config')
    .eq('provider', 'govwin')
    .eq('company_id', profile.company_id)
    .single()

  if (!integration?.credentials_encrypted) {
    return emptyResult('GovWin not connected')
  }

  const config = integration.config as Record<string, unknown> | null
  const filters = (config?.alert_filters as GovWinAlertFilters) ?? {}

  // Log sync start
  const { data: syncLog } = await supabase
    .from('integration_sync_logs')
    .insert({
      integration_id: integration.id,
      sync_type: 'govwin_daily',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  const result: SyncResult = {
    success: true,
    newAlerts: 0,
    updatedCompetitors: 0,
    errors: [],
  }

  try {
    // Step 1: Fetch new opportunities matching filters
    const { results: alerts, error: searchError } = await searchGovWinOpportunities(filters)

    if (searchError) {
      result.errors.push(searchError)
    } else {
      // Store new alerts (deduplicate by govwin_id)
      for (const alert of alerts) {
        const { data: existing } = await supabase
          .from('opportunities')
          .select('id')
          .eq('govwin_id', alert.id)
          .eq('company_id', profile.company_id)
          .maybeSingle()

        if (!existing) {
          result.newAlerts++
          // Store as alert in config (not auto-import)
          await storeAlert(supabase, integration.id, alert, config)
        }
      }
    }

    // Step 2: Update competitor data for existing linked opportunities
    const { data: linkedOpps } = await supabase
      .from('opportunities')
      .select('id, govwin_id, metadata')
      .eq('company_id', profile.company_id)
      .not('govwin_id', 'is', null)

    if (linkedOpps) {
      for (const opp of linkedOpps) {
        if (!opp.govwin_id) continue

        const { competitors, error: compError } = await getCompetitors(opp.govwin_id)
        if (compError) {
          result.errors.push(`Competitor ${opp.govwin_id}: ${compError}`)
          continue
        }

        if (competitors.length > 0) {
          await updateCompetitorData(supabase, opp.id, opp.metadata, competitors)
          result.updatedCompetitors++
        }
      }
    }

    // Update alert count in config
    const existingConfig = (config as Record<string, unknown>) ?? {}
    await supabase
      .from('integrations')
      .update({
        last_sync: new Date().toISOString(),
        config: JSON.parse(JSON.stringify({
          ...existingConfig,
          alert_count: result.newAlerts,
          last_sync_stats: {
            new_alerts: result.newAlerts,
            updated_competitors: result.updatedCompetitors,
            errors: result.errors.length,
          },
        })),
      })
      .eq('id', integration.id)

    result.success = result.errors.length === 0
  } catch (err) {
    result.success = false
    result.errors.push(err instanceof Error ? err.message : 'Sync failed')
  }

  // Finish sync log
  if (syncLog?.id) {
    await supabase
      .from('integration_sync_logs')
      .update({
        completed_at: new Date().toISOString(),
        success: result.success,
        records_synced: result.newAlerts + result.updatedCompetitors,
        error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
      })
      .eq('id', syncLog.id)
  }

  return result
}

// ─── Helpers ────────────────────────────────────────────────

async function storeAlert(
  supabase: Awaited<ReturnType<typeof createClient>>,
  integrationId: string,
  alert: GovWinOpportunity,
  currentConfig: Record<string, unknown> | null
): Promise<void> {
  const config = currentConfig ?? {}
  const existingAlerts = (config.pending_alerts as GovWinOpportunity[]) ?? []

  // Keep last 100 alerts
  const updatedAlerts = [alert, ...existingAlerts].slice(0, 100)

  await supabase
    .from('integrations')
    .update({
      config: JSON.parse(JSON.stringify({
        ...config,
        pending_alerts: updatedAlerts,
        alert_count: updatedAlerts.length,
      })),
    })
    .eq('id', integrationId)
}

async function updateCompetitorData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  opportunityId: string,
  existingMetadata: unknown,
  competitors: GovWinCompetitor[]
): Promise<void> {
  const meta = (existingMetadata as Record<string, unknown>) ?? {}

  await supabase
    .from('opportunities')
    .update({
      metadata: JSON.parse(JSON.stringify({
        ...meta,
        govwin_competitors: competitors,
        govwin_competitors_updated: new Date().toISOString(),
      })),
    })
    .eq('id', opportunityId)
}

function emptyResult(error: string): SyncResult {
  return {
    success: false,
    newAlerts: 0,
    updatedCompetitors: 0,
    errors: [error],
  }
}
