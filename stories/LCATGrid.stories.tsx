import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { LCATGrid } from '@/components/features/pricing/LCATGrid'

const meta = {
  title: 'Features/LCATGrid',
  component: LCATGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof LCATGrid>

export default meta
type Story = StoryObj<typeof meta>

const sampleCategories = [
  { id: 'l1', family: 'Engineering', level_name: 'Senior Systems Engineer', level: 3, gsa_lcat: 'SE-3', bill_rate_low: 175.00, bill_rate_high: 210.00, years_experience: 10 },
  { id: 'l2', family: 'Engineering', level_name: 'Systems Engineer', level: 2, gsa_lcat: 'SE-2', bill_rate_low: 140.00, bill_rate_high: 175.00, years_experience: 5 },
  { id: 'l3', family: 'Engineering', level_name: 'Junior Engineer', level: 1, gsa_lcat: 'SE-1', bill_rate_low: 95.00, bill_rate_high: 130.00, years_experience: 2 },
  { id: 'l4', family: 'Cybersecurity', level_name: 'Senior Security Analyst', level: 3, gsa_lcat: 'CS-3', bill_rate_low: 185.00, bill_rate_high: 225.00, years_experience: 10 },
  { id: 'l5', family: 'Cybersecurity', level_name: 'Security Analyst', level: 2, gsa_lcat: 'CS-2', bill_rate_low: 145.00, bill_rate_high: 185.00, years_experience: 5 },
  { id: 'l6', family: 'Management', level_name: 'Program Manager', level: 3, gsa_lcat: 'PM-3', bill_rate_low: 190.00, bill_rate_high: 240.00, years_experience: 12 },
  { id: 'l7', family: 'Management', level_name: 'Project Manager', level: 2, gsa_lcat: 'PM-2', bill_rate_low: 155.00, bill_rate_high: 195.00, years_experience: 7 },
]

export const Default: Story = {
  args: {
    categories: sampleCategories,
  },
}

export const Empty: Story = {
  args: {
    categories: [],
  },
}

export const SingleFamily: Story = {
  args: {
    categories: sampleCategories.filter((c) => c.family === 'Cybersecurity'),
  },
}
