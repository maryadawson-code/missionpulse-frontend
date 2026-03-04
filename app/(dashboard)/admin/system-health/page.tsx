import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { SystemHealthDashboard } from '@/components/features/admin/SystemHealthDashboard'
import { ProviderHealthCard } from '@/components/features/admin/ProviderHealthCard'

export default async function SystemHealthPage() {
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
  if (!hasPermission(role, 'admin', 'canView')) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Health</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor database, authentication, and AI service status.
        </p>
      </div>
      <ProviderHealthCard />
      <SystemHealthDashboard />
    </div>
  )
}
