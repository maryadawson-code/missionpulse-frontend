'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Pencil, Check, X } from 'lucide-react'

interface InlineEditFieldProps {
  label: string
  value: string | null | undefined
  fieldName: string
  type?: 'text' | 'number' | 'date' | 'textarea'
  canEdit: boolean
  onSave: (fieldName: string, value: string) => Promise<{ success: boolean; error?: string }>
  format?: (v: string | null | undefined) => string
}

export function InlineEditField({
  label,
  value,
  fieldName,
  type = 'text',
  canEdit,
  onSave,
  format,
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function startEdit() {
    if (!canEdit) return
    setDraft(value ?? '')
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setDraft(value ?? '')
  }

  function save() {
    if (draft === (value ?? '')) {
      setEditing(false)
      return
    }
    startTransition(async () => {
      const result = await onSave(fieldName, draft)
      if (result.success) {
        setEditing(false)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault()
      save()
    }
    if (e.key === 'Escape') {
      cancel()
    }
  }

  const displayValue = format ? format(value) : (value ?? '—')

  const inputClass =
    'w-full rounded border border-[#00E5FA]/50 bg-gray-900 px-2 py-1 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-[#00E5FA]/25'

  if (editing) {
    return (
      <div>
        <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</dt>
        <dd className="mt-1 flex items-center gap-1">
          {type === 'textarea' ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              className={inputClass}
              disabled={isPending}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className={inputClass}
              disabled={isPending}
            />
          )}
          <button onClick={save} disabled={isPending} className="p-1 text-emerald-400 hover:text-emerald-300">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={cancel} disabled={isPending} className="p-1 text-gray-500 hover:text-gray-300">
            <X className="h-3.5 w-3.5" />
          </button>
        </dd>
      </div>
    )
  }

  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</dt>
      <dd className="mt-1 flex items-center gap-1.5 group">
        <span className="text-sm text-gray-200">{displayValue}</span>
        {canEdit && (
          <button
            onClick={startEdit}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-gray-500 hover:text-[#00E5FA]"
            title={`Edit ${label}`}
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </dd>
    </div>
  )
}
