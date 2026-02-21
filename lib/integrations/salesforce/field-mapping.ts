/**
 * Salesforce Field Mapping — configurable field correspondence
 * between MissionPulse opportunity fields and Salesforce deal properties.
 *
 * Supports: bidirectional, mp_to_sf, sf_to_mp directions.
 * Custom Salesforce fields supported via API name (e.g., Custom_Field__c).
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ───────────────────────────────────────────────────

export type MappingDirection = 'bidirectional' | 'mp_to_sf' | 'sf_to_mp'

export interface FieldMapping {
  mp_field: string
  sf_field: string
  direction: MappingDirection
  is_custom?: boolean
}

// ─── Default Mappings ────────────────────────────────────────

export const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = [
  { mp_field: 'title', sf_field: 'Name', direction: 'bidirectional' },
  { mp_field: 'ceiling', sf_field: 'Amount', direction: 'bidirectional' },
  { mp_field: 'pwin', sf_field: 'Probability', direction: 'mp_to_sf' },
  { mp_field: 'phase', sf_field: 'StageName', direction: 'mp_to_sf' },
  { mp_field: 'due_date', sf_field: 'CloseDate', direction: 'bidirectional' },
  { mp_field: 'agency', sf_field: 'Account.Name', direction: 'mp_to_sf' },
  { mp_field: 'status', sf_field: 'IsClosed', direction: 'mp_to_sf' },
  { mp_field: 'description', sf_field: 'Description', direction: 'bidirectional' },
]

// ─── Display Labels ──────────────────────────────────────────

export const MP_FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  ceiling: 'Ceiling',
  pwin: 'pWin',
  phase: 'Shipley Phase',
  due_date: 'Due Date',
  agency: 'Agency',
  status: 'Status',
  description: 'Description',
  solicitation_number: 'Solicitation #',
  naics_code: 'NAICS Code',
  set_aside: 'Set-Aside',
}

export const SF_FIELD_LABELS: Record<string, string> = {
  Name: 'Opportunity Name',
  Amount: 'Amount',
  Probability: 'Probability (%)',
  StageName: 'Stage',
  CloseDate: 'Close Date',
  'Account.Name': 'Account Name',
  IsClosed: 'Closed',
  Description: 'Description',
  Type: 'Type',
  LeadSource: 'Lead Source',
}

// ─── CRUD ────────────────────────────────────────────────────

/**
 * Get the current field mappings for a company's Salesforce integration.
 */
export async function getFieldMappings(): Promise<FieldMapping[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return DEFAULT_FIELD_MAPPINGS

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return DEFAULT_FIELD_MAPPINGS

  const { data: integration } = await supabase
    .from('integrations')
    .select('config')
    .eq('provider', 'salesforce')
    .eq('company_id', profile.company_id)
    .single()

  const config = integration?.config as Record<string, unknown> | null
  const mappings = config?.field_mappings as FieldMapping[] | undefined

  return mappings && mappings.length > 0 ? mappings : DEFAULT_FIELD_MAPPINGS
}

/**
 * Update the field mappings for a company's Salesforce integration.
 */
export async function updateFieldMappings(
  mappings: FieldMapping[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { success: false, error: 'No company' }

  // Get existing config
  const { data: integration } = await supabase
    .from('integrations')
    .select('config')
    .eq('provider', 'salesforce')
    .eq('company_id', profile.company_id)
    .single()

  const existingConfig =
    (integration?.config as Record<string, unknown> | null) ?? {}

  const { error } = await supabase
    .from('integrations')
    .update({
      config: JSON.parse(JSON.stringify({ ...existingConfig, field_mappings: mappings })),
    })
    .eq('provider', 'salesforce')
    .eq('company_id', profile.company_id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Test the Salesforce connection by making a simple API call.
 */
export async function testSalesforceConnection(): Promise<{
  success: boolean
  error?: string
  orgName?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { success: false, error: 'No company' }

  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials_encrypted, config')
    .eq('provider', 'salesforce')
    .eq('company_id', profile.company_id)
    .single()

  if (!integration?.credentials_encrypted) {
    return { success: false, error: 'No Salesforce credentials found' }
  }

  try {
    const creds = JSON.parse(integration.credentials_encrypted) as {
      access_token: string
      instance_url: string
    }

    const response = await fetch(
      `${creds.instance_url}/services/data/v59.0/query?q=SELECT+Name+FROM+Organization+LIMIT+1`,
      {
        headers: {
          Authorization: `Bearer ${creds.access_token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) {
      return { success: false, error: `Salesforce API returned ${response.status}` }
    }

    const data = await response.json()
    const orgName = data.records?.[0]?.Name ?? 'Unknown Org'

    return { success: true, orgName }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Connection test failed',
    }
  }
}
