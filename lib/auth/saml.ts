/**
 * SAML/SSO Authentication — Enterprise SSO
 * Sprint 32 (T-32.1) — Phase L v2.0
 *
 * Handles SAML 2.0 configuration, callback processing,
 * auto-provisioning, and SSO-only enforcement.
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────────

export interface SAMLConfig {
  metadataUrl: string
  entityId: string
  acsUrl: string
  attributeMapping: {
    email: string
    firstName: string
    lastName: string
    role?: string
  }
  ssoOnly: boolean
}

interface SAMLAssertion {
  nameId: string
  attributes: Record<string, string>
  issuer: string
  sessionIndex: string
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Store SAML configuration for a company.
 */
export async function configureSAML(
  companyId: string,
  config: SAMLConfig
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('integrations')
    .upsert({
      company_id: companyId,
      provider: 'saml',
      name: 'SAML SSO',
      status: 'active',
      credentials_encrypted: JSON.stringify({
        metadata_url: config.metadataUrl,
        entity_id: config.entityId,
        acs_url: config.acsUrl,
        attribute_mapping: config.attributeMapping,
        sso_only: config.ssoOnly,
      }),
    }, { onConflict: 'company_id,provider' })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Process a SAML callback assertion.
 * Creates or updates the user profile based on SAML attributes.
 */
export async function handleSAMLCallback(
  samlResponse: SAMLAssertion,
  companyId: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const supabase = await createClient()

  // Get SAML config for attribute mapping
  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials_encrypted')
    .eq('company_id', companyId)
    .eq('provider', 'saml')
    .single()

  if (!integration?.credentials_encrypted) {
    return { success: false, error: 'SAML not configured for this company' }
  }

  const config = JSON.parse(integration.credentials_encrypted) as {
    attribute_mapping: SAMLConfig['attributeMapping']
  }

  const email = samlResponse.attributes[config.attribute_mapping.email]
  if (!email) {
    return { success: false, error: 'Email attribute not found in SAML assertion' }
  }

  // Check if user exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .eq('company_id', companyId)
    .single()

  if (existingProfile) {
    return { success: true, userId: existingProfile.id }
  }

  // Auto-provision new user
  return autoProvisionUser(samlResponse.attributes, config.attribute_mapping, companyId)
}

/**
 * Auto-provision a user on first SAML login.
 */
export async function autoProvisionUser(
  attributes: Record<string, string>,
  mapping: SAMLConfig['attributeMapping'],
  companyId: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const supabase = await createClient()

  const email = attributes[mapping.email]
  const firstName = attributes[mapping.firstName] ?? ''
  const lastName = attributes[mapping.lastName] ?? ''
  const role = mapping.role ? (attributes[mapping.role] ?? 'author') : 'author'

  if (!email) {
    return { success: false, error: 'Email attribute required' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: crypto.randomUUID(),
      email,
      full_name: `${firstName} ${lastName}`.trim() || email,
      role,
      company_id: companyId,
      status: 'active',
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, userId: data?.id }
}

/**
 * Check if a company has SSO-only mode enabled.
 */
export async function isSSOOnlyCompany(companyId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('integrations')
    .select('credentials_encrypted')
    .eq('company_id', companyId)
    .eq('provider', 'saml')
    .single()

  if (!data?.credentials_encrypted) return false

  const config = JSON.parse(data.credentials_encrypted) as { sso_only?: boolean }
  return config.sso_only === true
}

/**
 * Get SAML configuration for a company.
 */
export async function getSAMLConfig(
  companyId: string
): Promise<SAMLConfig | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('integrations')
    .select('credentials_encrypted')
    .eq('company_id', companyId)
    .eq('provider', 'saml')
    .single()

  if (!data?.credentials_encrypted) return null

  const stored = JSON.parse(data.credentials_encrypted) as {
    metadata_url: string
    entity_id: string
    acs_url: string
    attribute_mapping: SAMLConfig['attributeMapping']
    sso_only: boolean
  }

  return {
    metadataUrl: stored.metadata_url,
    entityId: stored.entity_id,
    acsUrl: stored.acs_url,
    attributeMapping: stored.attribute_mapping,
    ssoOnly: stored.sso_only,
  }
}
