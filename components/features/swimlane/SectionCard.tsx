'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface ProposalSection {
  id: string
  section_title: string
  volume: string | null
  due_date: string | null
  writer_id: string | null
  reviewer_id?: string | null
}

interface TeamMember {
  assignee_name: string
  assignee_email: string | null
}

interface SectionCardProps {
  section: ProposalSection
  teamMembers: TeamMember[]
  opportunityId: string
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function volumeColor(volume: string | null): string {
  switch (volume) {
    case 'Technical':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
    case 'Management':
      return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
    case 'Past Performance':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
    case 'Cost':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export const SectionCard = memo(function SectionCard({ section, teamMembers, opportunityId }: SectionCardProps) {
  const owner = teamMembers.find(
    (m) => m.assignee_email === section.writer_id || m.assignee_name === section.writer_id
  )
  const reviewer = section.reviewer_id
    ? teamMembers.find(
        (m) => m.assignee_email === section.reviewer_id || m.assignee_name === section.reviewer_id
      )
    : null

  return (
    <Link
      href={`/pipeline/${opportunityId}/sections/${section.id}`}
      className="block rounded-lg border border-border bg-background p-3 space-y-2 hover:border-primary/40 hover:bg-accent/5 transition-colors"
    >
      <p className="text-sm font-medium text-foreground truncate">
        {section.section_title}
      </p>

      <div className="flex items-center gap-2">
        {section.volume && (
          <Badge variant="outline" className={volumeColor(section.volume)}>
            {section.volume}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 truncate">
          {owner ? (
            <span className="truncate" title="Writer">{owner.assignee_name}</span>
          ) : (
            <span className="italic">Unassigned</span>
          )}
          {reviewer && (
            <span className="text-[10px] text-muted-foreground/60 truncate" title="Reviewer">
              / {reviewer.assignee_name}
            </span>
          )}
        </div>
        {section.due_date && <span>{formatDate(section.due_date)}</span>}
      </div>
    </Link>
  )
})
