import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { M365Config } from '@/components/features/integrations/M365Config'

const meta = {
  title: 'Integrations/M365Config',
  component: M365Config,
  tags: ['autodocs'],
} satisfies Meta<typeof M365Config>

export default meta
type Story = StoryObj<typeof meta>

export const Connected: Story = {
  args: {
    isConnected: true,
    isAvailable: true,
    userName: 'Mary Womack',
    lastSync: '2026-03-01T10:00:00Z',
    errorMessage: null,
    onedriveRoot: '/MissionPulse/Proposals',
  },
}

export const Disconnected: Story = {
  args: {
    isConnected: false,
    isAvailable: true,
    userName: null,
    lastSync: null,
    errorMessage: null,
    onedriveRoot: '/MissionPulse/Proposals',
  },
}

export const ComingSoon: Story = {
  args: {
    isConnected: false,
    isAvailable: false,
    userName: null,
    lastSync: null,
    errorMessage: null,
    onedriveRoot: '/MissionPulse/Proposals',
  },
}
