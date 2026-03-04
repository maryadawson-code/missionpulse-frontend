import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

const meta = {
  title: 'UI/ConfirmModal',
  component: ConfirmModal,
  tags: ['autodocs'],
  argTypes: {
    destructive: { control: 'boolean' },
    confirmLabel: { control: 'text' },
  },
} satisfies Meta<typeof ConfirmModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    title: 'Confirm Submission',
    description: 'Are you sure you want to submit this proposal for review?',
    confirmLabel: 'Submit',
    destructive: false,
    onConfirm: async () => ({ success: true }),
    successMessage: 'Submitted successfully',
  },
}

export const Destructive: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    title: 'Delete Opportunity',
    description: 'This action cannot be undone. The opportunity and all associated data will be permanently deleted.',
    confirmLabel: 'Delete',
    destructive: true,
    onConfirm: async () => ({ success: true }),
    successMessage: 'Deleted successfully',
  },
}
