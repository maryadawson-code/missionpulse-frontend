/**
 * API Key Management Page — Public REST API
 * Sprint 33 (T-33.2) — Phase L v2.0
 * © 2026 Mission Meets Tech
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { APIKeysClient } from './client'

export default async function APIKeysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'admin', 'canEdit')) redirect('/dashboard')

  // Check enterprise tier
  const { data: subscription } = await supabase
    .from('company_subscriptions')
    .select('plan_id')
    .eq('company_id', profile?.company_id ?? '')
    .single()

  const { data: plan } = subscription?.plan_id
    ? await supabase.from('subscription_plans').select('slug').eq('id', subscription.plan_id).single()
    : { data: null }

  const isEnterprise = plan?.slug === 'enterprise'

  if (!isEnterprise) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">API Keys</h1>
        <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-white/60 mb-4">API key management is available on the Enterprise plan.</p>
          <a href="/plans" className="text-[#00E5FA] hover:underline">
            Upgrade to Enterprise →
          </a>
        </div>
      </div>
    )
  }

  return <APIKeysClient />
}
