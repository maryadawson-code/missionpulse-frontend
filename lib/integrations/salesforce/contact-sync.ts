/**
 * Salesforce Contact Sync
 *
 * Syncs contacts from Salesforce OpportunityContactRole records
 * into MissionPulse opportunity fields.
 *
 * Mapping:
 * - Primary SF contact → opportunities.contact_name + contact_email
 * - All contacts → metadata.salesforce_contacts[] with roles
 *
 * Deduplication by email address. Runs piggyback on opportunity sync (T-22.2).
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ───────────────────────────────────────────────────

export interface SalesforceContact {
  Id: string
  ContactId: string
  Role: string | null
  IsPrimary: boolean
  Contact: {
    Id: string
    Name: string
    Email: string | null
    Phone: string | null
    Title: string | null
  }
}

export interface MappedContact {
  salesforce_id: string
  name: string
  email: string | null
  phone: string | null
  title: string | null
  role: string
  is_primary: boolean
}

// ─── Role Mapping ───────────────────────────────────────────

const SF_ROLE_MAP: Record<string, string> = {
  'Decision Maker': 'decision_maker',
  'Economic Decision Maker': 'decision_maker',
  'Economic Buyer': 'decision_maker',
  'Evaluator': 'evaluator',
  'Technical Evaluator': 'technical_poc',
  'Influencer': 'influencer',
  'Business User': 'end_user',
  'Executive Sponsor': 'executive_sponsor',
  'Other': 'other',
}

/**
 * Map a Salesforce contact role to a MissionPulse stakeholder type.
 */
export function mapContactRole(sfRole: string | null): string {
  if (!sfRole) return 'other'
  return SF_ROLE_MAP[sfRole] ?? 'other'
}

// ─── Contact Sync ───────────────────────────────────────────

/**
 * Sync contacts for a single Salesforce opportunity into MissionPulse.
 * Called during pull sync for each opportunity.
 */
export async function syncContactsForOpportunity(
  accessToken: string,
  instanceUrl: string,
  salesforceOpportunityId: string,
  missionPulseOpportunityId: string,
  companyId: string
): Promise<{ synced: number; error?: string }> {
  const supabase = await createClient()

  try {
    // Fetch OpportunityContactRole records from Salesforce
    const soql = `SELECT Id, ContactId, Role, IsPrimary,
      Contact.Id, Contact.Name, Contact.Email, Contact.Phone, Contact.Title
      FROM OpportunityContactRole
      WHERE OpportunityId = '${salesforceOpportunityId}'
      ORDER BY IsPrimary DESC`

    const res = await fetch(
      `${instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent(soql)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      return { synced: 0, error: `Contact query failed: ${errText}` }
    }

    const data = (await res.json()) as { records: SalesforceContact[] }

    if (!data.records?.length) {
      return { synced: 0 }
    }

    // Deduplicate by email
    const seen = new Set<string>()
    const contacts: MappedContact[] = []

    for (const record of data.records) {
      const email = record.Contact?.Email?.toLowerCase() ?? null
      if (email && seen.has(email)) continue
      if (email) seen.add(email)

      contacts.push({
        salesforce_id: record.Contact?.Id ?? record.ContactId,
        name: record.Contact?.Name ?? 'Unknown',
        email,
        phone: record.Contact?.Phone ?? null,
        title: record.Contact?.Title ?? null,
        role: mapContactRole(record.Role),
        is_primary: record.IsPrimary,
      })
    }

    // Get existing opportunity data
    const { data: opp } = await supabase
      .from('opportunities')
      .select('metadata')
      .eq('id', missionPulseOpportunityId)
      .eq('company_id', companyId)
      .single()

    if (!opp) return { synced: 0, error: 'Opportunity not found' }

    const existingMeta = (opp.metadata as Record<string, unknown>) ?? {}

    // Find primary contact
    const primary = contacts.find((c) => c.is_primary) ?? contacts[0]

    // Update opportunity with primary contact + all contacts in metadata
    const updateData: Record<string, unknown> = {
      metadata: JSON.parse(JSON.stringify({
        ...existingMeta,
        salesforce_contacts: contacts,
        salesforce_contacts_synced_at: new Date().toISOString(),
      })),
    }

    if (primary) {
      updateData.contact_name = primary.name
      updateData.contact_email = primary.email
    }

    await supabase
      .from('opportunities')
      .update(updateData)
      .eq('id', missionPulseOpportunityId)

    return { synced: contacts.length }
  } catch (err) {
    return {
      synced: 0,
      error: err instanceof Error ? err.message : 'Contact sync failed',
    }
  }
}

// ─── Batch Contact Sync ─────────────────────────────────────

/**
 * Sync contacts for all linked Salesforce opportunities in a company.
 * Called after a full opportunity sync cycle.
 */
export async function syncAllContacts(
  accessToken: string,
  instanceUrl: string,
  companyId: string
): Promise<{ total: number; errors: string[] }> {
  const supabase = await createClient()

  // Find all opportunities with a salesforce_id
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, metadata')
    .eq('company_id', companyId)
    .not('metadata', 'is', null)

  if (!opportunities) return { total: 0, errors: [] }

  let total = 0
  const errors: string[] = []

  for (const opp of opportunities) {
    const meta = opp.metadata as Record<string, unknown> | null
    const sfId = meta?.salesforce_id as string | undefined
    if (!sfId) continue

    const result = await syncContactsForOpportunity(
      accessToken,
      instanceUrl,
      sfId,
      opp.id,
      companyId
    )

    total += result.synced
    if (result.error) {
      errors.push(`${opp.id}: ${result.error}`)
    }
  }

  return { total, errors }
}
