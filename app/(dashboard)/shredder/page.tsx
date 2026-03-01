import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

export const metadata: Metadata = {
  title: 'RFP Shredder — MissionPulse',
}

export default async function ShredderLandingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'compliance', 'shouldRender')) return null

  // Fetch opportunities with their RFP document counts
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, title, status, agency, created_at')
    .order('created_at', { ascending: false })

  // Fetch document counts per opportunity
  const oppIds = (opportunities ?? []).map((o) => o.id)
  let docCounts: Record<string, number> = {}

  if (oppIds.length > 0) {
    const { data: docs } = await supabase
      .from('rfp_documents')
      .select('opportunity_id')
      .in('opportunity_id', oppIds)

    if (docs) {
      docCounts = docs.reduce<Record<string, number>>((acc, d) => {
        if (d.opportunity_id) {
          acc[d.opportunity_id] = (acc[d.opportunity_id] ?? 0) + 1
        }
        return acc
      }, {})
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'RFP Shredder' }]} />
      <div>
        <h1 className="text-2xl font-bold text-foreground">RFP Shredder</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload and parse RFP documents to extract requirements for each opportunity
        </p>
      </div>

      {(!opportunities || opportunities.length === 0) ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No opportunities found. Create an opportunity in the Pipeline first.
          </p>
          <Link
            href="/pipeline"
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Go to Pipeline
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opp) => {
            const count = docCounts[opp.id] ?? 0
            return (
              <Link
                key={opp.id}
                href={`/pipeline/${opp.id}/shredder`}
                className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-accent/50"
              >
                <h3 className="font-semibold text-foreground group-hover:text-primary truncate">
                  {opp.title}
                </h3>
                {opp.agency && (
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    {opp.agency}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {opp.status ?? 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {count} document{count !== 1 ? 's' : ''}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
