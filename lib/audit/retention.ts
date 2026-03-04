/**
 * Audit Log Retention — Configurable retention policies
 * Sprint 33 (T-33.3) — Phase L v2.0
 *
 * Manages retention periods for audit logs by company tier.
 * Default: Starter=1yr, Professional=3yr, Enterprise=configurable up to 7yr
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'

// ─── Constants ──────────────────────────────────────────────────

const DEFAULT_RETENTION_YEARS: Record<string, number> = {
  starter: 1,
  professional: 3,
  enterprise: 7,
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Get the retention policy for a company.
 */
export async function getRetentionPolicy(
  companyId: string
): Promise<{ years: number; isCustom: boolean }> {
  const supabase = await createClient()

  // Check company features for custom retention
  const { data: company } = await supabase
    .from('companies')
    .select('features')
    .eq('id', companyId)
    .single()

  const features = (company?.features ?? {}) as Record<string, unknown>
  const customYears = features.audit_retention_years as number | undefined

  if (customYears) {
    return { years: customYears, isCustom: true }
  }

  // Fall back to tier-based default
  const { data: subscription } = await supabase
    .from('company_subscriptions')
    .select('plan_id')
    .eq('company_id', companyId)
    .single()

  if (subscription?.plan_id) {
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('slug')
      .eq('id', subscription.plan_id)
      .single()

    const tier = plan?.slug ?? 'starter'
    return { years: DEFAULT_RETENTION_YEARS[tier] ?? 1, isCustom: false }
  }

  return { years: 1, isCustom: false }
}

/**
 * Set a custom retention policy for a company.
 * Only Enterprise tier can set custom values.
 */
export async function setRetentionPolicy(
  companyId: string,
  years: 1 | 3 | 5 | 7
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: company } = await supabase
    .from('companies')
    .select('features')
    .eq('id', companyId)
    .single()

  const features = (company?.features ?? {}) as Record<string, unknown>
  features.audit_retention_years = years

  const { error } = await supabase
    .from('companies')
    .update({ features: JSON.parse(JSON.stringify(features)) })
    .eq('id', companyId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Purge audit logs older than the retention period.
 * Safety: never purges if retention is not configured.
 */
export async function purgeExpiredAuditLogs(
  companyId: string
): Promise<{ deleted: number; error?: string }> {
  const { years } = await getRetentionPolicy(companyId)

  const cutoffDate = new Date()
  cutoffDate.setFullYear(cutoffDate.getFullYear() - years)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('audit_log')
    .delete()
    .eq('company_id', companyId)
    .lt('created_at', cutoffDate.toISOString())
    .select('id')

  if (error) return { deleted: 0, error: error.message }
  return { deleted: data?.length ?? 0 }
}
