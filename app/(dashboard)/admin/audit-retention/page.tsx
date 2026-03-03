// filepath: app/(dashboard)/admin/audit-retention/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { AuditRetentionConfig } from '@/components/features/admin/AuditRetentionConfig'

export default async function AuditRetentionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'admin', 'canEdit')) redirect('/dashboard')

  // Get current company settings
  const { data: company } = await supabase
    .from('companies')
    .select('features')
    .eq('id', profile?.company_id ?? '')
    .single()

  const features = (company?.features ?? {}) as Record<string, unknown>
  const currentRetentionDays = Number(features.audit_retention_days ?? 365)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log Retention</h1>
        <p className="text-sm text-muted-foreground">
          Configure how long audit records are retained. Enterprise plan required.
          Immutable audit logs cannot be deleted before the retention period expires.
        </p>
      </div>
      <AuditRetentionConfig
        companyId={profile?.company_id ?? ''}
        currentRetentionDays={currentRetentionDays}
      />
    </div>
  )
}
