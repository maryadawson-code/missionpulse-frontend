/**
 * Salesforce Bi-directional Sync Engine
 *
 * Supports three modes: push (MP → SF), pull (SF → MP), bidirectional.
 * Conflict resolution: last-write-wins with audit trail.
 * Matches on Salesforce Opportunity ID stored in metadata.salesforce_id.
 *
 * Flow:
 * 1. Fetch credentials + field mappings from integrations table
 * 2. Query changed records (since last_sync)
 * 3. Apply field mappings, resolve conflicts
 * 4. Upsert into target system
 * 5. Log sync to integration_sync_logs
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { refreshSalesforceToken } from './auth'

// ─── Types ───────────────────────────────────────────────────

export type SyncDirection = 'push' | 'pull' | 'bidirectional'

interface SyncCredentials {
  access_token: string
  refresh_token: string
  instance_url: string
}

interface FieldMapping {
  mp_field: string
  sf_field: string
  direction: 'bidirectional' | 'mp_to_sf' | 'sf_to_mp'
}

interface SalesforceOpportunity {
  Id: string
  Name?: string
  Amount?: number | null
  Probability?: number | null
  StageName?: string
  CloseDate?: string
  Description?: string | null
  IsClosed?: boolean
  LastModifiedDate?: string
  'Account.Name'?: string
  [key: string]: unknown
}

interface SyncResult {
  success: boolean
  pushed: number
  pulled: number
  conflicts: number
  errors: string[]
}

// ─── Phase → Stage Mapping ──────────────────────────────────

const PHASE_TO_STAGE: Record<string, string> = {
  'Long Range': 'Prospecting',
  'Opportunity Assessment': 'Qualification',
  'Capture Planning': 'Needs Analysis',
  'Proposal Development': 'Proposal/Price Quote',
  'Post-Submission': 'Negotiation/Review',
  'Awarded': 'Closed Won',
  'Lost': 'Closed Lost',
  'No-Bid': 'Closed Lost',
}

const STAGE_TO_PHASE: Record<string, string> = {
  'Prospecting': 'Long Range',
  'Qualification': 'Opportunity Assessment',
  'Needs Analysis': 'Capture Planning',
  'Value Proposition': 'Capture Planning',
  'Proposal/Price Quote': 'Proposal Development',
  'Negotiation/Review': 'Post-Submission',
  'Closed Won': 'Awarded',
  'Closed Lost': 'Lost',
}

// ─── Main Sync ──────────────────────────────────────────────

/**
 * Run a full sync cycle between MissionPulse and Salesforce.
 */
export async function runSalesforceSync(
  direction?: SyncDirection
): Promise<SyncResult> {
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
    .select('id, credentials_encrypted, config, last_sync')
    .eq('provider', 'salesforce')
    .eq('company_id', profile.company_id)
    .single()

  if (!integration?.credentials_encrypted) {
    return emptyResult('Salesforce not connected')
  }

  const creds: SyncCredentials = JSON.parse(integration.credentials_encrypted)
  const config = integration.config as Record<string, unknown> | null
  const mappings = (config?.field_mappings as FieldMapping[]) ?? []
  const syncDir: SyncDirection =
    direction ?? (config?.sync_direction as SyncDirection) ?? 'bidirectional'
  const lastSync = integration.last_sync

  // Log sync start
  const { data: syncLog } = await supabase
    .from('integration_sync_logs')
    .insert({
      integration_id: integration.id,
      sync_type: syncDir,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  const result: SyncResult = {
    success: true,
    pushed: 0,
    pulled: 0,
    conflicts: 0,
    errors: [],
  }

  try {
    // Get valid access token (refresh if needed)
    const accessToken = await getValidToken(creds, integration.id, supabase)
    if (!accessToken) {
      result.errors.push('Failed to obtain valid access token')
      result.success = false
      await finishSyncLog(supabase, syncLog?.id, result)
      return result
    }

    // Push: MP → SF
    if (syncDir === 'push' || syncDir === 'bidirectional') {
      const pushResult = await pushToSalesforce(
        supabase,
        accessToken,
        creds.instance_url,
        profile.company_id,
        mappings,
        lastSync
      )
      result.pushed = pushResult.synced
      result.errors.push(...pushResult.errors)
    }

    // Pull: SF → MP
    if (syncDir === 'pull' || syncDir === 'bidirectional') {
      const pullResult = await pullFromSalesforce(
        supabase,
        accessToken,
        creds.instance_url,
        profile.company_id,
        mappings,
        lastSync
      )
      result.pulled = pullResult.synced
      result.conflicts += pullResult.conflicts
      result.errors.push(...pullResult.errors)
    }

    // Update last_sync timestamp
    await supabase
      .from('integrations')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', integration.id)

    result.success = result.errors.length === 0
  } catch (err) {
    result.success = false
    result.errors.push(err instanceof Error ? err.message : 'Sync failed')
  }

  await finishSyncLog(supabase, syncLog?.id, result)
  return result
}

// ─── Push: MP → Salesforce ──────────────────────────────────

async function pushToSalesforce(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accessToken: string,
  instanceUrl: string,
  companyId: string,
  mappings: FieldMapping[],
  lastSync: string | null
): Promise<{ synced: number; errors: string[] }> {
  // Get opportunities updated since last sync
  let query = supabase
    .from('opportunities')
    .select('*')
    .eq('company_id', companyId)

  if (lastSync) {
    query = query.gte('updated_at', lastSync)
  }

  const { data: opportunities, error } = await query
  if (error || !opportunities) return { synced: 0, errors: [error?.message ?? 'Query failed'] }

  const pushMappings = mappings.filter(
    (m) => m.direction === 'mp_to_sf' || m.direction === 'bidirectional'
  )

  let synced = 0
  const errors: string[] = []

  for (const opp of opportunities) {
    try {
      const metadata = (opp.metadata as Record<string, unknown>) ?? {}
      const sfId = metadata.salesforce_id as string | undefined

      // Build Salesforce field payload
      const sfData: Record<string, unknown> = {}
      for (const mapping of pushMappings) {
        const mpValue = (opp as Record<string, unknown>)[mapping.mp_field]
        if (mpValue !== undefined) {
          sfData[mapping.sf_field] = transformFieldForSalesforce(
            mapping.mp_field,
            mapping.sf_field,
            mpValue
          )
        }
      }

      if (Object.keys(sfData).length === 0) continue

      if (sfId) {
        // Update existing SF opportunity
        const res = await fetch(
          `${instanceUrl}/services/data/v59.0/sobjects/Opportunity/${sfId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sfData),
            signal: AbortSignal.timeout(15000),
          }
        )
        if (!res.ok) {
          const errText = await res.text()
          errors.push(`Push update ${opp.title}: ${errText}`)
          continue
        }
      } else {
        // Create new SF opportunity
        if (!sfData.Name) sfData.Name = opp.title
        if (!sfData.CloseDate) sfData.CloseDate = opp.due_date ?? new Date().toISOString().split('T')[0]
        if (!sfData.StageName) sfData.StageName = PHASE_TO_STAGE[opp.phase ?? ''] ?? 'Prospecting'

        const res = await fetch(
          `${instanceUrl}/services/data/v59.0/sobjects/Opportunity`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sfData),
            signal: AbortSignal.timeout(15000),
          }
        )
        if (!res.ok) {
          const errText = await res.text()
          errors.push(`Push create ${opp.title}: ${errText}`)
          continue
        }

        // Store SF ID in metadata
        const created = (await res.json()) as { id: string }
        await supabase
          .from('opportunities')
          .update({
            metadata: JSON.parse(JSON.stringify({
              ...metadata,
              salesforce_id: created.id,
            })),
          })
          .eq('id', opp.id)
      }

      synced++
    } catch (err) {
      errors.push(
        `Push ${opp.title}: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    }
  }

  return { synced, errors }
}

// ─── Pull: Salesforce → MP ──────────────────────────────────

async function pullFromSalesforce(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accessToken: string,
  instanceUrl: string,
  companyId: string,
  mappings: FieldMapping[],
  lastSync: string | null
): Promise<{ synced: number; conflicts: number; errors: string[] }> {
  const pullMappings = mappings.filter(
    (m) => m.direction === 'sf_to_mp' || m.direction === 'bidirectional'
  )

  // Build SOQL query
  const sfFields = new Set<string>(['Id', 'Name', 'LastModifiedDate'])
  for (const m of pullMappings) {
    // Skip relationship fields like Account.Name for direct SOQL
    if (!m.sf_field.includes('.')) {
      sfFields.add(m.sf_field)
    }
  }

  let soql = `SELECT ${Array.from(sfFields).join(',')} FROM Opportunity`
  if (lastSync) {
    soql += ` WHERE LastModifiedDate > ${lastSync.replace(' ', 'T')}`
  }
  soql += ' ORDER BY LastModifiedDate DESC LIMIT 200'

  let synced = 0
  let conflicts = 0
  const errors: string[] = []

  try {
    const res = await fetch(
      `${instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent(soql)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      return { synced: 0, conflicts: 0, errors: [`SF query failed: ${errText}`] }
    }

    const data = (await res.json()) as {
      records: SalesforceOpportunity[]
    }

    for (const sfOpp of data.records) {
      try {
        // Find matching MP opportunity by salesforce_id in metadata
        const { data: existing } = await supabase
          .from('opportunities')
          .select('id, title, updated_at, metadata')
          .eq('company_id', companyId)
          .filter('metadata->>salesforce_id', 'eq', sfOpp.Id)
          .maybeSingle()

        // Build MP update fields
        const mpData: Record<string, unknown> = {}
        for (const mapping of pullMappings) {
          if (mapping.sf_field in sfOpp) {
            mpData[mapping.mp_field] = transformFieldForMissionPulse(
              mapping.sf_field,
              mapping.mp_field,
              sfOpp[mapping.sf_field]
            )
          }
        }

        if (existing) {
          // Conflict detection: last-write-wins
          const sfModified = new Date(sfOpp.LastModifiedDate ?? 0)
          const mpModified = new Date(existing.updated_at ?? 0)

          if (mpModified > sfModified) {
            // MP is newer — skip pull, log conflict
            conflicts++
            await logConflict(supabase, existing.id, sfOpp.Id, 'mp_newer')
            continue
          }

          // Update existing opportunity
          await supabase
            .from('opportunities')
            .update(mpData)
            .eq('id', existing.id)
        } else {
          // Try to match by title
          const { data: titleMatch } = await supabase
            .from('opportunities')
            .select('id, metadata')
            .eq('company_id', companyId)
            .eq('title', sfOpp.Name ?? '')
            .maybeSingle()

          if (titleMatch) {
            // Link and update
            const existingMeta = (titleMatch.metadata as Record<string, unknown>) ?? {}
            await supabase
              .from('opportunities')
              .update({
                ...mpData,
                metadata: JSON.parse(JSON.stringify({
                  ...existingMeta,
                  salesforce_id: sfOpp.Id,
                })),
              })
              .eq('id', titleMatch.id)
          } else {
            // Create new opportunity from SF
            await supabase.from('opportunities').insert({
              title: sfOpp.Name ?? 'Untitled (Salesforce)',
              company_id: companyId,
              ...mpData,
              metadata: JSON.parse(JSON.stringify({
                salesforce_id: sfOpp.Id,
                source: 'salesforce_sync',
              })),
            })
          }
        }

        synced++
      } catch (err) {
        errors.push(
          `Pull ${sfOpp.Name}: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
      }
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Pull query failed')
  }

  return { synced, conflicts, errors }
}

// ─── Field Transformations ──────────────────────────────────

function transformFieldForSalesforce(
  mpField: string,
  _sfField: string,
  value: unknown
): unknown {
  // Shipley phase → Salesforce stage
  if (mpField === 'phase' && typeof value === 'string') {
    return PHASE_TO_STAGE[value] ?? value
  }
  // Status → IsClosed boolean
  if (mpField === 'status') {
    return value === 'awarded' || value === 'lost' || value === 'no-bid'
  }
  return value
}

function transformFieldForMissionPulse(
  sfField: string,
  _mpField: string,
  value: unknown
): unknown {
  // Salesforce stage → Shipley phase
  if (sfField === 'StageName' && typeof value === 'string') {
    return STAGE_TO_PHASE[value] ?? value
  }
  // IsClosed → status
  if (sfField === 'IsClosed') {
    return value === true ? 'awarded' : 'active'
  }
  return value
}

// ─── Helpers ────────────────────────────────────────────────

async function getValidToken(
  creds: SyncCredentials,
  integrationId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
  // Try existing token with a simple query
  try {
    const testRes = await fetch(
      `${creds.instance_url}/services/data/v59.0/limits`,
      {
        headers: { Authorization: `Bearer ${creds.access_token}` },
        signal: AbortSignal.timeout(10000),
      }
    )
    if (testRes.ok) return creds.access_token
  } catch {
    // Token expired, try refresh
  }

  // Refresh token
  const newTokens = await refreshSalesforceToken(creds.refresh_token)
  if (!newTokens) return null

  // Update stored credentials
  await supabase
    .from('integrations')
    .update({
      credentials_encrypted: JSON.stringify({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token ?? creds.refresh_token,
        instance_url: newTokens.instance_url,
      }),
    })
    .eq('id', integrationId)

  return newTokens.access_token
}

async function logConflict(
  supabase: Awaited<ReturnType<typeof createClient>>,
  opportunityId: string,
  salesforceId: string,
  resolution: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('audit_logs').insert({
    action: 'salesforce_sync_conflict',
    table_name: 'opportunities',
    record_id: opportunityId,
    user_id: user.id,
    metadata: JSON.parse(JSON.stringify({
      salesforce_id: salesforceId,
      resolution,
    })),
  })
}

async function finishSyncLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  syncLogId: string | undefined,
  result: SyncResult
): Promise<void> {
  if (!syncLogId) return

  await supabase
    .from('integration_sync_logs')
    .update({
      completed_at: new Date().toISOString(),
      success: result.success,
      records_synced: result.pushed + result.pulled,
      error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
    })
    .eq('id', syncLogId)
}

function emptyResult(error: string): SyncResult {
  return {
    success: false,
    pushed: 0,
    pulled: 0,
    conflicts: 0,
    errors: [error],
  }
}
