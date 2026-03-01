import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { PilotTable } from '@/components/features/admin/PilotTable'

export default async function PilotsPage() {
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
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pilot Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor active pilots, view engagement scores, and manage conversions.
          Sorted by engagement score (highest conversion probability first).
        </p>
      </div>

      <PilotTable />
    </div>
  )
}
