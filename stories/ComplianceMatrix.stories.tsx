import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ComplianceMatrix } from '@/components/features/compliance/ComplianceMatrix'

const meta = {
  title: 'Features/ComplianceMatrix',
  component: ComplianceMatrix,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ComplianceMatrix>

export default meta
type Story = StoryObj<typeof meta>

const sampleRequirements = [
  { id: 'r1', reference: 'L.5.1', requirement: 'Contractor shall provide cybersecurity monitoring 24/7', section: 'Technical', priority: 'Critical', status: 'Verified', assigned_to: 'Alice Chen', reviewer: 'Bob Smith', notes: 'Meets SOW para 3.2', evidence_links: null, page_reference: 'p.12', volume_reference: 'Vol I', verified_at: '2026-02-15', verified_by: 'Bob Smith', created_at: '2026-01-10', updated_at: '2026-02-15' },
  { id: 'r2', reference: 'L.5.2', requirement: 'System shall achieve 99.9% uptime SLA', section: 'Technical', priority: 'High', status: 'Addressed', assigned_to: 'Carol Davis', reviewer: null, notes: null, evidence_links: null, page_reference: 'p.14', volume_reference: 'Vol I', verified_at: null, verified_by: null, created_at: '2026-01-10', updated_at: '2026-02-10' },
  { id: 'r3', reference: 'M.3.1', requirement: 'Provide monthly status reports within 5 business days', section: 'Management', priority: 'Medium', status: 'In Progress', assigned_to: 'Bob Smith', reviewer: null, notes: 'Template in Appendix C', evidence_links: null, page_reference: 'p.28', volume_reference: 'Vol II', verified_at: null, verified_by: null, created_at: '2026-01-10', updated_at: '2026-01-20' },
  { id: 'r4', reference: 'M.3.2', requirement: 'Key personnel shall have Secret clearance', section: 'Management', priority: 'Critical', status: 'Not Started', assigned_to: null, reviewer: null, notes: null, evidence_links: null, page_reference: 'p.30', volume_reference: 'Vol II', verified_at: null, verified_by: null, created_at: '2026-01-10', updated_at: '2026-01-10' },
]

const sampleTeam = [
  { assignee_name: 'Alice Chen', assignee_email: 'alice@example.com' },
  { assignee_name: 'Bob Smith', assignee_email: 'bob@example.com' },
  { assignee_name: 'Carol Davis', assignee_email: 'carol@example.com' },
]

export const Default: Story = {
  args: {
    requirements: sampleRequirements,
    teamMembers: sampleTeam,
    opportunityId: 'opp-1',
  },
}

export const Empty: Story = {
  args: {
    requirements: [],
    teamMembers: [],
    opportunityId: 'opp-1',
  },
}

export const AllVerified: Story = {
  args: {
    requirements: sampleRequirements.map((r) => ({ ...r, status: 'Verified', verified_at: '2026-03-01', verified_by: 'QA Lead' })),
    teamMembers: sampleTeam,
    opportunityId: 'opp-1',
  },
}
