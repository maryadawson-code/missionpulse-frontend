// filepath: app/(dashboard)/integrations/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { getUserConnections, type OAuthProvider } from '@/lib/integrations/oauth-manager'
import { IntegrationsClient } from './IntegrationsClient'

interface SearchParams {
  connected?: string
  error?: string
}

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'integrations', 'shouldRender')) {
    return null
  }

  const connections = await getUserConnections(user.id)
  const resolvedParams = await searchParams

  // Build a map of connected providers for easy lookup
  const connectedMap: Record<string, { email: string | null; connectedAt: string }> = {}
  for (const conn of connections) {
    connectedMap[conn.provider] = {
      email: conn.provider_email,
      connectedAt: conn.connected_at,
    }
  }

  return (
    <IntegrationsClient
      connectedMap={connectedMap}
      flashConnected={resolvedParams.connected as OAuthProvider | undefined}
      flashError={resolvedParams.error}
    />
  )
}
