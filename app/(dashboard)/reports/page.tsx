import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FileText, Download, Clock } from 'lucide-react'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusStyle(status: string | null): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'processing':
    case 'generating':
      return 'bg-amber-500/15 text-amber-300'
    case 'failed':
      return 'bg-red-500/15 text-red-300'
    default:
      return 'bg-slate-500/15 text-slate-300'
  }
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: reports } = await supabase
    .from('generated_reports')
    .select(
      'id, title, report_type, status, output_format, file_url, generated_at, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(100)

  const items = reports ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Generated Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          AI-generated reports including compliance summaries, win/loss
          analyses, and pipeline snapshots.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No reports generated yet. Reports are created automatically by AI
            agents or on demand from module pages.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Report
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Format
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Generated
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Download
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((report) => (
                  <tr
                    key={report.id}
                    className="transition-colors hover:bg-card/50"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-sm font-medium text-foreground truncate max-w-[260px]">
                          {report.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {(report.report_type ?? 'general').replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground uppercase">
                      {report.output_format ?? 'pdf'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle(
                          report.status
                        )}`}
                      >
                        {report.status === 'processing' && (
                          <Clock className="h-2.5 w-2.5 animate-spin" />
                        )}
                        {(report.status ?? 'pending').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {formatDate(report.generated_at ?? report.created_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      {report.file_url && report.status === 'completed' ? (
                        <a
                          href={report.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
