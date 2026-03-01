import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { GoogleConfig } from '@/components/features/integrations/GoogleConfig'

const meta = {
  title: 'Integrations/GoogleConfig',
  component: GoogleConfig,
  tags: ['autodocs'],
} satisfies Meta<typeof GoogleConfig>

export default meta
type Story = StoryObj<typeof meta>

export const Connected: Story = {
  args: {
    isConnected: true,
    userName: 'Mary Womack',
    userEmail: 'mary@missionmeetstech.com',
    lastSync: '2026-03-01T10:00:00Z',
    canEdit: true,
  },
}

export const Disconnected: Story = {
  args: {
    isConnected: false,
    userName: null,
    userEmail: null,
    lastSync: null,
    canEdit: true,
  },
}
