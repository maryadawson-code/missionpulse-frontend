import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { HubSpotConfig } from '@/components/features/integrations/HubSpotConfig'

export default async function HubSpotPage() {
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

  // Check if HubSpot integration exists
  const { data: integration } = await supabase
    .from('integrations')
    .select('id, name, status, last_sync, error_message')
    .eq('provider', 'hubspot')
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">HubSpot Integration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect HubSpot CRM for bi-directional sync of opportunities, deals,
          and contacts.
        </p>
      </div>

      <HubSpotConfig
        isConnected={
          integration?.status === 'active' ||
          integration?.status === 'connected'
        }
        lastSync={integration?.last_sync ?? null}
        errorMessage={integration?.error_message ?? null}
      />
    </div>
  )
}
