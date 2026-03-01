import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

function statusStyle(status: string | null): string {
  switch (status?.toLowerCase()) {
    case 'executed':
    case 'active':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'pending':
    case 'draft':
      return 'bg-amber-500/15 text-amber-300'
    case 'expired':
    case 'terminated':
      return 'bg-red-500/15 text-red-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

export default async function PartnersPage() {
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

  // Fetch teaming partners
  const { data: partners } = await supabase
    .from('teaming_partners')
    .select(
      'id, company_name, contact_name, contact_email, contact_phone, status, nda_status, ta_status, workshare_percentage, role, set_aside_status, created_at'
    )
    .order('company_name', { ascending: true })
    .limit(100)

  // Fetch teaming agreements
  const { data: agreements } = await supabase
    .from('teaming_agreements')
    .select(
      'id, partner_name, agreement_type, status, executed_date, expiration_date, opportunity_id, document_url'
    )
    .order('executed_date', { ascending: false })
    .limit(100)

  const partnerItems = partners ?? []
  const agreementItems = agreements ?? []

  const executed = agreementItems.filter(
    (a) => a.status === 'executed' || a.status === 'active'
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Teaming Partners</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage partner relationships, teaming agreements, and capability
          alignment.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Partners</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {partnerItems.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Agreements</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {agreementItems.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Executed</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">{executed}</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="mt-1 text-lg font-bold text-amber-400">
            {agreementItems.filter(
              (a) => a.status === 'pending' || a.status === 'draft'
            ).length}
          </p>
        </div>
      </div>

      {/* Partners */}
      {partnerItems.length === 0 && agreementItems.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No teaming partners registered yet.
          </p>
        </div>
      ) : (
        <>
          {partnerItems.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Partners ({partnerItems.length})
              </h2>
              <div className="space-y-3">
                {partnerItems.map((partner) => (
                  <div
                    key={partner.id}
                    className="rounded-xl border border-border bg-card/50 p-5 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">
                            {partner.company_name}
                          </h3>
                          {partner.status && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle(partner.status)}`}
                            >
                              {partner.status}
                            </span>
                          )}
                          {partner.role && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              {partner.role}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground">
                          {partner.contact_name && (
                            <span>Contact: {partner.contact_name}</span>
                          )}
                          {partner.contact_email && (
                            <span>{partner.contact_email}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {partner.nda_status && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle(partner.nda_status)}`}
                          >
                            NDA: {partner.nda_status}
                          </span>
                        )}
                        {partner.ta_status && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle(partner.ta_status)}`}
                          >
                            TA: {partner.ta_status}
                          </span>
                        )}
                        {partner.workshare_percentage != null && (
                          <span className="text-xs text-muted-foreground">
                            {partner.workshare_percentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agreements */}
          {agreementItems.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Teaming Agreements ({agreementItems.length})
              </h2>
              <div className="divide-y divide-border rounded-xl border border-border bg-card/50">
                {agreementItems.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {a.partner_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {a.agreement_type ?? 'Teaming Agreement'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {a.executed_date && (
                        <span>
                          {new Date(a.executed_date).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric', year: 'numeric' }
                          )}
                        </span>
                      )}
                      {a.expiration_date && (
                        <span className="text-muted-foreground">
                          exp{' '}
                          {new Date(a.expiration_date).toLocaleDateString(
                            'en-US',
                            { month: 'short', year: 'numeric' }
                          )}
                        </span>
                      )}
                      {a.status && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 ${statusStyle(a.status)}`}
                        >
                          {a.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
