import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { DocuSignConfig } from '@/components/features/integrations/DocuSignConfig'

const meta = {
  title: 'Integrations/DocuSignConfig',
  component: DocuSignConfig,
  tags: ['autodocs'],
} satisfies Meta<typeof DocuSignConfig>

export default meta
type Story = StoryObj<typeof meta>

export const Connected: Story = {
  args: {
    isConnected: true,
    isAvailable: true,
    userName: 'Mary Womack',
    environment: 'production',
    lastSync: '2026-03-01T10:00:00Z',
    canEdit: true,
  },
}

export const Disconnected: Story = {
  args: {
    isConnected: false,
    isAvailable: true,
    userName: null,
    environment: 'sandbox',
    lastSync: null,
    canEdit: true,
  },
}

export const ReadOnly: Story = {
  args: {
    isConnected: true,
    isAvailable: true,
    userName: 'Mary Womack',
    environment: 'production',
    lastSync: '2026-03-01T10:00:00Z',
    canEdit: false,
  },
}

export const ComingSoon: Story = {
  args: {
    isConnected: false,
    isAvailable: false,
    userName: null,
    environment: 'sandbox',
    lastSync: null,
    canEdit: true,
  },
}
