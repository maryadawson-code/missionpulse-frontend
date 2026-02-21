'use client'

import { ExternalLink } from 'lucide-react'

interface CitationLinkProps {
  citation: string
  index: number
}

export function CitationLink({ citation, index }: CitationLinkProps) {
  const isUrl = citation.startsWith('http')

  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
      <span className="text-muted-foreground">[{index + 1}]</span>
      {isUrl ? (
        <a href={citation} target="_blank" rel="noopener noreferrer">
          {citation.length > 60 ? `${citation.slice(0, 60)}...` : citation}
          <ExternalLink className="ml-0.5 inline h-2.5 w-2.5" />
        </a>
      ) : (
        <span className="text-muted-foreground">{citation}</span>
      )}
    </span>
  )
}
