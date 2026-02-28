import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { z } from 'zod'
import { FormModal } from '../FormModal'

// Mock the toast module
vi.mock('@/components/ui/Toast', () => ({
  addToast: vi.fn(),
}))

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
})

type TestFormData = z.infer<typeof testSchema>

const testFields = [
  { name: 'name' as const, label: 'Full Name', type: 'text' as const, placeholder: 'Enter name' },
  { name: 'email' as const, label: 'Email', type: 'email' as const, placeholder: 'Enter email' },
]

describe('FormModal', () => {
  it('renders modal title when open', () => {
    render(
      <FormModal<TestFormData>
        open={true}
        onOpenChange={vi.fn()}
        title="Create User"
        schema={testSchema}
        fields={testFields}
        onSubmit={vi.fn().mockResolvedValue({ success: true })}
      />
    )
    expect(screen.getByText('Create User')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(
      <FormModal<TestFormData>
        open={true}
        onOpenChange={vi.fn()}
        title="Create User"
        description="Fill in the details below."
        schema={testSchema}
        fields={testFields}
        onSubmit={vi.fn().mockResolvedValue({ success: true })}
      />
    )
    expect(screen.getByText('Fill in the details below.')).toBeInTheDocument()
  })

  it('renders form fields from field definitions', () => {
    render(
      <FormModal<TestFormData>
        open={true}
        onOpenChange={vi.fn()}
        title="Create User"
        schema={testSchema}
        fields={testFields}
        onSubmit={vi.fn().mockResolvedValue({ success: true })}
      />
    )
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('renders submit and cancel buttons', () => {
    render(
      <FormModal<TestFormData>
        open={true}
        onOpenChange={vi.fn()}
        title="Create"
        schema={testSchema}
        fields={testFields}
        onSubmit={vi.fn().mockResolvedValue({ success: true })}
        submitLabel="Create User"
      />
    )
    expect(screen.getByText('Create User')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ success: true })

    render(
      <FormModal<TestFormData>
        open={true}
        onOpenChange={vi.fn()}
        title="Create User"
        schema={testSchema}
        fields={testFields}
        onSubmit={onSubmit}
      />
    )

    const saveButton = screen.getByText('Save')
    await user.click(saveButton)

    // onSubmit should NOT be called with invalid data
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not render when closed', () => {
    render(
      <FormModal<TestFormData>
        open={false}
        onOpenChange={vi.fn()}
        title="Hidden Modal"
        schema={testSchema}
        fields={testFields}
        onSubmit={vi.fn().mockResolvedValue({ success: true })}
      />
    )
    expect(screen.queryByText('Hidden Modal')).not.toBeInTheDocument()
  })
})
