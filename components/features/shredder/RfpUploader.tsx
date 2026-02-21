'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, FileText, Loader2 } from 'lucide-react'

import { uploadAndParseRfp } from '@/app/(dashboard)/pipeline/[id]/shredder/actions'
import { addToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

interface RfpUploaderProps {
  opportunityId: string
}

export function RfpUploader({ opportunityId }: RfpUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        addToast('error', 'Only PDF files are supported')
        return
      }

      if (file.size > 50 * 1024 * 1024) {
        addToast('error', 'File exceeds maximum size of 50MB')
        return
      }

      setIsUploading(true)
      setProgress('Uploading and parsing...')

      const formData = new FormData()
      formData.append('file', file)

      try {
        const result = await uploadAndParseRfp(opportunityId, formData)
        if (result.success) {
          addToast('success', `${file.name} uploaded and parsed successfully`)
        } else {
          addToast('error', result.error ?? 'Upload failed')
        }
      } catch {
        addToast('error', 'An unexpected error occurred')
      } finally {
        setIsUploading(false)
        setProgress(null)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [opportunityId]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
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
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
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
        accept=".pdf"
        onChange={handleInputChange}
        className="hidden"
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">{progress}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Extracting text from PDF...
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
              {isDragging ? 'Drop your PDF here' : 'Upload RFP Document'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Drag and drop a PDF file, or click to browse. Max 50MB.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
