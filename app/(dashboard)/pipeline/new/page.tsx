// filepath: app/(dashboard)/pipeline/new/page.tsx
'use client'

import { actionCreateOpportunity } from '../actions'
import Link from 'next/link'

// ─── Form Field Component ───────────────────────────────────────
function Field({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  helpText,
  options,
}: {
  label: string
  name: string
  type?: 'text' | 'number' | 'date' | 'email' | 'textarea' | 'select'
  placeholder?: string
  required?: boolean
  helpText?: string
  options?: { value: string; label: string }[]
}) {
  const baseClasses =
    'w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none transition-colors focus:border-[#00E5FA]/50 focus:ring-1 focus:ring-[#00E5FA]/25'

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          placeholder={placeholder}
          required={required}
          rows={3}
          className={`${baseClasses} mt-1.5`}
        />
      ) : type === 'select' && options ? (
        <select id={name} name={name} required={required} className={`${baseClasses} mt-1.5`}>
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          className={`${baseClasses} mt-1.5`}
        />
      )}
      {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
    </div>
  )
}

// ─── Phase Options (Shipley methodology) ────────────────────────
const PHASE_OPTIONS = [
  { value: 'Long Capture', label: 'Long Capture' },
  { value: 'Capture', label: 'Capture' },
  { value: 'Proposal Planning', label: 'Proposal Planning' },
  { value: 'Proposal Development', label: 'Proposal Development' },
  { value: 'Production & QA', label: 'Production & QA' },
  { value: 'Post-Submission', label: 'Post-Submission' },
  { value: 'Post-Award', label: 'Post-Award' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'open', label: 'Open' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'no-go', label: 'No-Go' },
]

const SET_ASIDE_OPTIONS = [
  { value: 'SDVOSB', label: 'SDVOSB' },
  { value: 'WOSB', label: 'WOSB' },
  { value: '8(a)', label: '8(a)' },
  { value: 'HUBZone', label: 'HUBZone' },
  { value: 'Small Business', label: 'Small Business' },
  { value: 'Full & Open', label: 'Full & Open' },
  { value: 'Unrestricted', label: 'Unrestricted' },
]

// ─── Page Component ─────────────────────────────────────────────
export default function NewOpportunityPage() {
  async function handleSubmit(formData: FormData): Promise<void> {
    await actionCreateOpportunity(formData)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/pipeline"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          aria-label="Back to pipeline"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">New Opportunity</h1>
          <p className="mt-1 text-sm text-gray-500">Add a new opportunity to your pipeline</p>
        </div>
      </div>

      {/* Form */}
      <form action={handleSubmit} className="space-y-8">
        {/* ─── Basic Info ──────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Basic Information
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Title"
                name="title"
                placeholder="e.g., DHA EHR Modernization Support"
                required
              />
            </div>
            <Field label="Agency" name="agency" placeholder="e.g., DHA, VA, CMS" />
            <Field
              label="Ceiling"
              name="ceiling"
              type="number"
              placeholder="Total contract value"
              helpText="Dollar amount (no commas)"
            />
            <Field
              label="Win Probability"
              name="pwin"
              type="number"
              placeholder="0–100"
              helpText="Assessed probability of win (0–100)"
            />
            <Field label="NAICS Code" name="naics_code" placeholder="e.g., 541512" />
            <div className="sm:col-span-2">
              <Field
                label="Description"
                name="description"
                type="textarea"
                placeholder="Brief description of the opportunity..."
              />
            </div>
          </div>
        </section>

        {/* ─── Classification ──────────────────────────────────── */}
        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Classification
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Phase" name="phase" type="select" options={PHASE_OPTIONS} />
            <Field label="Status" name="status" type="select" options={STATUS_OPTIONS} />
            <Field label="Set-Aside" name="set_aside" type="select" options={SET_ASIDE_OPTIONS} />
            <Field label="Contract Vehicle" name="contract_vehicle" placeholder="e.g., STARS III, CIO-SP4" />
          </div>
        </section>

        {/* ─── Dates ───────────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Key Dates
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Due Date" name="due_date" type="date" helpText="RFP response deadline" />
            <Field label="Submission Date" name="submission_date" type="date" helpText="Planned submission date" />
          </div>
        </section>

        {/* ─── Contacts ────────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Point of Contact
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Contact Name" name="contact_name" placeholder="Government POC name" />
            <Field label="Contact Email" name="contact_email" type="email" placeholder="poc@agency.gov" />
            <Field label="Incumbent" name="incumbent" placeholder="Current contract holder" />
            <Field label="Place of Performance" name="place_of_performance" placeholder="e.g., Falls Church, VA" />
          </div>
        </section>

        {/* ─── Actions ─────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/pipeline"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-lg bg-[#00E5FA] px-6 py-2 text-sm font-medium text-[#00050F] transition-colors hover:bg-[#00E5FA]/90"
          >
            Create Opportunity
          </button>
        </div>
      </form>
    </div>
  )
}
