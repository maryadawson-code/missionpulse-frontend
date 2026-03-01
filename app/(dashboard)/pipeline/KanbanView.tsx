'use client'

import { useCallback, useTransition } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
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

  // Group opportunities by phase
  const columns = SHIPLEY_PHASES.map((phase) => ({
    phase,
    items: opportunities.filter((o) => (o.phase ?? 'Gate 1') === phase),
  }))

  const handleDragEnd = useCallback(function handleDragEnd(result: DropResult) {
    if (!canEdit) return
    const { destination, draggableId } = result
    if (!destination) return

    const newPhase = destination.droppableId
    const opp = opportunities.find((o) => o.id === draggableId)
    if (!opp || (opp.phase ?? 'Gate 1') === newPhase) return

    startTransition(async () => {
      const res = await updateOpportunityPhase(draggableId, newPhase)
      if (res.success) {
        addToast('success', `Moved to ${newPhase}`)
      } else {
        addToast('error', res.error ?? 'Failed to update phase')
      }
    })
  }, [canEdit, opportunities, startTransition])

  return (
    <div className="relative">
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(({ phase, items }) => (
            <div
              key={phase}
              className="flex w-[280px] min-w-[280px] flex-col rounded-lg border border-border bg-card"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {phase}
                </h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
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
