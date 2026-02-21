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

const SWIMLANE_COLUMNS = ['Draft', 'Review', 'Revision', 'Final'] as const

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
}

export function SwimlaneBoard({
  opportunityId,
  sections,
  teamMembers,
}: SwimlaneBoardProps) {
  const [isPending, startTransition] = useTransition()
  const [volumeFilter, setVolumeFilter] = useState<string>('All')

  const filtered =
    volumeFilter === 'All'
      ? sections
      : sections.filter((s) => s.volume === volumeFilter)

  const columns = SWIMLANE_COLUMNS.map((status) => ({
    status,
    items: filtered.filter((s) => (s.status ?? 'Draft') === status),
  }))

  function handleDragEnd(result: DropResult) {
    const { destination, draggableId } = result
    if (!destination) return

    const newStatus = destination.droppableId
    const section = sections.find((s) => s.id === draggableId)
    if (!section || (section.status ?? 'Draft') === newStatus) return

    startTransition(async () => {
      const res = await updateSectionStatus(draggableId, newStatus, opportunityId)
      if (res.success) {
        addToast('success', `Moved to ${newStatus}`)
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
            {columns.map(({ status, items }) => (
              <div
                key={status}
                className="flex w-[280px] min-w-[280px] flex-col rounded-lg border border-border bg-card"
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {status}
                  </h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {items.length}
                  </span>
                </div>

                <Droppable droppableId={status}>
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
                          No sections in {status}
                        </p>
                      )}
                      {items.map((section, index) => (
                        <Draggable
                          key={section.id}
                          draggableId={section.id}
                          index={index}
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
