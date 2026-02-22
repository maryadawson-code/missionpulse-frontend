// filepath: components/features/pricing/ExcelOnlineButton.tsx
'use client'

import { useState } from 'react'
import { Table2, ExternalLink, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────

interface ExcelOnlineButtonProps {
  documentId: string
  cloudFileId?: string | null
  className?: string
}

// ─── Component ───────────────────────────────────────────────

export function ExcelOnlineButton({
  documentId,
  cloudFileId,
  className,
}: ExcelOnlineButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleOpen = () => {
    if (!cloudFileId) return
    setLoading(true)

    const url = `https://onedrive.live.com/edit.aspx?resid=${cloudFileId}`
    window.open(url, '_blank', 'noopener,noreferrer')
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
        <Table2 className="h-4 w-4" />
        Connect to Excel Online
      </button>
    )
  }

  return (
    <button
      onClick={handleOpen}
      disabled={loading}
      className={cn(
        'inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-sm',
        'font-medium text-white transition-colors hover:bg-emerald-500',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Table2 className="h-4 w-4" />
      )}
      Edit in Excel Online
      <ExternalLink className="h-3 w-3 opacity-60" />
    </button>
  )
}
