// filepath: components/features/proposals/GoogleDocsButton.tsx
'use client'

import { useState } from 'react'
import { FileText, ExternalLink, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────

interface GoogleDocsButtonProps {
  documentId: string
  fileId?: string | null
  className?: string
}

// ─── Component ───────────────────────────────────────────────

export function GoogleDocsButton({
  documentId,
  fileId,
  className,
}: GoogleDocsButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleOpen = () => {
    if (!fileId) return
    setLoading(true)

    const url = `https://docs.google.com/document/d/${fileId}/edit`
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => setLoading(false), 600)
  }

  if (!fileId) {
    return (
      <button
        disabled
        className={cn(
          'inline-flex items-center gap-2 rounded-md bg-gray-700 px-3 py-1.5 text-sm',
          'text-gray-400 cursor-not-allowed opacity-60',
          className,
        )}
      >
        <FileText className="h-4 w-4" />
        Connect to Google Docs
      </button>
    )
  }

  return (
    <button
      onClick={handleOpen}
      disabled={loading}
      className={cn(
        'inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-1.5 text-sm',
        'font-medium text-white transition-colors hover:bg-sky-500',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      Edit in Google Docs
      <ExternalLink className="h-3 w-3 opacity-60" />
    </button>
  )
}
