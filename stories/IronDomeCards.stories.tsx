import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { IronDomeCards } from '@/components/features/compliance/IronDomeCards'

const meta = {
  title: 'Features/IronDomeCards',
  component: IronDomeCards,
  tags: ['autodocs'],
} satisfies Meta<typeof IronDomeCards>

export default meta
type Story = StoryObj<typeof meta>

export const Healthy: Story = {
  args: {
    totalReqs: 150,
    totalAddressed: 140,
    totalVerified: 120,
    overallPct: 93,
    gapCount: 0,
    activeOpps: 8,
  },
}

export const AtRisk: Story = {
  args: {
    totalReqs: 200,
    totalAddressed: 120,
    totalVerified: 60,
    overallPct: 55,
    gapCount: 12,
    activeOpps: 5,
  },
}

export const Critical: Story = {
  args: {
    totalReqs: 100,
    totalAddressed: 20,
    totalVerified: 5,
    overallPct: 20,
    gapCount: 45,
    activeOpps: 3,
  },
}

export const Empty: Story = {
  args: {
    totalReqs: 0,
    totalAddressed: 0,
    totalVerified: 0,
    overallPct: 0,
    gapCount: 0,
    activeOpps: 0,
  },
}
