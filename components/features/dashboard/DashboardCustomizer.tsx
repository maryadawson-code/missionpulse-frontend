'use client'

import { useState, useTransition } from 'react'
import { Settings, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import { saveWidgetVisibility } from '@/lib/actions/dashboard-widgets'

interface WidgetConfig {
  widget_type: string
  title: string
  is_visible: boolean
}

interface DashboardCustomizerProps {
  widgets: WidgetConfig[]
}

export function DashboardCustomizer({
  widgets: initialWidgets,
}: DashboardCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [widgets, setWidgets] = useState(initialWidgets)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggle(type: string) {
    setWidgets((prev) =>
      prev.map((w) =>
        w.widget_type === type ? { ...w, is_visible: !w.is_visible } : w
      )
    )
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveWidgetVisibility(
        widgets.map((w) => ({
          widget_type: w.widget_type,
          is_visible: w.is_visible,
        }))
      )
      if (result.success) {
        addToast('success', 'Dashboard layout saved')
        setIsOpen(false)
        router.refresh()
      } else {
        addToast('error', result.error ?? 'Failed to save')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
      >
        <Settings className="h-3.5 w-3.5" />
        Customize
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Customize Dashboard
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 text-xs text-muted-foreground">
              Toggle which sections appear on your dashboard.
            </p>

            <div className="space-y-2">
              {widgets.map((w) => (
                <div
                  key={w.widget_type}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50"
                >
                  <span className="text-sm text-foreground">{w.title}</span>
                  <button
                    onClick={() => toggle(w.widget_type)}
                    className={`h-5 w-9 rounded-full transition-colors ${
                      w.is_visible ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${
                        w.is_visible ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isPending}>
                {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
