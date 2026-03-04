import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

export default async function FederalSearchPage() {
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
  if (!hasPermission(role, 'pipeline', 'canView')) redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Federal Opportunity Search</h1>
        <p className="text-sm text-muted-foreground">
          Search across SAM.gov, GovWin, and Bloomberg Government in one unified view.
        </p>
      </div>

      {/* Search Controls */}
      <div className="rounded-lg border border-gray-800 bg-[#0a0f1a] p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Keyword</label>
            <input
              type="text"
              placeholder="Search opportunities..."
              className="w-full rounded-md border border-gray-700 bg-[#00050F] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#00E5FA] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Agency</label>
            <input
              type="text"
              placeholder="e.g. Department of Defense"
              className="w-full rounded-md border border-gray-700 bg-[#00050F] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#00E5FA] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">NAICS Code</label>
            <input
              type="text"
              placeholder="e.g. 541512"
              className="w-full rounded-md border border-gray-700 bg-[#00050F] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#00E5FA] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Set-Aside</label>
            <select className="w-full rounded-md border border-gray-700 bg-[#00050F] px-3 py-2 text-sm text-white focus:border-[#00E5FA] focus:outline-none">
              <option value="">All</option>
              <option value="SBA">Small Business</option>
              <option value="8a">8(a)</option>
              <option value="WOSB">WOSB</option>
              <option value="SDVOSB">SDVOSB</option>
              <option value="HUBZone">HUBZone</option>
            </select>
          </div>
        </div>

        {/* Source Toggles */}
        <div className="mt-4 flex items-center gap-6">
          <span className="text-xs font-medium text-gray-400">Sources:</span>
          {['SAM.gov', 'GovWin', 'Bloomberg Gov'].map((source) => (
            <label key={source} className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-600 bg-gray-800 text-[#00E5FA] focus:ring-[#00E5FA]"
              />
              {source}
            </label>
          ))}
        </div>

        <button className="mt-4 rounded-md bg-[#00E5FA] px-6 py-2 text-sm font-medium text-[#00050F] hover:bg-[#00E5FA]/90">
          Search All Sources
        </button>
      </div>

      {/* Results placeholder */}
      <div className="rounded-lg border border-gray-800 bg-[#0a0f1a] p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
          <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <p className="text-sm text-gray-400">
          Enter search criteria and click &quot;Search All Sources&quot; to find federal opportunities
          across SAM.gov, GovWin, and Bloomberg Government.
        </p>
      </div>

      <p className="text-center text-xs text-gray-600">
        AI GENERATED — REQUIRES HUMAN REVIEW
      </p>
    </div>
  )
}
