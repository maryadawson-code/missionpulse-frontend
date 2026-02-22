'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import { createDebrief } from '@/lib/actions/debriefs'
import { useRouter } from 'next/navigation'

const OUTCOMES = ['Won', 'Lost', 'No Bid', 'Protest', 'Withdrawn']
const DEBRIEF_TYPES = ['formal', 'informal', 'self_assessment', 'agency_debrief']

export function CreateDebriefForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [form, setForm] = useState({
    opportunity_name: '',
    debrief_type: 'formal',
    debrief_date: new Date().toISOString().split('T')[0],
    outcome: 'Won',
    contract_value: '',
    notes: '',
    strengths: [''],
    weaknesses: [''],
    lessons_learned: [''],
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateListItem(field: 'strengths' | 'weaknesses' | 'lessons_learned', index: number, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }))
  }

  function addListItem(field: 'strengths' | 'weaknesses' | 'lessons_learned') {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], ''] }))
  }

  function handleSubmit() {
    if (!form.opportunity_name.trim()) return
    startTransition(async () => {
      const result = await createDebrief({
        opportunity_id: '',
        opportunity_name: form.opportunity_name.trim(),
        debrief_type: form.debrief_type,
        debrief_date: form.debrief_date,
        outcome: form.outcome,
        contract_value: form.contract_value ? parseFloat(form.contract_value) : null,
        notes: form.notes.trim(),
        strengths: form.strengths.filter((s) => s.trim()),
        weaknesses: form.weaknesses.filter((w) => w.trim()),
        lessons_learned: form.lessons_learned.filter((l) => l.trim()),
      })
      if (result.success) {
        addToast('success', 'Debrief created')
        setIsOpen(false)
        router.refresh()
      } else {
        addToast('error', result.error ?? 'Failed to create')
      }
    })
  }

  if (!isOpen) {
    return (
      <Button size="sm" onClick={() => setIsOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        New Debrief
      </Button>
    )
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Create Debrief</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-gray-500">Opportunity Name *</label>
          <input
            type="text"
            value={form.opportunity_name}
            onChange={(e) => updateField('opportunity_name', e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Outcome</label>
          <select
            value={form.outcome}
            onChange={(e) => updateField('outcome', e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {OUTCOMES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Debrief Type</label>
          <select
            value={form.debrief_type}
            onChange={(e) => updateField('debrief_type', e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {DEBRIEF_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Date</label>
          <input
            type="date"
            value={form.debrief_date}
            onChange={(e) => updateField('debrief_date', e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Contract Value</label>
          <input
            type="number"
            value={form.contract_value}
            onChange={(e) => updateField('contract_value', e.target.value)}
            placeholder="$0"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Strengths, Weaknesses, Lessons */}
      {(['strengths', 'weaknesses', 'lessons_learned'] as const).map((field) => (
        <div key={field}>
          <label className="text-xs text-gray-500 capitalize">{field.replace(/_/g, ' ')}</label>
          <div className="mt-1 space-y-1">
            {form[field].map((item, i) => (
              <input
                key={i}
                type="text"
                value={item}
                onChange={(e) => updateListItem(field, i, e.target.value)}
                placeholder={`Add ${field.replace(/_/g, ' ')}...`}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ))}
            <button
              onClick={() => addListItem(field)}
              className="text-xs text-primary hover:underline"
            >
              + Add
            </button>
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          Create Debrief
        </Button>
      </div>
    </div>
  )
}
