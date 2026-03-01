'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react'

import { uploadAndParseRfp, uploadAndParseZip } from '@/app/(dashboard)/pipeline/[id]/shredder/actions'
import { addToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

interface RfpUploaderProps {
  opportunityId: string
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
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
        if (!ACCEPTED_TYPES.includes(file.type)) {
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
          if (isZip) {
            const formData = new FormData()
            formData.append('file', file)
            const result = await uploadAndParseZip(opportunityId, formData)
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
            const formData = new FormData()
            formData.append('file', file)
            const result = await uploadAndParseRfp(opportunityId, formData)
            setFileStatuses((prev) =>
              prev.map((s, idx) =>
                idx === i
                  ? {
                      ...s,
                      status: result.success ? 'success' : 'error',
                      message: result.success
                        ? 'Parsed successfully'
                        : result.error ?? 'Upload failed',
                    }
                  : s
              )
            )
            if (result.success) totalProcessed++
          }
        } catch {
          setFileStatuses((prev) =>
            prev.map((s, idx) =>
              idx === i
                ? { ...s, status: 'error', message: 'Unexpected error' }
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
          accept=".pdf,.docx,.doc,.txt,.zip"
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
                Extracting text from documents
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
                PDF, Word, text, or ZIP files (SAM.gov packages). Max 50MB each.
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
