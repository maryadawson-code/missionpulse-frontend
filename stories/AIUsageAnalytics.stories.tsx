import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AIUsageAnalytics } from '@/components/features/analytics/AIUsageAnalytics'

const meta = {
  title: 'Analytics/AIUsageAnalytics',
  component: AIUsageAnalytics,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof AIUsageAnalytics>

export default meta
type Story = StoryObj<typeof meta>

const sampleEntries = [
  { id: '1', agent_id: 'chat', input_tokens: 1200, output_tokens: 800, estimated_cost_usd: 0.04, created_at: '2026-03-01T08:00:00Z', opportunity_id: 'opp-1', metadata: null },
  { id: '2', agent_id: 'compliance', input_tokens: 3000, output_tokens: 1500, estimated_cost_usd: 0.12, created_at: '2026-03-01T09:30:00Z', opportunity_id: 'opp-1', metadata: null },
  { id: '3', agent_id: 'writer', input_tokens: 5000, output_tokens: 4000, estimated_cost_usd: 0.25, created_at: '2026-02-28T10:15:00Z', opportunity_id: 'opp-2', metadata: null },
  { id: '4', agent_id: 'capture', input_tokens: 2000, output_tokens: 1000, estimated_cost_usd: 0.08, created_at: '2026-02-27T14:00:00Z', opportunity_id: null, metadata: null },
  { id: '5', agent_id: 'strategy', input_tokens: 4000, output_tokens: 3000, estimated_cost_usd: 0.18, created_at: '2026-02-26T11:00:00Z', opportunity_id: 'opp-2', metadata: null },
]

export const Default: Story = {
  args: {
    entries: sampleEntries,
    opportunityMap: {
      'opp-1': 'DOD Cyber Modernization',
      'opp-2': 'VA Health IT Services',
    },
    cacheMetrics: {
      hits: 245,
      misses: 78,
      hit_rate: 75.8,
    },
  },
}

export const NoCacheData: Story = {
  args: {
    entries: sampleEntries,
    opportunityMap: { 'opp-1': 'DOD Cyber' },
    cacheMetrics: {
      hits: 0,
      misses: 0,
      hit_rate: 0,
    },
  },
}

export const Empty: Story = {
  args: {
    entries: [],
    opportunityMap: {},
    cacheMetrics: { hits: 0, misses: 0, hit_rate: 0 },
  },
}
