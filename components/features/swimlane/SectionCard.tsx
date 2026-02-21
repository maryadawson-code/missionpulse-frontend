'use client'

import { Badge } from '@/components/ui/badge'

interface ProposalSection {
  id: string
  section_title: string
  volume: string | null
  due_date: string | null
  writer_id: string | null
}

interface TeamMember {
  assignee_name: string
  assignee_email: string | null
}

interface SectionCardProps {
  section: ProposalSection
  teamMembers: TeamMember[]
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
      return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
    case 'Management':
      return 'bg-purple-500/15 text-purple-300 border-purple-500/30'
    case 'Past Performance':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    case 'Cost':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function SectionCard({ section, teamMembers }: SectionCardProps) {
  const owner = teamMembers.find(
    (m) => m.assignee_email === section.writer_id || m.assignee_name === section.writer_id
  )

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-2">
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
        {owner ? (
          <span className="truncate">{owner.assignee_name}</span>
        ) : (
          <span className="italic">Unassigned</span>
        )}
        {section.due_date && <span>{formatDate(section.due_date)}</span>}
      </div>
    </div>
  )
}
