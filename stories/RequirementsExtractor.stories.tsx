import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { RequirementsExtractor } from '@/components/features/shredder/RequirementsExtractor'

const meta = {
  title: 'Features/RequirementsExtractor',
  component: RequirementsExtractor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof RequirementsExtractor>

export default meta
type Story = StoryObj<typeof meta>

const sampleText = `3.1 Technical Requirements

The Contractor SHALL provide 24/7 cybersecurity monitoring services for all designated systems.
The Contractor MUST implement automated threat detection using industry-standard SIEM tools.
The system SHALL achieve 99.9% uptime measured on a monthly basis.
All incident responses MUST be initiated within 15 minutes of detection.

3.2 Management Requirements

The Contractor shall provide monthly status reports within 5 business days of month end.
Key personnel must maintain active Secret clearance throughout the period of performance.`

const sampleRequirements = [
  { id: 'r1', reference: 'L.3.1.1', requirement: 'Provide 24/7 cybersecurity monitoring services', section: 'Technical', priority: 'Critical', status: 'Addressed', assigned_to: 'Alice Chen', page_reference: 'p.5', volume_reference: 'Vol I', notes: null },
  { id: 'r2', reference: 'L.3.1.2', requirement: 'Implement automated threat detection using SIEM', section: 'Technical', priority: 'High', status: 'In Progress', assigned_to: 'Bob Smith', page_reference: 'p.5', volume_reference: 'Vol I', notes: null },
]

const sampleTeam = [
  { assignee_name: 'Alice Chen', assignee_email: 'alice@example.com' },
  { assignee_name: 'Bob Smith', assignee_email: 'bob@example.com' },
]

export const Default: Story = {
  args: {
    opportunityId: 'opp-1',
    documentId: 'doc-1',
    sourceText: sampleText,
    existingRequirements: sampleRequirements,
    teamMembers: sampleTeam,
  },
}

export const NoRequirements: Story = {
  args: {
    opportunityId: 'opp-1',
    documentId: 'doc-1',
    sourceText: sampleText,
    existingRequirements: [],
    teamMembers: sampleTeam,
  },
}
