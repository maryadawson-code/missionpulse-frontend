/**
 * Audit Retention Edge Function — Daily cleanup
 * Sprint 33 (T-33.3) — Phase L v2.0
 *
 * Runs daily to purge expired audit logs based on each
 * company's configured retention policy.
 *
 * © 2026 Mission Meets Tech
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const DEFAULT_RETENTION_YEARS: Record<string, number> = {
  starter: 1,
  professional: 3,
  enterprise: 7,
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Get all companies
  const { data: companies } = await supabase
    .from('companies')
    .select('id, features')

  let totalDeleted = 0

  for (const company of companies ?? []) {
    const features = (company.features ?? {}) as Record<string, unknown>
    const customYears = features.audit_retention_years as number | undefined

    let retentionYears = customYears

    if (!retentionYears) {
      // Get tier-based default
      const { data: subscription } = await supabase
        .from('company_subscriptions')
        .select('plan_id')
        .eq('company_id', company.id)
        .single()

      if (subscription?.plan_id) {
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('slug')
          .eq('id', subscription.plan_id)
          .single()

        retentionYears = DEFAULT_RETENTION_YEARS[plan?.slug ?? 'starter'] ?? 1
      } else {
        retentionYears = 1
      }
    }

    // Safety: never purge without a valid retention period
    if (!retentionYears || retentionYears <= 0) continue

    const cutoffDate = new Date()
    cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionYears)

    const { data: deleted } = await supabase
      .from('audit_log')
      .delete()
      .eq('company_id', company.id)
      .lt('created_at', cutoffDate.toISOString())
      .select('id')

    totalDeleted += deleted?.length ?? 0
  }

  return new Response(
    JSON.stringify({
      success: true,
      deleted: totalDeleted,
      timestamp: new Date().toISOString(),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
