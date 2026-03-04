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

import { updateOpportunityPhase } from '@/lib/actions/opportunities'
import { addToast } from '@/components/ui/Toast'
import { OpportunityCard } from '@/components/features/pipeline/OpportunityCard'
import { SHIPLEY_PHASES } from '@/lib/types/opportunities'
import type { Opportunity } from '@/lib/types'

type KanbanOpportunity = Pick<
  Opportunity,
  'id' | 'title' | 'agency' | 'ceiling' | 'pwin' | 'due_date' | 'phase'
>

interface KanbanViewProps {
  opportunities: KanbanOpportunity[]
  canEdit?: boolean
}

export function KanbanView({ opportunities, canEdit = true }: KanbanViewProps) {
  const [isPending, startTransition] = useTransition()
  const [liveMessage, setLiveMessage] = useState('')

  // Group opportunities by phase
  const columns = SHIPLEY_PHASES.map((phase) => ({
    phase,
    items: opportunities.filter((o) => (o.phase ?? 'Gate 1') === phase),
  }))

  const findOppTitle = useCallback(
    (id: string) => opportunities.find((o) => o.id === id)?.title ?? 'item',
    [opportunities]
  )

  const handleDragStart = useCallback(
    (start: DragStart, provided: ResponderProvided) => {
      const title = findOppTitle(start.draggableId)
      const msg = `Picked up ${title} from ${start.source.droppableId}. Use arrow keys to move.`
      setLiveMessage(msg)
      provided.announce(msg)
    },
    [findOppTitle]
  )

  const handleDragUpdate = useCallback(
    (update: DragUpdate, provided: ResponderProvided) => {
      if (!update.destination) {
        const msg = 'Not over a droppable area.'
        setLiveMessage(msg)
        provided.announce(msg)
        return
      }
      const title = findOppTitle(update.draggableId)
      const msg = `${title} is over ${update.destination.droppableId}, position ${update.destination.index + 1}.`
      setLiveMessage(msg)
      provided.announce(msg)
    },
    [findOppTitle]
  )

  const handleDragEnd = useCallback(
    (result: DropResult, provided: ResponderProvided) => {
      const title = findOppTitle(result.draggableId)
      if (!result.destination) {
        const msg = `${title} dropped. No change.`
        setLiveMessage(msg)
        provided.announce(msg)
        return
      }

      const { destination, draggableId } = result
      const newPhase = destination.droppableId
      const opp = opportunities.find((o) => o.id === draggableId)
      if (!opp || (opp.phase ?? 'Gate 1') === newPhase) {
        const msg = `${title} returned to ${opp?.phase ?? 'Gate 1'}.`
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

      const msg = `Moved ${title} to ${newPhase}.`
      setLiveMessage(msg)
      provided.announce(msg)

      startTransition(async () => {
        const res = await updateOpportunityPhase(draggableId, newPhase)
        if (res.success) {
          addToast('success', `Moved to ${newPhase}`)
        } else {
          addToast('error', res.error ?? 'Failed to update phase')
        }
      })
    },
    [canEdit, opportunities, findOppTitle, startTransition]
  )

  return (
    <div className="relative" role="region" aria-label="Pipeline Kanban Board">
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
        <div className="flex gap-4 overflow-x-auto pb-4" role="list" aria-label="Pipeline phases">
          {columns.map(({ phase, items }) => (
            <div
              key={phase}
              role="listitem"
              aria-label={`${phase} column, ${items.length} ${items.length === 1 ? 'opportunity' : 'opportunities'}`}
              className="flex w-[280px] min-w-[280px] flex-col rounded-lg border border-border bg-card"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {phase}
                </h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground" aria-hidden="true">
                  {items.length}
                </span>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={phase}>
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
                        No opportunities in this phase
                      </p>
                    )}
                    {items.map((opp, index) => (
                      <Draggable
                        key={opp.id}
                        draggableId={opp.id}
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
                            aria-roledescription="draggable opportunity"
                            aria-describedby={`kanban-instructions-${opp.id}`}
                            aria-label={`${opp.title}, ${phase}`}
                            className={
                              dragSnapshot.isDragging
                                ? 'opacity-90 shadow-lg'
                                : ''
                            }
                          >
                            <span id={`kanban-instructions-${opp.id}`} className="sr-only">
                              Press Space or Enter to pick up. Use arrow keys to move between columns. Press Space or Enter to drop. Press Escape to cancel.
                            </span>
                            <OpportunityCard opportunity={opp} />
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
  )
}
