'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react'

import { shredDocument } from '@/app/(dashboard)/pipeline/[id]/shredder/actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AutoShredderProps {
  documentIds: string[]
  opportunityId: string
  onComplete: () => void
}

type DocStatus = 'pending' | 'shredding' | 'done' | 'failed'

interface DocProgress {
  id: string
  status: DocStatus
  requirementCount?: number
  error?: string
}

export function AutoShredder({ documentIds, opportunityId, onComplete }: AutoShredderProps) {
  const [progress, setProgress] = useState<DocProgress[]>(() =>
    documentIds.map((id) => ({ id, status: 'pending' }))
  )
  const [isDone, setIsDone] = useState(false)
  const startedRef = useRef(false)

  const processAll = useCallback(async () => {
    if (startedRef.current) return
    startedRef.current = true

    let consecutiveFailures = 0

    for (let i = 0; i < documentIds.length; i++) {
      const docId = documentIds[i]

      // Mark current as shredding
      setProgress((prev) =>
        prev.map((p) => (p.id === docId ? { ...p, status: 'shredding' } : p))
      )

      const result = await shredDocument(docId, opportunityId)

      setProgress((prev) =>
        prev.map((p) =>
          p.id === docId
            ? {
                ...p,
                status: result.success ? 'done' : 'failed',
                requirementCount: result.data?.requirementCount,
                error: result.error,
              }
            : p
        )
      )

      if (result.success) {
        consecutiveFailures = 0
      } else {
        consecutiveFailures++
        // Stop early on systemic failure (AI unavailable, auth, etc.)
        const isSystemic = result.error?.includes('unavailable') ||
          result.error?.includes('token limit') ||
          result.error?.includes('Not authenticated') ||
          result.error?.includes('subscription') ||
          result.error?.includes('role does not have access')
        if (isSystemic || consecutiveFailures >= 3) {
          // Mark remaining as failed with same error
          const remainingIds = documentIds.slice(i + 1)
          if (remainingIds.length > 0) {
            setProgress((prev) =>
              prev.map((p) =>
                remainingIds.includes(p.id)
                  ? { ...p, status: 'failed', error: result.error ?? 'Skipped — earlier failure' }
                  : p
              )
            )
          }
          break
        }
      }
    }

    setIsDone(true)
  }, [documentIds, opportunityId])

  useEffect(() => {
    processAll()
  }, [processAll])

  // Auto-dismiss after 5 seconds once done
  useEffect(() => {
    if (!isDone) return
    const timer = setTimeout(onComplete, 5000)
    return () => clearTimeout(timer)
  }, [isDone, onComplete])

  const completedCount = progress.filter((p) => p.status === 'done').length
  const failedCount = progress.filter((p) => p.status === 'failed').length
  const totalReqs = progress.reduce((sum, p) => sum + (p.requirementCount ?? 0), 0)
  const currentIdx = progress.findIndex((p) => p.status === 'shredding')

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          {isDone
            ? `Extracted ${totalReqs} requirement${totalReqs !== 1 ? 's' : ''} from ${completedCount} document${completedCount !== 1 ? 's' : ''}`
            : `Extracting requirements from document ${currentIdx + 1} of ${documentIds.length}...`}
        </h3>
      </div>

      {failedCount > 0 && isDone && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {failedCount} document{failedCount !== 1 ? 's' : ''} failed — see status badges below for details.
        </p>
      )}

      <div className="space-y-1">
        {progress.map((p) => (
          <div
            key={p.id}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs',
              p.status === 'shredding' && 'bg-primary/10',
              p.status === 'done' && 'bg-emerald-500/10',
              p.status === 'failed' && 'bg-red-500/10',
            )}
          >
            {p.status === 'pending' && (
              <div className="h-3 w-3 rounded-full border border-muted-foreground/40" />
            )}
            {p.status === 'shredding' && (
              <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
            )}
            {p.status === 'done' && (
              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            {p.status === 'failed' && (
              <XCircle className="h-3 w-3 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span className="truncate text-muted-foreground font-mono">{p.id.slice(0, 8)}...</span>
            {p.status === 'done' && p.requirementCount !== undefined && (
              <span className="ml-auto text-emerald-700 dark:text-emerald-300">
                {p.requirementCount} req{p.requirementCount !== 1 ? 's' : ''}
              </span>
            )}
            {p.status === 'failed' && p.error && (
              <span className="ml-auto text-red-600 dark:text-red-400 truncate max-w-[200px]">
                {p.error}
              </span>
            )}
          </div>
        ))}
      </div>

      {isDone && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={onComplete}
        >
          Dismiss
        </Button>
      )}
    </div>
  )
}
