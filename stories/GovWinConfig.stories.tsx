import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { GovWinConfig } from '@/components/features/integrations/GovWinConfig'

const meta = {
  title: 'Integrations/GovWinConfig',
  component: GovWinConfig,
  tags: ['autodocs'],
} satisfies Meta<typeof GovWinConfig>

export default meta
type Story = StoryObj<typeof meta>

export const Connected: Story = {
  args: {
    isConnected: true,
    lastSync: '2026-03-01T08:00:00Z',
    errorMessage: null,
    alertCount: 5,
    alertFilters: {
      naicsCodes: ['541512', '541511'],
      agencies: ['DoD', 'DHS'],
      setAsides: ['8(a)', 'SDVOSB'],
      minValue: 500000,
    },
    pendingAlerts: [
      { id: 'a1', title: 'Cyber Defense Modernization', agency: 'DoD', estimatedValue: 5000000, dueDate: '2026-04-15' },
      { id: 'a2', title: 'Border Security IT Support', agency: 'DHS', estimatedValue: 2000000, dueDate: '2026-05-01' },
    ],
  },
}

export const Disconnected: Story = {
  args: {
    isConnected: false,
    lastSync: null,
    errorMessage: null,
    alertCount: 0,
    alertFilters: null,
    pendingAlerts: [],
  },
}

export const NoAlerts: Story = {
  args: {
    isConnected: true,
    lastSync: '2026-03-01T08:00:00Z',
    errorMessage: null,
    alertCount: 0,
    alertFilters: { naicsCodes: ['541512'], agencies: [], setAsides: [], minValue: 100000 },
    pendingAlerts: [],
  },
}
