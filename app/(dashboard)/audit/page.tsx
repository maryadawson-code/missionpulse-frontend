import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { AuditTrailViewer } from '@/components/features/audit/AuditTrailViewer'

export default async function AuditPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'audit_log', 'shouldRender')) {
    return null
  }

  // Read from immutable audit_logs table (NIST AU-9)
  const { data: entries, error } = await supabase
    .from('audit_logs')
    .select(
      'id, action, user_id, user_email, user_role, table_name, record_id, metadata, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Trail</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Immutable audit records for security and compliance. Filterable and
          exportable.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-600 dark:text-red-400">
          Failed to load audit log: {error.message}
        </div>
      )}

      <AuditTrailViewer entries={entries ?? []} />
    </div>
  )
}
