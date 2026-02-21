import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { GovWinConfig } from '@/components/features/integrations/GovWinConfig'

export default async function GovWinPage() {
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
    redirect('/dashboard')
  }

  // Get GovWin integration status
  const { data: integration } = await supabase
    .from('integrations')
    .select('status, last_sync, error_message, config')
    .eq('provider', 'govwin')
    .eq('company_id', profile?.company_id ?? '')
    .single()

  const config = integration?.config as Record<string, unknown> | null

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">GovWin IQ Integration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect GovWin IQ for opportunity alerts, competitor tracking, and agency intelligence.
        </p>
      </div>

      <GovWinConfig
        isConnected={integration?.status === 'active'}
        lastSync={integration?.last_sync ?? null}
        errorMessage={integration?.error_message ?? null}
        alertCount={(config?.alert_count as number) ?? 0}
        alertFilters={
          (config?.alert_filters as {
            naicsCodes?: string[]
            agencies?: string[]
            setAsides?: string[]
            minValue?: number
          }) ?? null
        }
        pendingAlerts={
          (config?.pending_alerts as Array<{
            id: string
            title: string
            agency: string
            estimatedValue: number | null
            dueDate: string | null
          }>) ?? []
        }
      />
    </div>
  )
}
