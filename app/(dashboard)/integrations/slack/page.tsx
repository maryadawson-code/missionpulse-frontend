import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { SlackConfig } from '@/components/features/integrations/SlackConfig'

export default async function SlackPage() {
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
    redirect('/')
  }

  const { data: integration } = await supabase
    .from('integrations')
    .select('status, last_sync, error_message, config')
    .eq('provider', 'slack')
    .eq('company_id', profile?.company_id ?? '')
    .single()

  const config = integration?.config as Record<string, unknown> | null

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Slack Integration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect Slack for real-time notifications, channel-per-opportunity, and gate approval workflows.
        </p>
      </div>

      <SlackConfig
        isConnected={integration?.status === 'active'}
        teamName={(config?.team_name as string) ?? null}
        lastSync={integration?.last_sync ?? null}
        errorMessage={integration?.error_message ?? null}
        notificationPrefs={
          (config?.notification_prefs as {
            gate_approval: boolean
            deadline_warning: boolean
            hitl_pending: boolean
            pwin_change: boolean
            assignment: boolean
          }) ?? null
        }
      />
    </div>
  )
}
