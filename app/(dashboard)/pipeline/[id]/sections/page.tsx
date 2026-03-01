import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import Link from 'next/link'

function statusStyle(status: string | null): string {
  switch (status?.toLowerCase()) {
    case 'final':
    case 'approved':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'review':
    case 'in_review':
      return 'bg-amber-500/15 text-amber-300'
    case 'draft':
      return 'bg-blue-500/15 text-blue-300'
    case 'revision':
      return 'bg-red-500/15 text-red-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

export default async function SectionsHubPage({
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

  const { data: sections } = await supabase
    .from('proposal_sections')
    .select(
      'id, section_title, volume, status, writer_id, current_pages, page_limit, sort_order'
    )
    .eq('opportunity_id', id)
    .order('sort_order', { ascending: true })

  const items = sections ?? []

  // Resolve writer names
  const writerIds = Array.from(
    new Set(items.map((s) => s.writer_id).filter(Boolean))
  ) as string[]
  const writerMap: Record<string, string> = {}
  if (writerIds.length > 0) {
    const { data: writers } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', writerIds)
    for (const w of writers ?? []) {
      writerMap[w.id] = w.full_name ?? w.email
    }
  }

  // Group by volume
  const volumes = Array.from(
    new Set(items.map((s) => s.volume ?? 'Unassigned'))
  )

  const totalPages = items.reduce((s, sec) => s + (sec.current_pages ?? 0), 0)
  const totalPageLimit = items.reduce((s, sec) => s + (sec.page_limit ?? 0), 0)
  const completed = items.filter(
    (s) => s.status === 'final' || s.status === 'approved'
  ).length

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opp.title, href: `/pipeline/${id}` },
          { label: 'Sections' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-foreground">Proposal Sections</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All proposal sections for {opp.title}. Click to edit.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Total Sections</p>
          <p className="mt-1 text-lg font-bold text-foreground">{items.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">
            {completed}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Current Pages</p>
          <p className="mt-1 text-lg font-bold text-foreground">{totalPages}</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground">Page Limit</p>
          <p className="mt-1 text-lg font-bold text-foreground">{totalPageLimit}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No sections defined yet. Use the Swimlane board to create sections.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {volumes.map((vol) => {
            const volSections = items.filter(
              (s) => (s.volume ?? 'Unassigned') === vol
            )
            return (
              <div key={vol} className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {vol} ({volSections.length})
                </h2>
                <div className="divide-y divide-border rounded-xl border border-border bg-card/50">
                  {volSections.map((sec) => (
                    <Link
                      key={sec.id}
                      href={`/pipeline/${id}/sections/${sec.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground group-hover:text-cyan transition-colors">
                          {sec.section_title}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                          {sec.writer_id && writerMap[sec.writer_id] && (
                            <span>{writerMap[sec.writer_id]}</span>
                          )}
                          {sec.current_pages != null && sec.current_pages > 0 && (
                            <span>
                              {sec.current_pages}/{sec.page_limit ?? '—'} pages
                            </span>
                          )}
                        </div>
                      </div>
                      {sec.status && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle(sec.status)}`}
                        >
                          {sec.status}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
