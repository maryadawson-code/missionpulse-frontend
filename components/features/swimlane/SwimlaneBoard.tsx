'use client'

import { useCallback, useState, useTransition } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DragStart,
  type DragUpdate,
  type ResponderProvided,
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
  const [liveMessage, setLiveMessage] = useState('')

  const filtered =
    volumeFilter === 'All'
      ? sections
      : sections.filter((s) => s.volume === volumeFilter)

  const columns = SWIMLANE_COLUMNS.map((col) => ({
    id: col.id,
    label: col.label,
    items: filtered.filter((s) => (s.status ?? 'draft') === col.id),
  }))

  const findSectionTitle = useCallback(
    (id: string) => sections.find((s) => s.id === id)?.section_title ?? 'section',
    [sections]
  )

  const getColumnLabel = useCallback(
    (colId: string) => SWIMLANE_COLUMNS.find((c) => c.id === colId)?.label ?? colId,
    []
  )

  const handleDragStart = useCallback(
    (start: DragStart, provided: ResponderProvided) => {
      const title = findSectionTitle(start.draggableId)
      const label = getColumnLabel(start.source.droppableId)
      const msg = `Picked up ${title} from ${label}. Use arrow keys to move.`
      setLiveMessage(msg)
      provided.announce(msg)
    },
    [findSectionTitle, getColumnLabel]
  )

  const handleDragUpdate = useCallback(
    (update: DragUpdate, provided: ResponderProvided) => {
      if (!update.destination) {
        const msg = 'Not over a droppable area.'
        setLiveMessage(msg)
        provided.announce(msg)
        return
      }
      const title = findSectionTitle(update.draggableId)
      const label = getColumnLabel(update.destination.droppableId)
      const msg = `${title} is over ${label}, position ${update.destination.index + 1}.`
      setLiveMessage(msg)
      provided.announce(msg)
    },
    [findSectionTitle, getColumnLabel]
  )

  const handleDragEnd = useCallback(
    (result: DropResult, provided: ResponderProvided) => {
      const title = findSectionTitle(result.draggableId)

      if (!result.destination) {
        const msg = `${title} dropped. No change.`
        setLiveMessage(msg)
        provided.announce(msg)
        return
      }

      if (!canEdit) {
        const msg = `Cannot move ${title}. You do not have edit permissions.`
        setLiveMessage(msg)
        provided.announce(msg)
        return
      }

      const { destination, draggableId } = result
      const newStatus = destination.droppableId
      const section = sections.find((s) => s.id === draggableId)
      const currentStatus = section?.status ?? 'draft'

      if (!section || currentStatus === newStatus) {
        const currentLabel = getColumnLabel(currentStatus)
        const msg = `${title} returned to ${currentLabel}.`
        setLiveMessage(msg)
        provided.announce(msg)
        return
      }

      // Client-side transition validation
      const allowed = VALID_TRANSITIONS[currentStatus] ?? []
      if (!allowed.includes(newStatus)) {
        const targetLabel = getColumnLabel(newStatus)
        const currentLabel = getColumnLabel(currentStatus)
        const msg = `Cannot move ${title} from ${currentLabel} to ${targetLabel}. Invalid transition.`
        setLiveMessage(msg)
        provided.announce(msg)
        addToast('error', `Cannot move directly to ${targetLabel}`)
        return
      }

      const targetLabel = getColumnLabel(newStatus)
      const msg = `Moved ${title} to ${targetLabel}.`
      setLiveMessage(msg)
      provided.announce(msg)

      startTransition(async () => {
        const res = await updateSectionStatus(draggableId, newStatus, opportunityId)
        if (res.success) {
          addToast('success', `Moved to ${targetLabel}`)
        } else {
          addToast('error', res.error ?? 'Failed to update status')
        }
      })
    },
    [canEdit, sections, opportunityId, findSectionTitle, getColumnLabel, startTransition]
  )

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
      <div className="relative" role="region" aria-label="Section Swimlane Board">
        {/* Live region for screen reader announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {liveMessage}
        </div>

        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Saving changes" />
          </div>
        )}

        <DragDropContext
          onDragStart={handleDragStart}
          onDragUpdate={handleDragUpdate}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4" role="list" aria-label="Review stages">
            {columns.map(({ id, label, items }) => (
              <div
                key={id}
                role="listitem"
                aria-label={`${label} column, ${items.length} ${items.length === 1 ? 'section' : 'sections'}`}
                className="flex w-[220px] min-w-[220px] flex-col rounded-lg border border-border bg-card"
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {label}
                  </h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground" aria-hidden="true">
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
                              role="button"
                              tabIndex={0}
                              aria-roledescription="draggable section"
                              aria-describedby={`swimlane-instructions-${section.id}`}
                              aria-label={`${section.section_title}, ${label}`}
                              className={
                                dragSnapshot.isDragging
                                  ? 'opacity-90 shadow-lg'
                                  : ''
                              }
                            >
                              <span id={`swimlane-instructions-${section.id}`} className="sr-only">
                                Press Space or Enter to pick up. Use arrow keys to move between columns. Press Space or Enter to drop. Press Escape to cancel.
                              </span>
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
