// filepath: app/(dashboard)/personnel/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { CUIBanner } from '@/components/rbac/CUIBanner'

function clearanceColor(level: string | null): string {
  switch (level) {
    case 'TS/SCI':
    case 'Top Secret':
    case 'TS':
      return 'bg-red-500/20 text-red-300'
    case 'Secret':
      return 'bg-amber-500/20 text-amber-300'
    case 'Confidential':
      return 'bg-blue-500/20 text-blue-300'
    case 'Public Trust':
      return 'bg-gray-500/20 text-gray-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

function availabilityColor(status: string | null): string {
  switch (status) {
    case 'available':
      return 'bg-emerald-500/20 text-emerald-300'
    case 'partially_available':
    case 'partial':
      return 'bg-amber-500/20 text-amber-300'
    case 'unavailable':
    case 'deployed':
      return 'bg-red-500/20 text-red-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

export default async function PersonnelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'personnel', 'shouldRender')) {
    redirect('/')
  }

  const { data: personnel, error } = await supabase
    .from('key_personnel')
    .select('id, first_name, last_name, title, clearance_level, clearance_status, availability_status, labor_category, skills, certifications, years_experience, current_project, employee_type, updated_at')
    .order('last_name', { ascending: true })
    .limit(100)

  const people = personnel ?? []
  const clearedCount = people.filter((p) => p.clearance_level && p.clearance_level !== 'None').length

  return (
    <div className="space-y-6">
      <CUIBanner marking="SP-PRVCY" />
      <div>
        <h1 className="text-2xl font-bold text-white">Personnel</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage key personnel, clearances, availability, and resume tracking.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Personnel</p>
          <p className="mt-2 text-2xl font-bold text-white">{people.length}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Cleared</p>
          <p className="mt-2 text-2xl font-bold text-amber-400">{clearedCount}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Available</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {people.filter((p) => p.availability_status === 'available').length}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load personnel: {error.message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Title</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Clearance</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Availability</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Labor Cat</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Experience</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Current Project</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {people.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                    No personnel records yet. Add key personnel to track clearances and availability.
                  </td>
                </tr>
              ) : (
                people.map((person) => (
                  <tr key={person.id} className="transition-colors hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-200 whitespace-nowrap">
                      {person.last_name}, {person.first_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {person.title ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${clearanceColor(person.clearance_level)}`}>
                        {person.clearance_level ?? 'None'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${availabilityColor(person.availability_status)}`}>
                        {(person.availability_status ?? 'unknown').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {person.labor_category ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {person.years_experience != null ? `${person.years_experience} yr` : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate" title={person.current_project ?? ''}>
                      {person.current_project ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Showing {people.length} personnel record{people.length !== 1 ? 's' : ''}. Personnel data is classified CUI//SP-PRVCY.
      </p>
    </div>
  )
}
