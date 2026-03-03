import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { listPilots } from '@/lib/billing/pilots'
import { calculateEngagement } from '@/lib/billing/engagement'
import PilotAdminClient from './PilotAdminClient'

export const metadata: Metadata = {
  title: 'Pilot Management — MissionPulse Admin',
}

export default async function AdminPilotsPage() {
  const supabase = createClient()
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
  if (!hasPermission(role, 'admin', 'canView')) redirect('/dashboard')

  const rawPilots = await listPilots()

  // Enrich with real engagement scores
  const pilots = await Promise.all(
    rawPilots.map(async (p) => {
      if (p.status === 'pilot') {
        const engagement = await calculateEngagement(p.companyId)
        return { ...p, engagementScore: engagement.score }
      }
      return p
    })
  )

  // Fetch companies for create form
  const { data: companiesData } = await supabase
    .from('companies')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  const companies = (companiesData ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pilot Management</h1>
        <p className="mt-1 text-sm text-gray-400">
          Create, monitor, and convert 30-day paid pilots.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Total Pilots</p>
          <p className="mt-1 text-lg font-bold text-white">{pilots.length}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Active</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">
            {pilots.filter((p) => p.status === 'pilot').length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Expired</p>
          <p className="mt-1 text-lg font-bold text-red-400">
            {pilots.filter((p) => p.status === 'expired').length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Avg Engagement</p>
          <p className="mt-1 text-lg font-bold text-white">
            {pilots.length > 0
              ? Math.round(
                  pilots.reduce((s, p) => s + p.engagementScore, 0) /
                    pilots.length
                )
              : 0}
          </p>
        </div>
      </div>

      <PilotAdminClient pilots={pilots} companies={companies} />
    </div>
  )
}
