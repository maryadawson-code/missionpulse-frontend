import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SectionCard } from '@/components/features/swimlane/SectionCard'

const mockTeam = [
  { assignee_name: 'John Smith', assignee_email: 'john@example.com' },
  { assignee_name: 'Jane Doe', assignee_email: 'jane@example.com' },
]

const meta = {
  title: 'Features/SectionCard',
  component: SectionCard,
  tags: ['autodocs'],
} satisfies Meta<typeof SectionCard>

export default meta
type Story = StoryObj<typeof meta>

export const Technical: Story = {
  args: {
    section: {
      id: 'sec-1',
      section_title: 'Technical Approach',
      volume: 'Technical',
      due_date: '2026-04-10',
      writer_id: 'john@example.com',
      reviewer_id: 'jane@example.com',
    },
    teamMembers: mockTeam,
    opportunityId: 'opp-1',
  },
}

export const Management: Story = {
  args: {
    section: {
      id: 'sec-2',
      section_title: 'Management Plan',
      volume: 'Management',
      due_date: '2026-04-12',
      writer_id: 'jane@example.com',
      reviewer_id: null,
    },
    teamMembers: mockTeam,
    opportunityId: 'opp-1',
  },
}

export const Unassigned: Story = {
  args: {
    section: {
      id: 'sec-3',
      section_title: 'Past Performance',
      volume: 'Past Performance',
      due_date: null,
      writer_id: null,
      reviewer_id: null,
    },
    teamMembers: mockTeam,
    opportunityId: 'opp-1',
  },
}
