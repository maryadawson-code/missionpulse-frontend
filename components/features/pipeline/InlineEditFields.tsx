'use client'

import { InlineEditField } from '@/components/ui/InlineEditField'
import { updateOpportunityField } from '@/lib/actions/opportunities'
import { addToast } from '@/components/ui/Toast'

interface FieldDef {
  label: string
  fieldName: string
  value: string | null | undefined
  type?: 'text' | 'number' | 'date' | 'textarea'
  format?: (_v: string | null | undefined) => string
}

interface InlineEditFieldsProps {
  opportunityId: string
  fields: FieldDef[]
  canEdit: boolean
}

export function InlineEditFields({ opportunityId, fields, canEdit }: InlineEditFieldsProps) {
  async function handleSave(fieldName: string, value: string) {
    const result = await updateOpportunityField(opportunityId, fieldName, value)
    if (result.success) {
      addToast('success', `${fieldName.replace(/_/g, ' ')} updated`)
    } else {
      addToast('error', result.error ?? 'Failed to update')
    }
    return result
  }

  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
      {fields.map((f) => (
        <InlineEditField
          key={f.fieldName}
          label={f.label}
          value={f.value}
          fieldName={f.fieldName}
          type={f.type ?? 'text'}
          canEdit={canEdit}
          onSave={handleSave}
          format={f.format}
        />
      ))}
    </dl>
  )
}
