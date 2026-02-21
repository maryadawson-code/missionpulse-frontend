/**
 * Salesforce Outbound Message Webhook Handler
 *
 * Receives real-time notifications from Salesforce when
 * Opportunity records are created or updated.
 *
 * Salesforce sends SOAP XML outbound messages; this module
 * parses the payload and queues a pull-sync for the changed records.
 *
 * Setup in Salesforce:
 * 1. Workflow Rule on Opportunity (or Process Builder / Flow)
 * 2. Outbound Message action → POST to /api/integrations/salesforce/webhook
 * 3. Include fields: Id, Name, Amount, StageName, CloseDate, LastModifiedDate
 */

import { createClient } from '@/lib/supabase/server'

// ─── Types ───────────────────────────────────────────────────

export interface WebhookPayload {
  /** Salesforce record IDs that changed */
  recordIds: string[]
  /** Entity type (e.g., 'Opportunity') */
  entityType: string
  /** Notification ID for deduplication */
  notificationId: string
}

interface ParsedOutboundMessage {
  recordIds: string[]
  entityType: string
  notificationId: string
}

// ─── Parser ─────────────────────────────────────────────────

/**
 * Parse a Salesforce Outbound Message (SOAP XML) into a structured payload.
 * Extracts Opportunity IDs from the Notification elements.
 *
 * Salesforce outbound messages follow this structure:
 * <soapenv:Envelope>
 *   <soapenv:Body>
 *     <notifications>
 *       <Notification>
 *         <Id>04l...</Id>
 *         <sObject xsi:type="sf:Opportunity">
 *           <sf:Id>006...</sf:Id>
 *         </sObject>
 *       </Notification>
 *     </notifications>
 *   </soapenv:Body>
 * </soapenv:Envelope>
 */
export function parseOutboundMessage(xmlBody: string): ParsedOutboundMessage {
  const recordIds: string[] = []
  let entityType = 'Opportunity'
  let notificationId = ''

  // Extract notification ID
  const notifMatch = xmlBody.match(/<Notification>\s*<Id>([^<]+)<\/Id>/)
  if (notifMatch) {
    notificationId = notifMatch[1]
  }

  // Extract entity type from xsi:type
  const typeMatch = xmlBody.match(/xsi:type="sf:(\w+)"/)
  if (typeMatch) {
    entityType = typeMatch[1]
  }

  // Extract all sObject IDs (Salesforce record IDs start with standard prefixes)
  const idRegex = /<sf:Id>([a-zA-Z0-9]{15,18})<\/sf:Id>/g
  let match
  while ((match = idRegex.exec(xmlBody)) !== null) {
    recordIds.push(match[1])
  }

  return { recordIds, entityType, notificationId }
}

// ─── Webhook Processing ─────────────────────────────────────

/**
 * Process an incoming Salesforce webhook notification.
 * Validates the payload and triggers an incremental pull sync.
 */
export async function processWebhook(
  payload: WebhookPayload,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!payload.recordIds.length) {
    return { success: false, error: 'No record IDs in payload' }
  }

  if (payload.entityType !== 'Opportunity') {
    return { success: false, error: `Unsupported entity type: ${payload.entityType}` }
  }

  const supabase = await createClient()

  // Check for duplicate notification
  const { data: existing } = await supabase
    .from('integration_sync_logs')
    .select('id')
    .eq('sync_type', `webhook:${payload.notificationId}`)
    .maybeSingle()

  if (existing) {
    return { success: true } // Already processed
  }

  // Get integration credentials
  const { data: integration } = await supabase
    .from('integrations')
    .select('id, credentials_encrypted, config')
    .eq('provider', 'salesforce')
    .eq('company_id', companyId)
    .single()

  if (!integration?.credentials_encrypted) {
    return { success: false, error: 'Salesforce not connected' }
  }

  const creds = JSON.parse(integration.credentials_encrypted) as {
    access_token: string
    instance_url: string
  }
  const config = integration.config as Record<string, unknown> | null
  const mappings = (config?.field_mappings as Array<{
    mp_field: string
    sf_field: string
    direction: string
  }>) ?? []

  // Log webhook sync
  await supabase.from('integration_sync_logs').insert({
    integration_id: integration.id,
    sync_type: `webhook:${payload.notificationId}`,
    started_at: new Date().toISOString(),
  })

  // Fetch updated records from SF
  const pullMappings = mappings.filter(
    (m) => m.direction === 'sf_to_mp' || m.direction === 'bidirectional'
  )

  const sfFields = new Set<string>(['Id', 'Name', 'LastModifiedDate'])
  for (const m of pullMappings) {
    if (!m.sf_field.includes('.')) {
      sfFields.add(m.sf_field)
    }
  }

  const idList = payload.recordIds.map((id) => `'${id}'`).join(',')
  const soql = `SELECT ${Array.from(sfFields).join(',')} FROM Opportunity WHERE Id IN (${idList})`

  try {
    const res = await fetch(
      `${creds.instance_url}/services/data/v59.0/query?q=${encodeURIComponent(soql)}`,
      {
        headers: {
          Authorization: `Bearer ${creds.access_token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: `SF query failed: ${errText}` }
    }

    const data = (await res.json()) as {
      records: Array<Record<string, unknown> & { Id: string; Name?: string }>
    }

    let synced = 0
    for (const sfRecord of data.records) {
      // Build MP update
      const mpData: Record<string, unknown> = {}
      for (const mapping of pullMappings) {
        if (mapping.sf_field in sfRecord) {
          mpData[mapping.mp_field] = sfRecord[mapping.sf_field]
        }
      }

      // Find existing by salesforce_id
      const { data: mpOpp } = await supabase
        .from('opportunities')
        .select('id, metadata')
        .eq('company_id', companyId)
        .filter('metadata->>salesforce_id', 'eq', sfRecord.Id)
        .maybeSingle()

      if (mpOpp) {
        await supabase
          .from('opportunities')
          .update(mpData)
          .eq('id', mpOpp.id)
        synced++
      } else {
        // Try title match
        const { data: titleMatch } = await supabase
          .from('opportunities')
          .select('id, metadata')
          .eq('company_id', companyId)
          .eq('title', sfRecord.Name ?? '')
          .maybeSingle()

        if (titleMatch) {
          const existingMeta = (titleMatch.metadata as Record<string, unknown>) ?? {}
          await supabase
            .from('opportunities')
            .update({
              ...mpData,
              metadata: JSON.parse(JSON.stringify({
                ...existingMeta,
                salesforce_id: sfRecord.Id,
              })),
            })
            .eq('id', titleMatch.id)
          synced++
        }
        // Skip creating new records from webhooks — only full sync creates
      }
    }

    // Update sync log
    await supabase
      .from('integration_sync_logs')
      .update({
        completed_at: new Date().toISOString(),
        success: true,
        records_synced: synced,
      })
      .eq('sync_type', `webhook:${payload.notificationId}`)

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Webhook processing failed',
    }
  }
}

// ─── Acknowledgement Response ───────────────────────────────

/**
 * Generate the SOAP acknowledgement XML that Salesforce expects.
 * Salesforce will retry if it doesn't receive this within 10 seconds.
 */
export function buildAckResponse(success: boolean): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:out="http://soap.sforce.com/2005/09/outbound">
  <soapenv:Body>
    <out:notificationsResponse>
      <out:Ack>${success}</out:Ack>
    </out:notificationsResponse>
  </soapenv:Body>
</soapenv:Envelope>`
}
