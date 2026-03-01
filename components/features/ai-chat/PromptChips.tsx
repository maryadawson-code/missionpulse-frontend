'use client'

import { AGENT_COLORS } from '@/lib/ai/intent-patterns'

interface PromptChipsProps {
  prompts: { label: string; prompt: string; agent: string }[]
  onSelect: (_prompt: string) => void
  disabled?: boolean
}

export function PromptChips({ prompts, onSelect, disabled }: PromptChipsProps) {
  if (prompts.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {prompts.map((p) => (
        <button
          key={p.label}
          onClick={() => onSelect(p.prompt)}
          disabled={disabled}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <span
            className={`h-2 w-2 rounded-full ${AGENT_COLORS[p.agent] ?? 'bg-gray-400'}`}
          />
          {p.label}
        </button>
      ))}
    </div>
  )
}
