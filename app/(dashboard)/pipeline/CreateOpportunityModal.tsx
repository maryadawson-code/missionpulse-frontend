'use client'

import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { FormModal, type FormFieldDef } from '@/components/ui/FormModal'
import { actionCreateOpportunityTyped } from './actions'

const createOpportunitySchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  agency: z.string().trim(),
  ceiling: z.string().trim(),
  pwin: z.string().trim(),
  naics_code: z.string().trim(),
  due_date: z.string().trim(),
  set_aside: z.string().trim(),
  description: z.string().trim(),
})

type CreateOpportunityForm = z.infer<typeof createOpportunitySchema>

const fields: FormFieldDef<CreateOpportunityForm>[] = [
  {
    name: 'title',
    label: 'Title',
    type: 'text',
    placeholder: 'e.g., DHA EHR Modernization Support',
  },
  {
    name: 'agency',
    label: 'Agency',
    type: 'text',
    placeholder: 'e.g., DHA, VA, CMS',
  },
  {
    name: 'ceiling',
    label: 'Contract Value ($)',
    type: 'number',
    placeholder: 'Total contract value',
  },
  {
    name: 'pwin',
    label: 'Win Probability (%)',
    type: 'number',
    placeholder: '0–100',
  },
  {
    name: 'due_date',
    label: 'Due Date',
    type: 'date',
    placeholder: 'RFP response deadline',
  },
  {
    name: 'set_aside',
    label: 'Set-Aside',
    type: 'select',
    options: [
      { label: 'SDVOSB', value: 'SDVOSB' },
      { label: 'WOSB', value: 'WOSB' },
      { label: '8(a)', value: '8(a)' },
      { label: 'HUBZone', value: 'HUBZone' },
      { label: 'Small Business', value: 'Small Business' },
      { label: 'Full & Open', value: 'Full & Open' },
    ],
  },
  {
    name: 'naics_code',
    label: 'NAICS Code',
    type: 'text',
    placeholder: 'e.g., 541512',
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    placeholder: 'Brief description of the opportunity...',
    fullWidth: true,
  },
]

export function CreateOpportunityButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleSubmit(data: CreateOpportunityForm) {
    const result = await actionCreateOpportunityTyped(data)
    return result
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Opportunity
      </Button>
      <FormModal<CreateOpportunityForm>
        open={open}
        onOpenChange={setOpen}
        title="New Opportunity"
        description="Add a new opportunity to your pipeline."
        schema={createOpportunitySchema}
        fields={fields}
        onSubmit={handleSubmit}
        successMessage="Opportunity created."
        submitLabel="Create"
        onSuccess={() => router.refresh()}
      />
    </>
  )
}
