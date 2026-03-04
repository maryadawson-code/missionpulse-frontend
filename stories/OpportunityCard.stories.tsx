import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { OpportunityCard } from '@/components/features/pipeline/OpportunityCard'

const meta = {
  title: 'Features/OpportunityCard',
  component: OpportunityCard,
  tags: ['autodocs'],
} satisfies Meta<typeof OpportunityCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    opportunity: {
      id: 'opp-1',
      title: 'DOD Cybersecurity Infrastructure Modernization',
      agency: 'Department of Defense',
      ceiling: 2500000,
      pwin: 75,
      due_date: '2026-04-15',
    },
  },
}

export const HighPwin: Story = {
  args: {
    opportunity: {
      id: 'opp-2',
      title: 'VA Health IT Support Services',
      agency: 'Veterans Affairs',
      ceiling: 500000,
      pwin: 85,
      due_date: '2026-05-01',
    },
  },
}

export const LowPwin: Story = {
  args: {
    opportunity: {
      id: 'opp-3',
      title: 'DISA Cloud Migration',
      agency: 'DISA',
      ceiling: 10000000,
      pwin: 25,
      due_date: null,
    },
  },
}

export const NoAgency: Story = {
  args: {
    opportunity: {
      id: 'opp-4',
      title: 'Unnamed Opportunity',
      agency: null,
      ceiling: null,
      pwin: null,
      due_date: null,
    },
  },
}
