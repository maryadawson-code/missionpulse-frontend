import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import Link from 'next/link'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function confidenceStyle(level: string | null): string {
  switch (level?.toLowerCase()) {
    case 'high':
    case 'confirmed':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'medium':
      return 'bg-amber-500/15 text-amber-300'
    case 'low':
    case 'rumor':
      return 'bg-red-500/15 text-red-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

export default async function IntelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: opp } = await supabase
    .from('opportunities')
    .select('id, title')
    .eq('id', id)
    .single()

  if (!opp) notFound()

  // Fetch intelligence items
  const { data: intelItems } = await supabase
    .from('intel_collection')
    .select(
      'id, intel_type, content, source_name, source_type, confidence_level, classification, tags, relevance_score, created_at'
    )
    .eq('opportunity_id', id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Fetch competitive matrices
  const { data: matrices } = await supabase
    .from('competitive_matrix')
    .select('id, matrix_name, description, status, created_at')
    .eq('opportunity_id', id)
    .order('created_at', { ascending: false })

  const intel = intelItems ?? []
  const matrixList = matrices ?? []

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opp.title, href: `/pipeline/${id}` },
          { label: 'Intelligence' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Intelligence Collection
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Competitive intelligence and market data for {opp.title}.
        </p>
      </div>

      {/* Competitive Matrices */}
      {matrixList.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Competitive Matrices
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {matrixList.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-border bg-card/50 p-4"
              >
                <h3 className="text-sm font-medium text-foreground">
                  {m.matrix_name}
                </h3>
                {m.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
                )}
                <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                  {m.status && (
                    <span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-slate-300">
                      {m.status}
                    </span>
                  )}
                  <span>{formatDate(m.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intel Collection */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Collected Intelligence
        </h2>

        {intel.length === 0 ? (
          <div className="rounded-lg border border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No intelligence collected for this opportunity yet. Use the
              Capture Analysis AI agent to generate initial intelligence, or
              manually add intel items.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {intel.map((item) => {
              const tags = Array.isArray(item.tags) ? item.tags : []
              return (
                <div key={item.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {(item.intel_type ?? 'general').replace(/_/g, ' ')}
                      </span>
                      {item.confidence_level && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${confidenceStyle(
                            item.confidence_level
                          )}`}
                        >
                          {item.confidence_level}
                        </span>
                      )}
                      {item.classification && (
                        <span className="text-[10px] text-muted-foreground">
                          {item.classification}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">{item.content}</p>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    {item.source_name && (
                      <span>
                        Source: {item.source_name}
                        {item.source_type && ` (${item.source_type})`}
                      </span>
                    )}
                    {item.relevance_score != null && (
                      <span>Relevance: {item.relevance_score}/10</span>
                    )}
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag, i) => (
                        <span
                          key={i}
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          href={`/pipeline/${id}`}
          className="text-xs text-primary hover:underline"
        >
          Back to Opportunity
        </Link>
        <Link
          href={`/pipeline/${id}/strategy`}
          className="text-xs text-primary hover:underline"
        >
          Strategy &amp; Black Hat
        </Link>
      </div>
    </div>
  )
}
