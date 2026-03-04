import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { z } from 'zod'
import { FormModal } from '@/components/ui/FormModal'
import { Button } from '@/components/ui/button'

const sampleSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.string().min(1, 'Role is required'),
})

type SampleForm = z.infer<typeof sampleSchema>

function FormModalDemo() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Form Modal</Button>
      <FormModal<SampleForm>
        open={open}
        onOpenChange={setOpen}
        title="Add Team Member"
        description="Invite a new team member to the project."
        schema={sampleSchema}
        fields={[
          { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Doe' },
          { name: 'email', label: 'Email', type: 'email', placeholder: 'jane@example.com' },
          {
            name: 'role',
            label: 'Role',
            type: 'select',
            options: [
              { label: 'Author', value: 'author' },
              { label: 'Reviewer', value: 'reviewer' },
              { label: 'Admin', value: 'admin' },
            ],
          },
        ]}
        onSubmit={async (data) => {
          await new Promise((r) => setTimeout(r, 1000))
          console.log('Submitted:', data)
          return { success: true }
        }}
        successMessage="Team member added!"
        submitLabel="Add Member"
      />
    </>
  )
}

const meta = {
  title: 'UI/FormModal',
  component: FormModalDemo,
  tags: ['autodocs'],
} satisfies Meta<typeof FormModalDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
