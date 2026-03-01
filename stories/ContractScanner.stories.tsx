import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ContractScanner } from '@/components/features/contracts/ContractScanner'

const meta = {
  title: 'Features/ContractScanner',
  component: ContractScanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ContractScanner>

export default meta
type Story = StoryObj<typeof meta>

const sampleClauses = [
  { id: 'c1', clause_number: 'FAR 52.204-21', clause_title: 'Basic Safeguarding of Covered Contractor Information Systems', clause_type: 'FAR', full_text: 'The Contractor shall apply the following basic safeguarding requirements and procedures to protect covered contractor information systems.', risk_level: 'High', compliance_status: 'Review Needed', notes: 'Requires NIST 800-171 compliance', reviewed_at: null, reviewed_by: null, created_at: '2026-01-15', updated_at: '2026-01-15' },
  { id: 'c2', clause_number: 'FAR 52.219-6', clause_title: 'Notice of Total Small Business Set-Aside', clause_type: 'FAR', full_text: 'This acquisition is set aside for small business concerns.', risk_level: 'Low', compliance_status: 'Compliant', notes: 'Company qualifies as SB under NAICS 541512', reviewed_at: '2026-02-01', reviewed_by: 'Legal Team', created_at: '2026-01-15', updated_at: '2026-02-01' },
  { id: 'c3', clause_number: 'DFARS 252.204-7012', clause_title: 'Safeguarding Covered Defense Information', clause_type: 'DFARS', full_text: 'The Contractor shall provide adequate security for all covered defense information on all covered contractor information systems.', risk_level: 'High', compliance_status: 'Non-Compliant', notes: 'CMMC Level 2 assessment pending', reviewed_at: '2026-02-10', reviewed_by: 'Security Team', created_at: '2026-01-15', updated_at: '2026-02-10' },
  { id: 'c4', clause_number: 'FAR 52.232-33', clause_title: 'Payment by Electronic Funds Transfer', clause_type: 'FAR', full_text: 'All payments by the Government under this contract shall be made by electronic funds transfer.', risk_level: 'Medium', compliance_status: 'Compliant', notes: null, reviewed_at: '2026-01-20', reviewed_by: 'Finance', created_at: '2026-01-15', updated_at: '2026-01-20' },
]

export const Default: Story = {
  args: {
    clauses: sampleClauses,
    opportunityId: 'opp-1',
  },
}

export const AllCompliant: Story = {
  args: {
    clauses: sampleClauses.map((c) => ({ ...c, compliance_status: 'Compliant', risk_level: 'Low' })),
    opportunityId: 'opp-1',
  },
}

export const Empty: Story = {
  args: {
    clauses: [],
    opportunityId: 'opp-1',
  },
}
