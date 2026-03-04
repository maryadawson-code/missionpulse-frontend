import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { isProviderAvailable } from '@/lib/integrations/availability'
import { M365Config } from '@/components/features/integrations/M365Config'

export default async function M365Page() {
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
  if (!hasPermission(role, 'integrations', 'shouldRender')) {
    return null
  }

  const { data: integration } = await supabase
    .from('integrations')
    .select('status, last_sync, error_message, config')
    .eq('provider', 'm365')
    .eq('company_id', profile?.company_id ?? '')
    .single()

  const config = integration?.config as Record<string, unknown> | null
  const available = await isProviderAvailable('m365')

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Microsoft 365 Integration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect Microsoft 365 for OneDrive document storage, Word Online editing,
          and Outlook calendar sync.
        </p>
      </div>

      <M365Config
        isConnected={integration?.status === 'active'}
        isAvailable={available}
        userName={(config?.user_name as string) ?? null}
        lastSync={integration?.last_sync ?? null}
        errorMessage={integration?.error_message ?? null}
        onedriveRoot={(config?.onedrive_root as string) ?? '/MissionPulse'}
      />
    </div>
  )
}
