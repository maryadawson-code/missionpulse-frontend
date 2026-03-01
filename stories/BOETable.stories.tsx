import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { BOETable } from '@/components/features/pricing/BOETable'

const meta = {
  title: 'Features/BOETable',
  component: BOETable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof BOETable>

export default meta
type Story = StoryObj<typeof meta>

const lcatMap: Record<string, string> = {
  'lcat-1': 'Senior Systems Engineer',
  'lcat-2': 'Project Manager',
  'lcat-3': 'Cybersecurity Analyst',
  'lcat-4': 'Software Developer',
}

const sampleEntries = [
  { id: 'b1', wbs_number: '1.1.1', task_description: 'System Architecture Design', labor_category_id: 'lcat-1', period: 'Base Year', total_hours: 480, rate_used: 195.00, extended_cost: 93600, assumptions: 'FTE for 3 months' },
  { id: 'b2', wbs_number: '1.1.2', task_description: 'Requirements Analysis', labor_category_id: 'lcat-2', period: 'Base Year', total_hours: 320, rate_used: 175.00, extended_cost: 56000, assumptions: null },
  { id: 'b3', wbs_number: '1.2.1', task_description: 'Security Assessment', labor_category_id: 'lcat-3', period: 'Base Year', total_hours: 240, rate_used: 165.00, extended_cost: 39600, assumptions: 'NIST 800-171 assessment' },
  { id: 'b4', wbs_number: '2.1.1', task_description: 'Application Development', labor_category_id: 'lcat-4', period: 'Option Year 1', total_hours: 960, rate_used: 155.00, extended_cost: 148800, assumptions: '2 FTEs for 3 months' },
  { id: 'b5', wbs_number: '2.1.2', task_description: 'Integration Testing', labor_category_id: 'lcat-4', period: 'Option Year 1', total_hours: 480, rate_used: 155.00, extended_cost: 74400, assumptions: null },
]

export const Default: Story = {
  args: {
    entries: sampleEntries,
    lcatMap,
  },
}

export const Empty: Story = {
  args: {
    entries: [],
    lcatMap: {},
  },
}

export const SinglePeriod: Story = {
  args: {
    entries: sampleEntries.filter((e) => e.period === 'Base Year'),
    lcatMap,
  },
}
