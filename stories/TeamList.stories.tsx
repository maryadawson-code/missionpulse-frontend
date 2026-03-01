import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { TeamList } from '@/components/features/team/TeamList'

const meta = {
  title: 'Features/TeamList',
  component: TeamList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof TeamList>

export default meta
type Story = StoryObj<typeof meta>

const sampleAssignments = [
  { id: 'a1', assignee_name: 'Alice Chen', assignee_email: 'alice@example.com', role: 'Capture Manager', created_at: '2026-01-15' },
  { id: 'a2', assignee_name: 'Bob Smith', assignee_email: 'bob@example.com', role: 'Lead Writer', created_at: '2026-01-16' },
  { id: 'a3', assignee_name: 'Carol Davis', assignee_email: 'carol@example.com', role: 'Volume Lead', created_at: '2026-01-17' },
  { id: 'a4', assignee_name: 'Dan Wilson', assignee_email: null, role: 'Subject Matter Expert', created_at: '2026-02-01' },
]

export const Default: Story = {
  args: {
    opportunityId: 'opp-1',
    assignments: sampleAssignments,
  },
}

export const Empty: Story = {
  args: {
    opportunityId: 'opp-1',
    assignments: [],
  },
}

export const SingleMember: Story = {
  args: {
    opportunityId: 'opp-1',
    assignments: [sampleAssignments[0]],
  },
}
