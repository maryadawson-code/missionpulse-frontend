// filepath: components/features/proposals/WordOnlineButton.tsx
'use client'

import { useState } from 'react'
import { FileText, ExternalLink, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────

interface WordOnlineButtonProps {
  documentId: string
  cloudFileId?: string | null
  provider?: string
  className?: string
}

// ─── Component ───────────────────────────────────────────────

export function WordOnlineButton({
  documentId: _documentId,
  cloudFileId,
  provider,
  className,
}: WordOnlineButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleOpen = () => {
    if (!cloudFileId) return
    setLoading(true)

    // Build the Word Online URL based on cloud file ID
    const url =
      provider === 'google'
        ? `https://docs.google.com/document/d/${cloudFileId}/edit`
        : `https://onedrive.live.com/edit.aspx?resid=${cloudFileId}`

    window.open(url, '_blank', 'noopener,noreferrer')
    // Brief loading indicator for user feedback
    setTimeout(() => setLoading(false), 600)
  }

  if (!cloudFileId) {
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
        Connect to Word Online
      </button>
    )
  }

  return (
    <button
      onClick={handleOpen}
      disabled={loading}
      className={cn(
        'inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm',
        'font-medium text-white transition-colors hover:bg-blue-500',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      Edit in Word Online
      <ExternalLink className="h-3 w-3 opacity-60" />
    </button>
  )
}
