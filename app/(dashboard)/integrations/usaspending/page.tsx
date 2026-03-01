import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { AwardHistory } from '@/components/features/pipeline/AwardHistory'
import { SpendingTrends } from '@/components/features/pipeline/SpendingTrends'

export default async function USAspendingPage() {
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
  if (!hasPermission(role, 'integrations', 'shouldRender')) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">USAspending Integration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Federal award data, spending analytics, and prime/sub relationships from USAspending.gov.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card/50 p-4">
        <p className="text-sm text-muted-foreground">
          USAspending data is automatically enriched on opportunity records when an agency
          and NAICS code are specified. Below are the analysis tools available — navigate
          to an opportunity detail page to view enriched award data.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <SpendingTrends agency={null} naicsCode={null} />
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <AwardHistory agency={null} naicsCode={null} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Data Source</p>
          <p className="mt-1 text-sm font-medium text-foreground">USAspending.gov API</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Authentication</p>
          <p className="mt-1 text-sm font-medium text-emerald-400">No API key required</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="mt-1 text-sm font-medium text-cyan-400">Active</p>
        </div>
      </div>
    </div>
  )
}
