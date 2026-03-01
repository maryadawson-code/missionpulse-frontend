import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { TokenUsageCharts } from '@/components/features/admin/TokenUsageCharts'

const meta = {
  title: 'Admin/TokenUsageCharts',
  component: TokenUsageCharts,
  tags: ['autodocs'],
} satisfies Meta<typeof TokenUsageCharts>

export default meta
type Story = StoryObj<typeof meta>

const sampleEntries = [
  { id: '1', agent_id: 'chat', input_tokens: 1200, output_tokens: 800, estimated_cost_usd: 0.04, created_at: '2026-03-01T08:00:00Z', metadata: null },
  { id: '2', agent_id: 'compliance', input_tokens: 3000, output_tokens: 1500, estimated_cost_usd: 0.12, created_at: '2026-03-01T09:30:00Z', metadata: null },
  { id: '3', agent_id: 'writer', input_tokens: 5000, output_tokens: 4000, estimated_cost_usd: 0.25, created_at: '2026-03-01T10:15:00Z', metadata: null },
  { id: '4', agent_id: 'capture', input_tokens: 2000, output_tokens: 1000, estimated_cost_usd: 0.08, created_at: '2026-02-28T14:00:00Z', metadata: null },
  { id: '5', agent_id: 'strategy', input_tokens: 4000, output_tokens: 3000, estimated_cost_usd: 0.18, created_at: '2026-02-27T11:00:00Z', metadata: null },
]

export const Default: Story = {
  args: {
    entries: sampleEntries,
    monthlyBudget: 500,
  },
}

export const HighUsage: Story = {
  args: {
    entries: Array.from({ length: 50 }, (_, i) => ({
      id: String(i),
      agent_id: ['chat', 'compliance', 'writer', 'capture', 'strategy'][i % 5],
      input_tokens: Math.floor(Math.random() * 10000),
      output_tokens: Math.floor(Math.random() * 8000),
      estimated_cost_usd: Math.random() * 0.5,
      created_at: new Date(2026, 2, 1 + Math.floor(i / 3)).toISOString(),
      metadata: null,
    })),
    monthlyBudget: 500,
  },
}

export const Empty: Story = {
  args: {
    entries: [],
    monthlyBudget: 500,
  },
}
