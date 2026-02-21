'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { addToast } from '@/components/ui/Toast'
import { updateRequirement } from '@/app/(dashboard)/pipeline/[id]/shredder/requirements/actions'

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const
const SECTIONS = ['Technical', 'Management', 'Past Performance', 'Cost', 'Other'] as const

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

interface RequirementsListProps {
  requirements: Requirement[]
  teamMembers: TeamMember[]
  opportunityId: string
  selectedIds: Set<string>
  onSelectedIdsChange: (ids: Set<string>) => void
  onDelete: (req: Requirement) => void
  onBulkPriority: (priority: string) => void
  onBulkAssign: (assignee: string) => void
  onBulkSection: (section: string) => void
}

export function RequirementsList({
  requirements,
  teamMembers,
  opportunityId,
  selectedIds,
  onSelectedIdsChange,
  onDelete,
  onBulkPriority,
  onBulkAssign,
  onBulkSection,
}: RequirementsListProps) {
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onSelectedIdsChange(next)
  }

  const toggleAll = () => {
    if (selectedIds.size === requirements.length) {
      onSelectedIdsChange(new Set())
    } else {
      onSelectedIdsChange(new Set(requirements.map((r) => r.id)))
    }
  }

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-sm font-semibold text-foreground">
          Requirements ({requirements.length})
        </h3>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary/5 px-3 py-2">
          <span className="text-xs text-muted-foreground">
            {selectedIds.size} selected:
          </span>
          <Select onValueChange={onBulkPriority}>
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={onBulkSection}>
            <SelectTrigger className="h-7 w-[130px] text-xs">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              {SECTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {teamMembers.length > 0 && (
            <Select onValueChange={onBulkAssign}>
              <SelectTrigger className="h-7 w-[140px] text-xs">
                <SelectValue placeholder="Assign to" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((tm) => (
                  <SelectItem key={tm.assignee_name} value={tm.assignee_name}>
                    {tm.assignee_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <div className="max-h-[600px] overflow-y-auto">
        {requirements.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No requirements extracted yet. Select text from the source document and click
              &quot;Extract Requirement&quot;.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Select all header */}
            <div className="flex items-center gap-2 px-3 py-1.5">
              <input
                type="checkbox"
                checked={selectedIds.size === requirements.length && requirements.length > 0}
                onChange={toggleAll}
                className="h-3.5 w-3.5 rounded border-border"
              />
              <span className="text-[10px] text-muted-foreground">Select all</span>
            </div>

            {requirements.map((req) => (
              <RequirementRow
                key={req.id}
                requirement={req}
                teamMembers={teamMembers}
                opportunityId={opportunityId}
                selected={selectedIds.has(req.id)}
                onToggle={() => toggleSelect(req.id)}
                onDelete={() => onDelete(req)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RequirementRow({
  requirement: req,
  teamMembers,
  opportunityId,
  selected,
  onToggle,
  onDelete,
}: {
  requirement: Requirement
  teamMembers: TeamMember[]
  opportunityId: string
  selected: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const [isPending, startTransition] = useTransition()

  const handleUpdate = (field: string, value: string | null) => {
    startTransition(async () => {
      const result = await updateRequirement(req.id, opportunityId, {
        [field]: value,
      })
      if (result.success) {
        addToast('success', 'Updated')
      } else {
        addToast('error', result.error ?? 'Update failed')
      }
    })
  }

  const priorityColor = (p: string | null) => {
    switch (p) {
      case 'Critical':
        return 'text-red-400'
      case 'High':
        return 'text-amber-400'
      case 'Medium':
        return 'text-blue-400'
      case 'Low':
        return 'text-muted-foreground'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className={`px-3 py-2.5 ${selected ? 'bg-primary/5' : ''}`}>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-0.5 h-3.5 w-3.5 rounded border-border"
        />

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-primary">
              {req.reference}
            </span>
            <StatusBadge status={req.status} />
            <span className={`text-[10px] font-medium ${priorityColor(req.priority)}`}>
              {req.priority ?? 'Medium'}
            </span>
          </div>

          <p className="text-xs text-foreground leading-relaxed">
            {req.requirement}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={req.priority ?? 'Medium'}
              onValueChange={(v) => handleUpdate('priority', v)}
              disabled={isPending}
            >
              <SelectTrigger className="h-6 w-[90px] text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={req.section ?? ''}
              onValueChange={(v) => handleUpdate('section', v)}
              disabled={isPending}
            >
              <SelectTrigger className="h-6 w-[110px] text-[10px]">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {teamMembers.length > 0 && (
              <Select
                value={req.assigned_to ?? ''}
                onValueChange={(v) => handleUpdate('assigned_to', v)}
                disabled={isPending}
              >
                <SelectTrigger className="h-6 w-[120px] text-[10px]">
                  <SelectValue placeholder="Reviewer" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((tm) => (
                    <SelectItem key={tm.assignee_name} value={tm.assignee_name}>
                      {tm.assignee_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
