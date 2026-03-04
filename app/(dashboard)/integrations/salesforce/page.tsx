import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { isProviderAvailable } from '@/lib/integrations/availability'
import { SalesforceConfig } from '@/components/features/integrations/SalesforceConfig'

export default async function SalesforcePage() {
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

  // Get Salesforce integration status
  const { data: integration } = await supabase
    .from('integrations')
    .select('status, last_sync, error_message, config')
    .eq('provider', 'salesforce')
    .eq('company_id', profile?.company_id ?? '')
    .single()

  const config = integration?.config as Record<string, unknown> | null
  const available = await isProviderAvailable('salesforce')

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Salesforce Integration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your Salesforce CRM for bi-directional opportunity sync.
        </p>
      </div>

      <SalesforceConfig
        isConnected={integration?.status === 'active'}
        isAvailable={available}
        lastSync={integration?.last_sync ?? null}
        errorMessage={integration?.error_message ?? null}
        instanceUrl={(config?.instance_url as string) ?? null}
        fieldMappings={
          (config?.field_mappings as Array<{
            mp_field: string
            sf_field: string
            direction: string
          }>) ?? null
        }
      />
    </div>
  )
}
