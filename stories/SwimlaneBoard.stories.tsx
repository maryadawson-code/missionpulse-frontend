import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SwimlaneBoard } from '@/components/features/swimlane/SwimlaneBoard'

const meta = {
  title: 'Features/SwimlaneBoard',
  component: SwimlaneBoard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof SwimlaneBoard>

export default meta
type Story = StoryObj<typeof meta>

const sampleSections = [
  { id: 's1', section_title: 'Executive Summary', volume: 'Technical', status: 'draft', due_date: '2026-04-10', writer_id: 'u1', reviewer_id: 'u2', sort_order: 1 },
  { id: 's2', section_title: 'Technical Approach', volume: 'Technical', status: 'pink_review', due_date: '2026-04-12', writer_id: 'u1', reviewer_id: null, sort_order: 2 },
  { id: 's3', section_title: 'Past Performance', volume: 'Past Performance', status: 'green_review', due_date: '2026-04-15', writer_id: 'u3', reviewer_id: 'u2', sort_order: 3 },
  { id: 's4', section_title: 'Management Plan', volume: 'Management', status: 'final', due_date: '2026-04-20', writer_id: 'u2', reviewer_id: 'u1', sort_order: 4 },
  { id: 's5', section_title: 'Staffing Plan', volume: 'Management', status: 'revision', due_date: '2026-04-14', writer_id: 'u3', reviewer_id: 'u1', sort_order: 5 },
]

const sampleTeam = [
  { assignee_name: 'Alice Chen', assignee_email: 'alice@example.com' },
  { assignee_name: 'Bob Smith', assignee_email: 'bob@example.com' },
  { assignee_name: 'Carol Davis', assignee_email: 'carol@example.com' },
]

export const Default: Story = {
  args: {
    opportunityId: 'opp-1',
    sections: sampleSections,
    teamMembers: sampleTeam,
  },
}

export const Empty: Story = {
  args: {
    opportunityId: 'opp-1',
    sections: [],
    teamMembers: [],
  },
}

export const ReadOnly: Story = {
  args: {
    opportunityId: 'opp-1',
    sections: sampleSections,
    teamMembers: sampleTeam,
    canEdit: false,
  },
}
