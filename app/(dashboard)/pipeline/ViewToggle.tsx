'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ViewToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') ?? 'table'

  function setView(view: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (view === 'table') {
      params.delete('view')
    } else {
      params.set('view', view)
    }
    const query = params.toString()
    router.push(`/pipeline${query ? `?${query}` : ''}`)
  }

  return (
    <div className="flex rounded-md border border-border">
      <button
        onClick={() => setView('table')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors',
          currentView === 'table'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <List className="h-4 w-4" />
        Table
      </button>
      <button
        onClick={() => setView('kanban')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors',
          currentView === 'kanban'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        Kanban
      </button>
    </div>
  )
}
