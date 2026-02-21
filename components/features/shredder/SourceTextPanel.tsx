'use client'

import { useCallback, useRef, useState } from 'react'
import { Search } from 'lucide-react'

interface SourceTextPanelProps {
  sourceText: string
  onTextSelect: (_text: string) => void
}

export function SourceTextPanel({
  sourceText,
  onTextSelect,
}: SourceTextPanelProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      onTextSelect(selection.toString().trim())
    }
  }, [onTextSelect])

  // Highlight SHALL/MUST/WILL patterns and search terms
  const highlightedText = useCallback(() => {
    const lines = sourceText.split('\n')

    return lines.map((line, i) => {
      const isRequirementLine = /\b(SHALL|MUST|WILL|REQUIRED|MANDATORY)\b/i.test(line)
      const matchesSearch =
        searchTerm && line.toLowerCase().includes(searchTerm.toLowerCase())

      return (
        <div
          key={i}
          className={`px-3 py-0.5 ${
            matchesSearch
              ? 'bg-primary/20'
              : isRequirementLine
                ? 'bg-amber-500/10 border-l-2 border-amber-500/50'
                : ''
          }`}
        >
          <span className="text-xs text-muted-foreground mr-3 select-none inline-block w-8 text-right">
            {i + 1}
          </span>
          {line || '\u00A0'}
        </div>
      )
    })
  }, [sourceText, searchTerm])

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <h3 className="text-sm font-semibold text-foreground">Source Text</h3>
        <div className="relative ml-auto">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-7 rounded-md border border-border bg-background pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <p className="border-b border-border px-3 py-1.5 text-[10px] text-muted-foreground">
        Lines with SHALL/MUST/WILL are highlighted. Select text to extract a requirement.
      </p>

      <div
        ref={contentRef}
        onMouseUp={handleMouseUp}
        className="max-h-[600px] overflow-y-auto font-mono text-xs leading-relaxed text-foreground"
      >
        {highlightedText()}
      </div>
    </div>
  )
}
