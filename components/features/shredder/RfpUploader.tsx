'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react'

import {
  getStorageUploadInfo,
  processStoredFile,
  processStoredZip,
} from '@/app/(dashboard)/pipeline/[id]/shredder/actions'
import { addToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

interface RfpUploaderProps {
  opportunityId: string
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
]

interface FileStatus {
  name: string
  status: 'uploading' | 'success' | 'error'
  message?: string
}

export function RfpUploader({ opportunityId }: RfpUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    async (files: FileList) => {
      const validFiles: File[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!ACCEPTED_TYPES.includes(file.type) && !file.name.endsWith('.zip')) {
          addToast('error', `${file.name}: unsupported file type`)
          continue
        }
        if (file.size > 50 * 1024 * 1024) {
          addToast('error', `${file.name}: exceeds 50MB limit`)
          continue
        }
        validFiles.push(file)
      }

      if (validFiles.length === 0) return

      setIsUploading(true)
      setFileStatuses(
        validFiles.map((f) => ({ name: f.name, status: 'uploading' }))
      )

      let totalProcessed = 0

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        const isZip = file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.endsWith('.zip')

        try {
          // Step 1: Get user's access token and storage path from server
          const info = await getStorageUploadInfo(opportunityId, file.name)
          if (!info.success || !info.data) {
            setFileStatuses((prev) =>
              prev.map((s, idx) =>
                idx === i
                  ? { ...s, status: 'error', message: info.error ?? 'Failed to prepare upload' }
                  : s
              )
            )
            continue
          }

          const { accessToken, storagePath, storageUrl } = info.data

          // Step 2: Upload directly to Supabase Storage REST API
          // Uses the user's JWT — same auth as the server client that was working before.
          // Bypasses Vercel's 4.5MB server action body limit.
          const uploadUrl = `${storageUrl}/storage/v1/object/documents/${storagePath}`
          const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': file.type || 'application/octet-stream',
            },
            body: file,
          })

          if (!uploadRes.ok) {
            const errBody = await uploadRes.json().catch(() => ({ message: 'Upload failed' }))
            const rawError = errBody.message || errBody.error || 'Unknown error'
            const isRLS = rawError.includes('row-level security') || rawError.includes('RLS')
            const userMessage = isRLS
              ? 'Storage not configured — admin must run storage setup (see docs)'
              : `Upload failed: ${rawError}`
            setFileStatuses((prev) =>
              prev.map((s, idx) =>
                idx === i
                  ? { ...s, status: 'error', message: userMessage }
                  : s
              )
            )
            continue
          }

          // Step 3: Call server action with only metadata (no file data)
          if (isZip) {
            const result = await processStoredZip(opportunityId, storagePath, file.name, file.size)
            setFileStatuses((prev) =>
              prev.map((s, idx) =>
                idx === i
                  ? {
                      ...s,
                      status: result.success ? 'success' : 'error',
                      message: result.success
                        ? `Extracted ${result.data?.count ?? 0} document${(result.data?.count ?? 0) !== 1 ? 's' : ''}`
                        : result.error ?? 'ZIP processing failed',
                    }
                  : s
              )
            )
            if (result.success) totalProcessed += result.data?.count ?? 0
          } else {
            const result = await processStoredFile(
              opportunityId,
              storagePath,
              file.name,
              file.type,
              file.size
            )
            setFileStatuses((prev) =>
              prev.map((s, idx) =>
                idx === i
                  ? {
                      ...s,
                      status: result.success ? 'success' : 'error',
                      message: result.success
                        ? 'Parsed successfully'
                        : result.error ?? 'Processing failed',
                    }
                  : s
              )
            )
            if (result.success) totalProcessed++
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upload failed'
          setFileStatuses((prev) =>
            prev.map((s, idx) =>
              idx === i
                ? { ...s, status: 'error', message }
                : s
            )
          )
        }
      }

      addToast('success', `Processed ${totalProcessed} document${totalProcessed !== 1 ? 's' : ''}`)
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    },
    [opportunityId]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files)
      }
    },
    [handleFiles]
  )

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={cn(
          'relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-card/50',
          isUploading && 'pointer-events-none opacity-60'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.zip"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Processing files...
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Uploading to storage and extracting text
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {isDragging ? (
              <FileText className="h-10 w-10 text-primary" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {isDragging
                  ? 'Drop your files here'
                  : 'Upload RFP Documents'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, Word, Excel, PowerPoint, text, or ZIP (SAM.gov). Max 50MB each.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Per-file status list */}
      {fileStatuses.length > 0 && (
        <div className="space-y-1.5">
          {fileStatuses.map((fs, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              {fs.status === 'uploading' && (
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              )}
              {fs.status === 'success' && (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              {fs.status === 'error' && (
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span className="truncate text-foreground">{fs.name}</span>
              {fs.message && (
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {fs.message}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
