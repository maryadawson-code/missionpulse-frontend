'use client'

import { useState } from 'react'
import { FileText, Trash2, Eye, ChevronDown, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { deleteRfpDocument } from '@/app/(dashboard)/pipeline/[id]/shredder/actions'

interface RfpDocument {
  id: string
  file_name: string
  file_type: string
  file_size: number | null
  upload_status: string | null
  created_at: string | null
  extracted_text: string | null
}

interface RfpDocumentListProps {
  documents: RfpDocument[]
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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RfpDocumentList({ documents, opportunityId }: RfpDocumentListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RfpDocument | null>(null)

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-border p-12 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          No RFP documents uploaded yet. Upload a PDF to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        Uploaded Documents ({documents.length})
      </h2>

      <div className="space-y-2">
        {documents.map((doc) => {
          const isExpanded = expandedId === doc.id
          const isProcessed = doc.upload_status === 'processed'
          const textLength = doc.extracted_text?.length ?? 0

          return (
            <div
              key={doc.id}
              className="rounded-lg border border-border bg-card"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label={isExpanded ? 'Collapse document' : 'Expand document'}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                <FileText className="h-5 w-5 flex-shrink-0 text-primary" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {doc.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.file_size)} · {formatDate(doc.created_at)}
                    {isProcessed && textLength > 0 && (
                      <> · {textLength.toLocaleString()} chars extracted</>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isProcessed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      Parsed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                      <AlertCircle className="h-3 w-3" />
                      {doc.upload_status ?? 'Unknown'}
                    </span>
                  )}

                  {isProcessed && (
                    <Link href={`/pipeline/${opportunityId}/shredder/requirements?doc=${doc.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="View requirements">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTarget(doc)}
                    aria-label="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {isExpanded && doc.extracted_text && (
                <div className="border-t border-border px-4 py-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Extracted Text Preview
                  </p>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-background p-3 text-xs text-foreground">
                    {doc.extracted_text.slice(0, 3000)}
                    {doc.extracted_text.length > 3000 && '\n\n... (truncated)'}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {deleteTarget && (
        <ConfirmModal
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null)
          }}
          title="Delete Document"
          description={`Permanently delete "${deleteTarget.file_name}"? This will also remove the uploaded file and any extracted text.`}
          confirmLabel="Delete"
          destructive
          onConfirm={() => deleteRfpDocument(deleteTarget.id, opportunityId)}
          successMessage="Document deleted."
          onSuccess={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
