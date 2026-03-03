// filepath: app/(dashboard)/integrations/bloomberg-gov/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

export default async function BloombergGovPage() {
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
  if (!hasPermission(role, 'integrations', 'canView')) redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bloomberg Government</h1>
        <p className="text-sm text-muted-foreground">
          Import opportunity intelligence, competitive landscape data, and market analytics
          from Bloomberg Government.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Connection Setup</h3>
        <p className="text-sm text-muted-foreground">
          To connect, provide your Bloomberg Government API credentials in the Enterprise
          admin panel. Contact your Bloomberg Gov account manager to obtain API access.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-3">Available Data</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            { name: 'Contract Awards', desc: 'Historical award data and contract values' },
            { name: 'Agency Budgets', desc: 'Federal budget analysis and projections' },
            { name: 'Competitive Intel', desc: 'Competitor win/loss data and positioning' },
            { name: 'Market Analysis', desc: 'Sector trends and spending forecasts' },
            { name: 'Decision Makers', desc: 'Key contacts and organizational charts' },
            { name: 'Regulatory Updates', desc: 'Policy changes and compliance impacts' },
          ].map((item) => (
            <div key={item.name} className="rounded-md border p-3">
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm">
        <p className="font-medium text-yellow-500">Enterprise Feature</p>
        <p className="text-muted-foreground text-xs mt-1">
          Bloomberg Government integration requires an Enterprise plan and a separate
          Bloomberg Gov subscription. Contact sales@missionpulse.ai for pricing.
        </p>
      </div>
    </div>
  )
}
