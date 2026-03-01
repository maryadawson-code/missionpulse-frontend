// filepath: components/modules/OpportunityForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createOpportunity, updateOpportunity } from '@/lib/actions/opportunities'
import { addToast } from '@/components/ui/Toast'
import {
  SHIPLEY_PHASES,
  OPPORTUNITY_STATUSES,
  PRIORITIES,
  SET_ASIDES,
} from '@/lib/types/opportunities'
import type { Opportunity } from '@/lib/types/opportunities'

interface OpportunityFormProps {
  opportunity?: Opportunity | null
  mode: 'create' | 'edit'
}

interface FieldErrors {
  [key: string]: string
}

export function OpportunityForm({ opportunity, mode }: OpportunityFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<FieldErrors>({})

  function validateClient(formData: FormData): FieldErrors {
    const errs: FieldErrors = {}
    const title = formData.get('title')
    if (!title || String(title).trim().length === 0) {
      errs.title = 'Title is required'
    }

    const ceiling = formData.get('ceiling')
    if (ceiling && String(ceiling).trim()) {
      const parsed = Number(String(ceiling).replace(/[,$]/g, ''))
      if (isNaN(parsed) || parsed < 0) {
        errs.ceiling = 'Must be a valid dollar amount'
      }
    }

    const pwin = formData.get('pwin')
    if (pwin) {
      const parsed = Number(pwin)
      if (isNaN(parsed) || parsed < 0 || parsed > 100) {
        errs.pwin = 'Must be 0–100'
      }
    }

    const email = formData.get('contact_email')
    if (email && String(email).trim()) {
      const emailStr = String(email).trim()
      if (!emailStr.includes('@') || !emailStr.includes('.')) {
        errs.contact_email = 'Invalid email format'
      }
    }

    return errs
  }

  function handleSubmit(formData: FormData) {
    const clientErrors = validateClient(formData)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }
    setErrors({})

    startTransition(async () => {
      const result =
        mode === 'edit' && opportunity
          ? await updateOpportunity(opportunity.id, formData)
          : await createOpportunity(formData)

      if (result.success) {
        addToast(
          'success',
          mode === 'edit'
            ? 'Opportunity updated'
            : 'Opportunity created'
        )
        router.push('/pipeline')
      } else {
        addToast('error', result.error ?? 'Something went wrong')
      }
    })
  }

  const inputClass =
    'w-full rounded-md border border-border bg-navy px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan disabled:opacity-50'
  const selectClass =
    'w-full rounded-md border border-border bg-navy px-3 py-2 text-sm text-foreground focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan disabled:opacity-50'
  const labelClass = 'block text-sm font-medium text-slate mb-1'
  const errorClass = 'text-xs text-red-400 mt-1'

  return (
    <form action={handleSubmit} className="space-y-8 max-w-3xl">
      {/* Section: Core Information */}
      <fieldset className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <legend className="text-sm font-semibold text-foreground px-2">
          Core Information
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className={labelClass}>
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={opportunity?.title ?? ''}
              placeholder="e.g., DHA EHR Modernization Support"
              className={inputClass}
              disabled={isPending}
            />
            {errors.title && <p className={errorClass}>{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="nickname" className={labelClass}>
              Nickname
            </label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              defaultValue={opportunity?.nickname ?? ''}
              placeholder="Short internal name"
              className={inputClass}
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="solicitation_number" className={labelClass}>
              Solicitation Number
            </label>
            <input
              id="solicitation_number"
              name="solicitation_number"
              type="text"
              defaultValue={opportunity?.solicitation_number ?? ''}
              placeholder="W81XWH-24-R-0001"
              className={inputClass}
              disabled={isPending}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className={labelClass}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={opportunity?.description ?? ''}
              placeholder="Brief description of the opportunity..."
              className={inputClass}
              disabled={isPending}
            />
          </div>
        </div>
      </fieldset>

      {/* Section: Agency & Contract */}
      <fieldset className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <legend className="text-sm font-semibold text-foreground px-2">
          Agency &amp; Contract
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="agency" className={labelClass}>
              Agency
            </label>
            <input
              id="agency"
              name="agency"
              type="text"
              defaultValue={opportunity?.agency ?? ''}
              placeholder="DHA, VA, CMS, IHS..."
              className={inputClass}
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="sub_agency" className={labelClass}>
              Sub-Agency
            </label>
            <input
              id="sub_agency"
              name="sub_agency"
              type="text"
              defaultValue={opportunity?.sub_agency ?? ''}
              className={inputClass}
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="ceiling" className={labelClass}>
              Contract Value ($)
            </label>
            <input
              id="ceiling"
              name="ceiling"
              type="text"
              defaultValue={
                opportunity?.ceiling
                  ? String(opportunity.ceiling)
                  : ''
              }
              placeholder="5000000"
              className={inputClass}
              disabled={isPending}
            />
            {errors.ceiling && <p className={errorClass}>{errors.ceiling}</p>}
          </div>

          <div>
            <label htmlFor="contract_vehicle" className={labelClass}>
              Contract Vehicle
            </label>
            <input
              id="contract_vehicle"
              name="contract_vehicle"
              type="text"
              defaultValue={opportunity?.contract_vehicle ?? ''}
              placeholder="IDIQ, BPA, FFP..."
              className={inputClass}
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="set_aside" className={labelClass}>
              Set-Aside
            </label>
            <select
              id="set_aside"
              name="set_aside"
              defaultValue={opportunity?.set_aside ?? ''}
              className={selectClass}
              disabled={isPending}
            >
              <option value="">None</option>
              {SET_ASIDES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="naics_code" className={labelClass}>
              NAICS Code
            </label>
            <input
              id="naics_code"
              name="naics_code"
              type="text"
              defaultValue={opportunity?.naics_code ?? ''}
              placeholder="541512"
              className={inputClass}
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="period_of_performance" className={labelClass}>
              Period of Performance
            </label>
            <input
              id="period_of_performance"
              name="period_of_performance"
              type="text"
              defaultValue={opportunity?.period_of_performance ?? ''}
              placeholder="5 years (1 base + 4 option)"
              className={inputClass}
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="place_of_performance" className={labelClass}>
              Place of Performance
            </label>
            <input
              id="place_of_performance"
              name="place_of_performance"
              type="text"
              defaultValue={opportunity?.place_of_performance ?? ''}
              placeholder="Falls Church, VA"
              className={inputClass}
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="incumbent" className={labelClass}>
              Incumbent
            </label>
            <input
              id="incumbent"
              name="incumbent"
              type="text"
              defaultValue={opportunity?.incumbent ?? ''}
              className={inputClass}
              disabled={isPending}
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              id="is_recompete"
              name="is_recompete"
              type="checkbox"
              value="true"
              defaultChecked={opportunity?.is_recompete ?? false}
              className="rounded border-border bg-navy text-cyan focus:ring-cyan"
              disabled={isPending}
            />
            <label htmlFor="is_recompete" className="text-sm text-slate">
              Recompete (rebid of existing contract)
            </label>
          </div>
        </div>
      </fieldset>

      {/* Section: Pipeline Status */}
      <fieldset className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <legend className="text-sm font-semibold text-foreground px-2">
          Pipeline Status
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="phase" className={labelClass}>
              Shipley Phase
            </label>
            <select
              id="phase"
              name="phase"
              defaultValue={opportunity?.phase ?? 'Gate 1'}
              className={selectClass}
              disabled={isPending}
            >
              {SHIPLEY_PHASES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className={labelClass}>
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={opportunity?.status ?? 'Active'}
              className={selectClass}
              disabled={isPending}
            >
              {OPPORTUNITY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className={labelClass}>
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue={opportunity?.priority ?? 'Medium'}
              className={selectClass}
              disabled={isPending}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pwin" className={labelClass}>
              Win Probability (0–100)
            </label>
            <input
              id="pwin"
              name="pwin"
              type="number"
              min={0}
              max={100}
              defaultValue={opportunity?.pwin ?? 50}
              className={inputClass}
              disabled={isPending}
            />
            {errors.pwin && <p className={errorClass}>{errors.pwin}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="due_date" className={labelClass}>
            Proposal Due Date
          </label>
          <input
            id="due_date"
            name="due_date"
            type="datetime-local"
            defaultValue={
              opportunity?.due_date
                ? new Date(opportunity.due_date).toISOString().slice(0, 16)
                : ''
            }
            className={`${inputClass} max-w-xs`}
            disabled={isPending}
          />
        </div>
      </fieldset>

      {/* Section: Contact */}
      <fieldset className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <legend className="text-sm font-semibold text-foreground px-2">
          Primary Contact
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact_name" className={labelClass}>
              Contact Name
            </label>
            <input
              id="contact_name"
              name="contact_name"
              type="text"
              defaultValue={opportunity?.contact_name ?? ''}
              className={inputClass}
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="contact_email" className={labelClass}>
              Contact Email
            </label>
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              defaultValue={opportunity?.contact_email ?? ''}
              className={inputClass}
              disabled={isPending}
            />
            {errors.contact_email && (
              <p className={errorClass}>{errors.contact_email}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-cyan px-6 py-2.5 text-sm font-semibold text-navy hover:bg-cyan/80 transition-colors disabled:opacity-50"
        >
          {isPending
            ? mode === 'edit'
              ? 'Saving...'
              : 'Creating...'
            : mode === 'edit'
              ? 'Save Changes'
              : 'Create Opportunity'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/pipeline')}
          disabled={isPending}
          className="rounded-md border border-border px-6 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
