// filepath: components/features/sync/CascadePreview.tsx
/**
 * Cascade Preview
 *
 * Shows a read-only preview of all documents and fields that would
 * be affected if a coordination rule fires. Users can review the
 * changes and confirm or cancel before the cascade is applied.
 *
 * v1.3 Sprint 30 — Cross-Document Intelligence
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  X,
  Loader2,
  FileText,
  Zap,
} from 'lucide-react'
import { previewCascade } from '@/lib/sync/coordination-engine'
import type { CascadePreviewItem } from '@/lib/types/sync'

// ─── Props ────────────────────────────────────────────────────

interface CascadePreviewProps {
  ruleId: string
  newValue: unknown
  onConfirm: () => void
  onCancel: () => void
}

// ─── Component ────────────────────────────────────────────────

export function CascadePreview({
  ruleId,
  newValue,
  onConfirm,
  onCancel,
}: CascadePreviewProps) {
  const [items, setItems] = useState<CascadePreviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPreview = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const preview = await previewCascade(ruleId, newValue)
      setItems(preview)
    } catch {
      setError('Failed to load cascade preview. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [ruleId, newValue])

  useEffect(() => {
    loadPreview()
  }, [loadPreview])

  return (
    <div className="rounded-xl border border-border bg-background/95 p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15">
          <Zap className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Cascade Preview
          </h3>
          <p className="text-xs text-muted-foreground">
            The following documents will be updated when this rule executes.
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Analyzing affected documents...
          </span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card/30 px-4 py-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No documents would be affected by this change.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Target documents matching this rule&apos;s criteria were not found.
          </p>
        </div>
      ) : (
        <>
          {/* Affected count badge */}
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-500/30">
              {items.length} document{items.length !== 1 ? 's' : ''} affected
            </span>
            {items[0]?.ruleDescription && (
              <span className="text-xs text-muted-foreground truncate">
                {items[0].ruleDescription}
              </span>
            )}
          </div>

          {/* Changes table */}
          <div className="overflow-hidden rounded-lg border border-border">
            {/* Table header */}
            <div className="grid grid-cols-4 gap-px bg-border">
              <div className="bg-card/70 px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Document
                </span>
              </div>
              <div className="bg-card/70 px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Field
                </span>
              </div>
              <div className="bg-card/70 px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Value
                </span>
              </div>
              <div className="bg-card/70 px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  New Value
                </span>
              </div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div
                  key={`${item.documentId}-${item.targetFieldPath}`}
                  className="grid grid-cols-4 gap-px bg-border"
                >
                  <div className="bg-background px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="text-xs text-foreground truncate" title={item.documentTitle}>
                        {item.documentTitle}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      {formatDocType(item.targetDocType)}
                    </span>
                  </div>

                  <div className="bg-background px-3 py-2.5">
                    <span
                      className="text-xs font-mono text-muted-foreground truncate block"
                      title={item.targetFieldPath}
                    >
                      {item.targetFieldPath}
                    </span>
                  </div>

                  <div className="bg-background px-3 py-2.5">
                    <span className="text-xs text-red-700 dark:text-red-300/70 break-all line-clamp-2">
                      {formatValue(item.currentValue)}
                    </span>
                  </div>

                  <div className="bg-background px-3 py-2.5">
                    <div className="flex items-start gap-1">
                      <ArrowRight className="h-3 w-3 shrink-0 text-cyan mt-0.5" />
                      <span className="text-xs text-emerald-700 dark:text-emerald-300 break-all line-clamp-2">
                        {formatValue(item.newValue)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="mt-5 flex items-center justify-end gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="gap-1.5 border-border text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={loading || items.length === 0}
          className={cn(
            'gap-1.5',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Check className="h-3.5 w-3.5" />
          Confirm Cascade
        </Button>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Format a document type slug into a human-readable label.
 */
function formatDocType(docType: string): string {
  return docType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format an unknown value into a display string.
 * Handles null, undefined, objects, and primitives.
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '\u2014'
  if (typeof value === 'string') return value || '\u2014'
  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
