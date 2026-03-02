import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SlackConfig } from '@/components/features/integrations/SlackConfig'

const meta = {
  title: 'Integrations/SlackConfig',
  component: SlackConfig,
  tags: ['autodocs'],
} satisfies Meta<typeof SlackConfig>

export default meta
type Story = StoryObj<typeof meta>

export const Connected: Story = {
  args: {
    isConnected: true,
    isAvailable: true,
    teamName: 'Mission Meets Tech',
    lastSync: '2026-03-01T10:00:00Z',
    errorMessage: null,
    notificationPrefs: {
      gate_approval: true,
      deadline_warning: true,
      hitl_pending: true,
      pwin_change: false,
      assignment: true,
    },
  },
}

export const Disconnected: Story = {
  args: {
    isConnected: false,
    isAvailable: true,
    teamName: null,
    lastSync: null,
    errorMessage: null,
    notificationPrefs: null,
  },
}

export const WithError: Story = {
  args: {
    isConnected: false,
    isAvailable: true,
    teamName: 'Mission Meets Tech',
    lastSync: '2026-02-28T14:00:00Z',
    errorMessage: 'OAuth token expired. Please reconnect.',
    notificationPrefs: null,
  },
}

export const ComingSoon: Story = {
  args: {
    isConnected: false,
    isAvailable: false,
    teamName: null,
    lastSync: null,
    errorMessage: null,
    notificationPrefs: null,
  },
}
