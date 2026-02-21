// filepath: app/(dashboard)/proposals/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusColor(status: string | null): string {
  switch (status) {
    case 'approved':
    case 'final':
      return 'bg-emerald-500/20 text-emerald-300'
    case 'in_review':
    case 'review':
      return 'bg-amber-500/20 text-amber-300'
    case 'draft':
      return 'bg-slate-500/20 text-slate-300'
    case 'rejected':
      return 'bg-red-500/20 text-red-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

export default async function ProposalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'proposals', 'shouldRender')) {
    redirect('/')
  }

  const { data: documents, error } = await supabase
    .from('proposal_documents')
    .select('id, title, doc_type, status, file_size, version, access_level, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100)

  const docs = documents ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Proposals</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage proposal documents, drafts, and submissions across the development lifecycle.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load proposals: {error.message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Version
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Size
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Access
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                    No proposal documents yet. Documents will appear here as proposals are developed.
                  </td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc.id} className="transition-colors hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-200">
                      {doc.title}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {(doc.doc_type ?? 'document').replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(doc.status)}`}>
                        {(doc.status ?? 'draft').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      v{doc.version ?? 1}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400 font-mono">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-block rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                        {(doc.access_level ?? 'internal').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {formatDate(doc.updated_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Showing {docs.length} document{docs.length !== 1 ? 's' : ''}. Proposal documents are subject to CUI handling requirements.
      </p>
    </div>
  )
}
