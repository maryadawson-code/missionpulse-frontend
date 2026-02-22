'use client'

import { useState, useTransition } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import { Loader2 } from 'lucide-react'

import { updateSectionStatus } from '@/app/(dashboard)/pipeline/[id]/swimlane/actions'
import { addToast } from '@/components/ui/Toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SectionCard } from './SectionCard'

const SWIMLANE_COLUMNS = [
  { id: 'draft', label: 'Draft' },
  { id: 'pink_review', label: 'Pink Team' },
  { id: 'revision', label: 'Revision' },
  { id: 'green_review', label: 'Green Team' },
  { id: 'red_review', label: 'Red Team' },
  { id: 'final', label: 'Final' },
] as const

// Strict forward-only transitions. Rejection from any review → revision.
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['pink_review'],
  pink_review: ['revision'],           // Pink review → revision (author rework)
  revision: ['green_review'],           // Revision → green review (next color team)
  green_review: ['revision', 'red_review'], // Green pass → red; green fail → revision
  red_review: ['revision', 'final'],    // Red pass → final; red fail → revision
  final: [],
}

const VOLUME_FILTERS = ['All', 'Technical', 'Management', 'Past Performance', 'Cost'] as const

interface ProposalSection {
  id: string
  section_title: string
  volume: string | null
  status: string | null
  due_date: string | null
  writer_id: string | null
  reviewer_id: string | null
  sort_order: number | null
}

interface TeamMember {
  assignee_name: string
  assignee_email: string | null
}

interface SwimlaneBoardProps {
  opportunityId: string
  sections: ProposalSection[]
  teamMembers: TeamMember[]
  canEdit?: boolean
}

export function SwimlaneBoard({
  opportunityId,
  sections,
  teamMembers,
  canEdit = true,
}: SwimlaneBoardProps) {
  const [isPending, startTransition] = useTransition()
  const [volumeFilter, setVolumeFilter] = useState<string>('All')

  const filtered =
    volumeFilter === 'All'
      ? sections
      : sections.filter((s) => s.volume === volumeFilter)

  const columns = SWIMLANE_COLUMNS.map((col) => ({
    id: col.id,
    label: col.label,
    items: filtered.filter((s) => (s.status ?? 'draft') === col.id),
  }))

  function handleDragEnd(result: DropResult) {
    if (!canEdit) return
    const { destination, draggableId } = result
    if (!destination) return

    const newStatus = destination.droppableId
    const section = sections.find((s) => s.id === draggableId)
    const currentStatus = section?.status ?? 'draft'
    if (!section || currentStatus === newStatus) return

    // Client-side transition validation
    const allowed = VALID_TRANSITIONS[currentStatus] ?? []
    if (!allowed.includes(newStatus)) {
      const label = SWIMLANE_COLUMNS.find((c) => c.id === newStatus)?.label ?? newStatus
      addToast('error', `Cannot move directly to ${label}`)
      return
    }

    startTransition(async () => {
      const res = await updateSectionStatus(draggableId, newStatus, opportunityId)
      if (res.success) {
        const label = SWIMLANE_COLUMNS.find((c) => c.id === newStatus)?.label ?? newStatus
        addToast('success', `Moved to ${label}`)
      } else {
        addToast('error', res.error ?? 'Failed to update status')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Volume filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter by volume:</span>
        <Select value={volumeFilter} onValueChange={setVolumeFilter}>
          <SelectTrigger className="h-8 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VOLUME_FILTERS.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Board */}
      <div className="relative">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map(({ id, label, items }) => (
              <div
                key={id}
                className="flex w-[220px] min-w-[220px] flex-col rounded-lg border border-border bg-card"
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {label}
                  </h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {items.length}
                  </span>
                </div>

                <Droppable droppableId={id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-2 p-2 min-h-[120px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-primary/5' : ''
                      }`}
                    >
                      {items.length === 0 && !snapshot.isDraggingOver && (
                        <p className="py-8 text-center text-xs text-muted-foreground">
                          No sections in {label}
                        </p>
                      )}
                      {items.map((section, index) => (
                        <Draggable
                          key={section.id}
                          draggableId={section.id}
                          index={index}
                          isDragDisabled={!canEdit}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={
                                dragSnapshot.isDragging
                                  ? 'opacity-90 shadow-lg'
                                  : ''
                              }
                            >
                              <SectionCard
                                section={section}
                                teamMembers={teamMembers}
                                opportunityId={opportunityId}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}
