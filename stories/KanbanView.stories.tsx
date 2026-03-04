import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { KanbanView } from '@/app/(dashboard)/pipeline/KanbanView'

const meta = {
  title: 'Features/KanbanView',
  component: KanbanView,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof KanbanView>

export default meta
type Story = StoryObj<typeof meta>

const sampleOpportunities = [
  { id: '1', title: 'DOD Cyber Modernization', agency: 'Department of Defense', ceiling: 2500000, pwin: 75, due_date: '2026-04-15', phase: 'Gate 1' },
  { id: '2', title: 'VA Health IT Services', agency: 'Veterans Affairs', ceiling: 800000, pwin: 60, due_date: '2026-05-01', phase: 'Gate 2' },
  { id: '3', title: 'DHS Border Tech', agency: 'DHS', ceiling: 5000000, pwin: 40, due_date: '2026-06-01', phase: 'Gate 1' },
  { id: '4', title: 'DISA Cloud Migration', agency: 'DISA', ceiling: 10000000, pwin: 85, due_date: '2026-07-01', phase: 'Gate 3' },
  { id: '5', title: 'NASA Data Analytics', agency: 'NASA', ceiling: 1200000, pwin: 30, due_date: null, phase: 'Gate 4' },
]

export const Default: Story = {
  args: {
    opportunities: sampleOpportunities,
  },
}

export const Empty: Story = {
  args: {
    opportunities: [],
  },
}

export const SinglePhase: Story = {
  args: {
    opportunities: [
      { id: '1', title: 'Solo Pursuit', agency: 'GSA', ceiling: 3000000, pwin: 90, due_date: '2026-04-01', phase: 'Gate 5' },
    ],
  },
}

export const ReadOnly: Story = {
  args: {
    opportunities: sampleOpportunities,
    canEdit: false,
  },
}
