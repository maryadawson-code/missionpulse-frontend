import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { PhaseIndicator } from '@/components/ui/PhaseIndicator'

const meta = {
  title: 'UI/PhaseIndicator',
  component: PhaseIndicator,
  tags: ['autodocs'],
  argTypes: {
    phase: {
      control: 'select',
      options: [
        'Gate 1', 'Gate 2', 'Gate 3', 'Gate 4',
        'Capture', 'Proposal', 'Orals', 'Award',
        null,
      ],
    },
  },
} satisfies Meta<typeof PhaseIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Gate1: Story = {
  args: { phase: 'Gate 1' },
}

export const Gate2: Story = {
  args: { phase: 'Gate 2' },
}

export const Capture: Story = {
  args: { phase: 'Capture' },
}

export const Proposal: Story = {
  args: { phase: 'Proposal' },
}

export const Award: Story = {
  args: { phase: 'Award' },
}

export const NullPhase: Story = {
  args: { phase: null },
}
