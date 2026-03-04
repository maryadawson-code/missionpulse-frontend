import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { StatusBadge } from '@/components/ui/StatusBadge'

const meta = {
  title: 'UI/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: [
        'active', 'won', 'lost', 'draft', 'submitted',
        'in_progress', 'complete', 'review_needed',
        'compliant', 'non_compliant', 'partial',
        'not_started', 'verified', 'addressed',
        null,
      ],
    },
  },
} satisfies Meta<typeof StatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Active: Story = {
  args: { status: 'active' },
}

export const Won: Story = {
  args: { status: 'won' },
}

export const Lost: Story = {
  args: { status: 'lost' },
}

export const InProgress: Story = {
  args: { status: 'in_progress' },
}

export const Compliant: Story = {
  args: { status: 'compliant' },
}

export const NonCompliant: Story = {
  args: { status: 'non_compliant' },
}

export const NullStatus: Story = {
  args: { status: null },
}
