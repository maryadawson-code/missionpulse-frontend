// FILE: components/modules/OpportunityForm.tsx
// SPRINT: 2 — Create / Edit Opportunity Form
// SECURITY: NIST 800-53 Rev 5 CHECKED

'use client'

import { useState, useTransition, useCallback } from 'react'
import {
  createOpportunity,
  updateOpportunity,
  type OpportunityInput,
  type Opportunity,
} from '@/lib/actions/opportunities'
import {
  SHIPLEY_PHASES,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
} from '@/lib/utils/formatting'

interface OpportunityFormProps {
  opportunity?: Opportunity | null
  onClose: () => void
  onSuccess?: () => void
}

export function OpportunityForm({
  opportunity,
  onClose,
  onSuccess,
}: OpportunityFormProps) {
  const isEdit = !!opportunity
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const cp = (opportunity?.custom_properties ?? {}) as Record<string, string>

  const [form, setForm] = useState<OpportunityInput>({
    title: opportunity?.title ?? '',
    nickname: cp.nickname ?? '',
    description: opportunity?.description ?? '',
    agency: opportunity?.agency ?? '',
    sub_agency: opportunity?.sub_agency ?? '',
    contract_vehicle: opportunity?.contract_vehicle ?? '',
    set_aside: opportunity?.set_aside ?? '',
    ceiling: opportunity?.ceiling ?? null,
    due_date: opportunity?.due_date?.slice(0, 10) ?? '',
    phase: opportunity?.phase ?? 'Gate 1',
    status: opportunity?.status ?? 'Active',
    priority: opportunity?.priority ?? 'Medium',
    pwin: opportunity?.pwin ?? 50,
    go_no_go: cp.go_no_go ?? '',
    incumbent: opportunity?.incumbent ?? '',
    solicitation_number: opportunity?.solicitation_number ?? '',
    sam_url: cp.sam_url ?? '',
    notes: opportunity?.notes ?? '',
    contact_name: opportunity?.contact_name ?? '',
    contact_email: opportunity?.contact_email ?? '',
    place_of_performance: cp.place_of_performance ?? '',
    is_recompete: opportunity?.is_recompete ?? false,
    bd_investment: opportunity?.bd_investment ?? null,
    pop_start: opportunity?.pop_start?.slice(0, 10) ?? '',
    pop_end: opportunity?.pop_end?.slice(0, 10) ?? '',
  })

  const handleChange = useCallback(
    (field: keyof OpportunityInput, value: string | number | boolean | null) => {
      setForm((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleSubmit = () => {
    setError(null)
    if (!form.title?.trim()) {
      setError('Title is required')
      return
    }
    startTransition(async () => {
      const payload: OpportunityInput = {
        ...form,
        title: form.title.trim(),
        ceiling: form.ceiling ? Number(form.ceiling) : null,
        pwin: form.pwin != null ? Number(form.pwin) : 50,
        bd_investment: form.bd_investment ? Number(form.bd_investment) : null,
        due_date: form.due_date || null,
        pop_start: form.pop_start || null,
        pop_end: form.pop_end || null,
      }
      const result = isEdit
        ? await updateOpportunity(opportunity!.id, payload)
        : await createOpportunity(payload)
      if (result.error) {
        setError(result.error)
        return
      }
      onSuccess?.()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#0F172A] border border-[#1E293B] rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? 'Edit Opportunity' : 'New Opportunity'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-8rem)] space-y-5">
          {error && (
            <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Field label="Title *" tooltip="Primary display name">
                <input type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="e.g., DHA MHS GENESIS Cloud Migration" className="form-input" />
              </Field>
            </div>
            <Field label="Nickname" tooltip="Short name for quick reference">
              <input type="text" value={form.nickname ?? ''} onChange={(e) => handleChange('nickname', e.target.value)} placeholder="e.g., GENESIS" className="form-input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Agency">
              <input type="text" value={form.agency ?? ''} onChange={(e) => handleChange('agency', e.target.value)} placeholder="e.g., DHA, VA, CMS" className="form-input" />
            </Field>
            <Field label="Sub-Agency">
              <input type="text" value={form.sub_agency ?? ''} onChange={(e) => handleChange('sub_agency', e.target.value)} className="form-input" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Shipley Phase" tooltip="Current Shipley gate (1-6)">
              <select value={form.phase ?? 'Gate 1'} onChange={(e) => handleChange('phase', e.target.value)} className="form-input">
                {SHIPLEY_PHASES.map((p) => (<option key={p.value} value={p.value}>{p.short} — {p.label}</option>))}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status ?? 'Active'} onChange={(e) => handleChange('status', e.target.value)} className="form-input">
                {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority ?? 'Medium'} onChange={(e) => handleChange('priority', e.target.value)} className="form-input">
                {PRIORITY_OPTIONS.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Win Probability" tooltip="0-100% chance of winning">
              <div className="flex items-center gap-2">
                <input type="range" min={0} max={100} value={form.pwin ?? 50} onChange={(e) => handleChange('pwin', Number(e.target.value))} className="flex-1 accent-cyan-500" />
                <span className="text-sm font-mono text-cyan-400 w-10 text-right">{form.pwin ?? 50}%</span>
              </div>
            </Field>
            <Field label="Contract Value" tooltip="Maximum contract ceiling ($)">
              <input type="number" value={form.ceiling ?? ''} onChange={(e) => handleChange('ceiling', e.target.value ? Number(e.target.value) : null)} placeholder="0" className="form-input" />
            </Field>
            <Field label="B&P Investment" tooltip="Business development spend ($)">
              <input type="number" value={form.bd_investment ?? ''} onChange={(e) => handleChange('bd_investment', e.target.value ? Number(e.target.value) : null)} placeholder="0" className="form-input" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Proposal Due">
              <input type="date" value={form.due_date ?? ''} onChange={(e) => handleChange('due_date', e.target.value)} className="form-input" />
            </Field>
            <Field label="Performance Start">
              <input type="date" value={form.pop_start ?? ''} onChange={(e) => handleChange('pop_start', e.target.value)} className="form-input" />
            </Field>
            <Field label="Performance End">
              <input type="date" value={form.pop_end ?? ''} onChange={(e) => handleChange('pop_end', e.target.value)} className="form-input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Contract Vehicle">
              <input type="text" value={form.contract_vehicle ?? ''} onChange={(e) => handleChange('contract_vehicle', e.target.value)} placeholder="IDIQ, BPA, GSA..." className="form-input" />
            </Field>
            <Field label="Set-Aside" tooltip="Small business designation">
              <input type="text" value={form.set_aside ?? ''} onChange={(e) => handleChange('set_aside', e.target.value)} placeholder="SDVOSB, 8(a)..." className="form-input" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Solicitation #">
              <input type="text" value={form.solicitation_number ?? ''} onChange={(e) => handleChange('solicitation_number', e.target.value)} className="form-input" />
            </Field>
            <Field label="Incumbent">
              <input type="text" value={form.incumbent ?? ''} onChange={(e) => handleChange('incumbent', e.target.value)} className="form-input" />
            </Field>
            <Field label="Go/No-Go">
              <select value={form.go_no_go ?? ''} onChange={(e) => handleChange('go_no_go', e.target.value)} className="form-input">
                <option value="">Not decided</option>
                <option value="Go">Go</option>
                <option value="No-Go">No-Go</option>
                <option value="Conditional">Conditional Go</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Primary Contact">
              <input type="text" value={form.contact_name ?? ''} onChange={(e) => handleChange('contact_name', e.target.value)} className="form-input" />
            </Field>
            <Field label="Contact Email">
              <input type="email" value={form.contact_email ?? ''} onChange={(e) => handleChange('contact_email', e.target.value)} className="form-input" />
            </Field>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_recompete ?? false} onChange={(e) => handleChange('is_recompete', e.target.checked)} className="w-4 h-4 rounded border-[#1E293B] bg-[#00050F] accent-cyan-500" />
              <span className="text-sm text-slate-300">Recompete</span>
            </label>
          </div>

          <Field label="Description">
            <textarea rows={3} value={form.description ?? ''} onChange={(e) => handleChange('description', e.target.value)} className="form-input resize-none" />
          </Field>

          <Field label="Notes">
            <textarea rows={2} value={form.notes ?? ''} onChange={(e) => handleChange('notes', e.target.value)} className="form-input resize-none" placeholder="Internal capture notes..." />
          </Field>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1E293B] bg-[#00050F]/50">
          <p className="text-[10px] text-slate-600">AI GENERATED — REQUIRES HUMAN REVIEW</p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} disabled={isPending} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={isPending} className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-[#00050F] font-semibold text-sm rounded-lg transition-colors">
              {isPending ? 'Saving...' : isEdit ? 'Update Opportunity' : 'Create Opportunity'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, tooltip, children }: { label: string; tooltip?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5" title={tooltip}>{label}</label>
      {children}
    </div>
  )
}
