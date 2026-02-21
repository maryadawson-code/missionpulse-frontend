'use client'

import { useState, useCallback, useTransition } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import {
  createRequirement,
  deleteRequirement,
  bulkUpdateRequirements,
} from '@/app/(dashboard)/pipeline/[id]/shredder/requirements/actions'
import { SourceTextPanel } from './SourceTextPanel'
import { RequirementsList } from './RequirementsList'

interface Requirement {
  id: string
  reference: string
  requirement: string
  section: string | null
  priority: string | null
  status: string | null
  assigned_to: string | null
  page_reference: string | null
  volume_reference: string | null
  notes: string | null
}

interface TeamMember {
  assignee_name: string
  assignee_email: string | null
}

interface RequirementsExtractorProps {
  opportunityId: string
  documentId: string
  sourceText: string
  existingRequirements: Requirement[]
  teamMembers: TeamMember[]
}

export function RequirementsExtractor({
  opportunityId,
  documentId,
  sourceText,
  existingRequirements,
  teamMembers,
}: RequirementsExtractorProps) {
  const [selectedText, setSelectedText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<Requirement | null>(null)

  const handleTextSelect = useCallback((text: string) => {
    setSelectedText(text)
  }, [])

  const handleExtract = useCallback(() => {
    if (!selectedText.trim()) {
      addToast('error', 'Select text from the source document first')
      return
    }

    // Auto-generate reference number
    const nextNum = existingRequirements.length + 1
    const reference = `REQ-${String(nextNum).padStart(3, '0')}`

    startTransition(async () => {
      const result = await createRequirement(opportunityId, {
        reference,
        requirement: selectedText.trim(),
      })
      if (result.success) {
        addToast('success', `Requirement ${reference} extracted`)
        setSelectedText('')
      } else {
        addToast('error', result.error ?? 'Failed to create requirement')
      }
    })
  }, [selectedText, opportunityId, existingRequirements.length, startTransition])

  const handleBulkPriority = useCallback(
    (priority: string) => {
      if (selectedIds.size === 0) return
      startTransition(async () => {
        const result = await bulkUpdateRequirements(
          Array.from(selectedIds),
          opportunityId,
          { priority }
        )
        if (result.success) {
          addToast('success', `Updated ${selectedIds.size} requirement(s)`)
          setSelectedIds(new Set())
        } else {
          addToast('error', result.error ?? 'Bulk update failed')
        }
      })
    },
    [selectedIds, opportunityId, startTransition]
  )

  const handleBulkAssign = useCallback(
    (assignee: string) => {
      if (selectedIds.size === 0) return
      startTransition(async () => {
        const result = await bulkUpdateRequirements(
          Array.from(selectedIds),
          opportunityId,
          { assigned_to: assignee }
        )
        if (result.success) {
          addToast('success', `Assigned ${selectedIds.size} requirement(s)`)
          setSelectedIds(new Set())
        } else {
          addToast('error', result.error ?? 'Bulk assign failed')
        }
      })
    },
    [selectedIds, opportunityId, startTransition]
  )

  const handleBulkSection = useCallback(
    (section: string) => {
      if (selectedIds.size === 0) return
      startTransition(async () => {
        const result = await bulkUpdateRequirements(
          Array.from(selectedIds),
          opportunityId,
          { section }
        )
        if (result.success) {
          addToast('success', `Updated section for ${selectedIds.size} requirement(s)`)
          setSelectedIds(new Set())
        } else {
          addToast('error', result.error ?? 'Bulk update failed')
        }
      })
    },
    [selectedIds, opportunityId, startTransition]
  )

  return (
    <div className="relative">
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Extract bar */}
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {selectedText
            ? `Selected: "${selectedText.slice(0, 80)}${selectedText.length > 80 ? '...' : ''}"`
            : 'Highlight text in the source panel to extract a requirement'}
        </span>
        <Button
          size="sm"
          onClick={handleExtract}
          disabled={!selectedText.trim() || isPending}
          className="ml-auto"
        >
          <Plus className="h-4 w-4" />
          Extract Requirement
        </Button>
      </div>

      {/* Split pane */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: Source text */}
        <SourceTextPanel
          sourceText={sourceText}
          onTextSelect={handleTextSelect}
        />

        {/* Right: Requirements list */}
        <RequirementsList
          requirements={existingRequirements}
          teamMembers={teamMembers}
          opportunityId={opportunityId}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          onDelete={setDeleteTarget}
          onBulkPriority={handleBulkPriority}
          onBulkAssign={handleBulkAssign}
          onBulkSection={handleBulkSection}
        />
      </div>

      {deleteTarget && (
        <ConfirmModal
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null)
          }}
          title="Delete Requirement"
          description={`Delete requirement ${deleteTarget.reference}? This cannot be undone.`}
          confirmLabel="Delete"
          destructive
          onConfirm={() => deleteRequirement(deleteTarget.id, opportunityId)}
          successMessage="Requirement deleted."
          onSuccess={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
