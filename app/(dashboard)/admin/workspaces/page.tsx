// filepath: app/(dashboard)/admin/workspaces/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { WorkspaceManager } from '@/components/features/admin/WorkspaceManager'

export default async function WorkspacesPage() {
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

  // Get current company as primary workspace
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, domain, subscription_tier')
    .eq('id', profile?.company_id ?? '')
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <p className="text-sm text-muted-foreground">
          Manage multiple workspaces for divisions, subsidiaries, or JVs.
          Enterprise plan required. Data isolation enforced via RLS.
        </p>
      </div>
      <WorkspaceManager
        currentWorkspace={{
          id: company?.id ?? '',
          name: company?.name ?? '',
          domain: company?.domain ?? '',
          tier: company?.subscription_tier ?? '',
        }}
      />
    </div>
  )
}
