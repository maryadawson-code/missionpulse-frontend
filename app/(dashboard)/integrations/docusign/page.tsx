import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, getModulePermission } from '@/lib/rbac/config'
import { DocuSignConfig } from '@/components/features/integrations/DocuSignConfig'

export default async function DocuSignIntegrationPage() {
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
  if (!perm || !perm.canView) redirect('/')

  // Get integration status
  const { data: integration } = await supabase
    .from('integrations')
    .select('status, config, last_sync')
    .eq('company_id', profile.company_id ?? '')
    .eq('provider', 'docusign')
    .single()

  const config = integration?.config as Record<string, unknown> | null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">DocuSign</h1>
        <p className="text-sm text-gray-400 mt-1">
          E-signature routing for gate approvals, NDAs, and teaming agreements.
        </p>
      </div>

      <DocuSignConfig
        isConnected={integration?.status === 'active'}
        userName={(config?.user_name as string) ?? null}
        environment={(config?.environment as string) ?? 'demo'}
        lastSync={integration?.last_sync ?? null}
        canEdit={perm.canEdit}
      />
    </div>
  )
}
