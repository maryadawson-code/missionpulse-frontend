'use client'

import { useState, useRef, useCallback } from 'react'
import {
  FileText,
  Upload,
  Trash2,
  RefreshCw,
  Loader2,
  Lock,
  Search,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { addToast } from '@/components/ui/Toast'
import {
  uploadDocument,
  reuploadDocument,
  deleteDocument,
} from '@/app/(dashboard)/pipeline/[id]/documents/actions'
import { DOCUMENT_CATEGORIES } from '@/lib/utils/storage'

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
  locked_by: string | null
  tags: string[] | null
  uploaded_by: string | null
  created_at: string | null
  updated_at: string | null
}

interface DocumentLibraryProps {
  documents: Document[]
  opportunityId: string
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
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DocumentLibrary({
  documents,
  opportunityId,
}: DocumentLibraryProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [category, setCategory] = useState<string>('Support')
  const [filterCategory, setFilterCategory] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null)
  const [reuploadTarget, setReuploadTarget] = useState<Document | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const reuploadRef = useRef<HTMLInputElement>(null)

  const filtered = documents.filter((d) => {
    if (filterCategory !== 'All' && d.document_type !== filterCategory) return false
    if (search && !d.document_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)

      try {
        const result = await uploadDocument(opportunityId, formData)
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
    [opportunityId, category]
  )

  const handleReupload = useCallback(
    async (file: File) => {
      if (!reuploadTarget) return
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      try {
        const result = await reuploadDocument(reuploadTarget.id, opportunityId, formData)
        if (result.success) {
          addToast('success', `New version uploaded`)
        } else {
          addToast('error', result.error ?? 'Upload failed')
        }
      } catch {
        addToast('error', 'An unexpected error occurred')
      } finally {
        setIsUploading(false)
        setReuploadTarget(null)
        if (reuploadRef.current) reuploadRef.current.value = ''
      }
    },
    [reuploadTarget, opportunityId]
  )

  return (
    <div className="space-y-4">
      {/* Upload bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_CATEGORIES.map((c) => (
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

        {/* Hidden reupload input */}
        <input
          ref={reuploadRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleReupload(file)
          }}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 rounded-md border border-border bg-background pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {DOCUMENT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} document{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Document list */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {documents.length === 0
              ? 'No documents uploaded yet.'
              : 'No documents match your filters.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
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
                  Version
                </th>
                <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Size
                </th>
                <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Updated
                </th>
                <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[120px]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((doc) => (
                <tr key={doc.id} className="transition-colors hover:bg-card/50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
                      <span className="text-sm font-medium text-foreground truncate max-w-[240px]">
                        {doc.document_name}
                      </span>
                      {doc.is_locked && (
                        <Lock className="h-3 w-3 text-amber-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {doc.document_type ?? '—'}
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
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="New version"
                        aria-label="Upload new version"
                        onClick={() => {
                          setReuploadTarget(doc)
                          reuploadRef.current?.click()
                        }}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        title="Delete"
                        aria-label="Delete document"
                        onClick={() => setDeleteTarget(doc)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null)
          }}
          title="Delete Document"
          description={`Archive "${deleteTarget.document_name}"? The file will be hidden from the library.`}
          confirmLabel="Delete"
          destructive
          onConfirm={() => deleteDocument(deleteTarget.id, opportunityId)}
          successMessage="Document archived."
          onSuccess={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
