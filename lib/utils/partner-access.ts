import { createClient } from '@/lib/supabase/server'

/**
 * Check if the current user has partner access to a specific opportunity.
 * Returns the partner_access record if active, null otherwise.
 */
export async function getPartnerAccess(userId: string, opportunityId: string) {
  const supabase = await createClient()

  // Check if user has partner role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', userId)
    .single()

  if (!profile) return null

  const isPartnerRole = ['partner', 'subcontractor', 'consultant'].includes(
    profile.role ?? ''
  )
  if (!isPartnerRole) return null

  // Look up active partner_access for this email + opportunity
  const { data: access } = await supabase
    .from('partner_access')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .eq('partner_contact_email', profile.email)
    .eq('is_active', true)
    .single()

  if (!access) return null

  // Check expiry
  if (access.access_expires_at && new Date(access.access_expires_at) < new Date()) {
    return null
  }

  return access
}

/**
 * Check if a partner should have access revoked (opportunity submitted).
 */
export async function checkAutoRevoke(opportunityId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: opp } = await supabase
    .from('opportunities')
    .select('status')
    .eq('id', opportunityId)
    .single()

  return opp?.status === 'submitted' || opp?.status === 'awarded'
}

/**
 * Revoke all partner access for an opportunity.
 */
export async function revokePartnerAccess(
  opportunityId: string,
  revokedBy: string,
  reason: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('partner_access')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
      revoke_reason: reason,
    })
    .eq('opportunity_id', opportunityId)
    .eq('is_active', true)

  return { success: !error, error: error?.message }
}

/**
 * Get the list of modules a partner is allowed to access.
 * Partners NEVER see: pricing, strategy, blackhat, admin, analytics, audit.
 */
export function getPartnerAllowedModules(allowedSections: string[] | null): string[] {
  const defaultAllowed = ['pipeline', 'documents', 'proposals']
  if (!allowedSections || allowedSections.length === 0) return defaultAllowed
  return allowedSections
}

/**
 * Modules that partners are NEVER allowed to access regardless of config.
 */
export const PARTNER_BLOCKED_MODULES = [
  'pricing',
  'strategy',
  'blackhat',
  'admin',
  'analytics',
  'audit',
] as const
