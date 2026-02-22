import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

function statusStyle(status: string | null): string {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'approved':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'pending':
    case 'under_review':
      return 'bg-amber-500/15 text-amber-300'
    case 'inactive':
    case 'disqualified':
      return 'bg-red-500/15 text-red-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

export default async function SubcontractorsPage() {
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
  if (!hasPermission(role, 'pipeline', 'canView')) return null

  const { data: subs } = await supabase
    .from('subcontractors')
    .select(
      'id, name, cage_code, duns_number, uei_number, relationship_status, capabilities, set_aside_status, nda_signed, teaming_agreement, past_performance_rating, primary_contact, contact_email, created_at'
    )
    .order('name', { ascending: true })
    .limit(100)

  const items = subs ?? []

  const active = items.filter(
    (s) => s.relationship_status === 'active' || s.relationship_status === 'approved'
  ).length
  const ndaSigned = items.filter((s) => s.nda_signed === true).length
  const taSigned = items.filter((s) => s.teaming_agreement === true).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Subcontractor Registry</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track subcontractor credentials, capabilities, and NDA status.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Total</p>
          <p className="mt-1 text-lg font-bold text-white">{items.length}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">Active</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">{active}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">NDA Signed</p>
          <p className="mt-1 text-lg font-bold text-white">{ndaSigned}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs text-gray-500">TA Signed</p>
          <p className="mt-1 text-lg font-bold text-white">{taSigned}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No subcontractors registered yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((sub) => (
            <div
              key={sub.id}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{sub.name}</h3>
                    {sub.relationship_status && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle(sub.relationship_status)}`}
                      >
                        {sub.relationship_status}
                      </span>
                    )}
                    {sub.past_performance_rating && (
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-300">
                        {sub.past_performance_rating}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {sub.nda_signed && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                      NDA
                    </span>
                  )}
                  {sub.teaming_agreement && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                      TA
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500">
                {sub.cage_code && <span>CAGE: {sub.cage_code}</span>}
                {sub.duns_number && <span>DUNS: {sub.duns_number}</span>}
                {sub.uei_number && <span>UEI: {sub.uei_number}</span>}
                {sub.primary_contact && <span>Contact: {sub.primary_contact}</span>}
                {sub.contact_email && <span>{sub.contact_email}</span>}
                {sub.set_aside_status && (
                  <span>Set-Aside: {String(sub.set_aside_status)}</span>
                )}
              </div>

              {sub.capabilities && (
                <p className="text-xs text-gray-400 line-clamp-2">
                  {sub.capabilities}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
