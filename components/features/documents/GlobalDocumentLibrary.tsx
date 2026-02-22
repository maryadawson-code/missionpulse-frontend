'use client'

import { useState, useRef, useCallback } from 'react'
import {
  FileText,
  Upload,
  Loader2,
  Search,
  Lock,
  Building2,
  FolderOpen,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addToast } from '@/components/ui/Toast'
import { uploadCompanyDocument } from '@/app/(dashboard)/documents/actions'

const COMPANY_CATEGORIES = [
  'Templates',
  'Past Performance',
  'Capabilities',
  'Certifications',
] as const

interface Document {
  id: string
  document_name: string
  document_type: string | null
  description: string | null
  file_url: string | null
  file_size: number | null
  mime_type: string | null
  status: string | null
  current_version: number | null
  is_locked: boolean | null
  folder_path: string | null
  tags: string[] | null
  opportunity_id: string | null
  uploaded_by: string | null
  created_at: string | null
  updated_at: string | null
}

interface GlobalDocumentLibraryProps {
  documents: Document[]
  opportunityMap: Record<string, string>
  canEdit?: boolean
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function statusStyle(status: string | null): string {
  switch (status) {
    case 'final':
    case 'approved':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'in_review':
    case 'review':
      return 'bg-amber-500/15 text-amber-300'
    case 'draft':
      return 'bg-slate-500/15 text-slate-300'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function GlobalDocumentLibrary({
  documents,
  opportunityMap,
  canEdit = true,
}: GlobalDocumentLibraryProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [category, setCategory] = useState<string>('Templates')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('All')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = documents.filter((d) => {
    if (
      filterCategory !== 'All' &&
      d.document_type !== filterCategory
    )
      return false
    if (
      search &&
      !d.document_name.toLowerCase().includes(search.toLowerCase())
    )
      return false
    return true
  })

  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)

      try {
        const result = await uploadCompanyDocument(formData)
        if (result.success) {
          addToast('success', `${file.name} uploaded`)
        } else {
          addToast('error', result.error ?? 'Upload failed')
        }
      } catch {
        addToast('error', 'An unexpected error occurred')
      } finally {
        setIsUploading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [category]
  )

  return (
    <div className="space-y-4">
      {/* Upload bar — only visible when user has edit permission */}
      {canEdit && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8 w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload Document
          </Button>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-[240px] rounded-md border border-border bg-background pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {COMPANY_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {documents.length} documents
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {documents.length === 0
              ? 'No documents yet. Upload templates, past performance narratives, and certifications.'
              : 'No documents match your search.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Opportunity
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Version
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Size
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className="transition-colors hover:bg-card/50"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-sm font-medium text-foreground truncate max-w-[260px]">
                          {doc.document_name}
                        </span>
                        {doc.is_locked && (
                          <Lock className="h-3 w-3 text-amber-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {(doc.document_type ?? 'document').replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle(
                          doc.status
                        )}`}
                      >
                        {(doc.status ?? 'draft').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {doc.opportunity_id ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate max-w-[140px]">
                            {opportunityMap[doc.opportunity_id] ?? 'Unknown'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Company</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      v{doc.current_version ?? 1}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {formatDate(doc.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        All documents are subject to CUI handling requirements.
      </p>
    </div>
  )
}
