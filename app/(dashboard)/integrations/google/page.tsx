import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, getModulePermission } from '@/lib/rbac/config'
import { GoogleConfig } from '@/components/features/integrations/GoogleConfig'

export default async function GoogleIntegrationPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const effectiveRole = resolveRole(profile.role)
  const perm = getModulePermission(effectiveRole, 'integrations')
  if (!perm || !perm.canView) redirect('/dashboard')

  // Get integration status
  const { data: integration } = await supabase
    .from('integrations')
    .select('status, config, last_sync')
    .eq('company_id', profile.company_id ?? '')
    .eq('provider', 'google')
    .single()

  const config = integration?.config as Record<string, unknown> | null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Google Workspace</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Google Drive, Calendar, and Gmail integration for document collaboration and scheduling.
        </p>
      </div>

      <GoogleConfig
        isConnected={integration?.status === 'active'}
        userName={(config?.user_name as string) ?? null}
        userEmail={(config?.user_email as string) ?? null}
        lastSync={integration?.last_sync ?? null}
        canEdit={perm.canEdit}
      />
    </div>
  )
}
