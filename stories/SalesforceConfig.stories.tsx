import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SalesforceConfig } from '@/components/features/integrations/SalesforceConfig'

const meta = {
  title: 'Integrations/SalesforceConfig',
  component: SalesforceConfig,
  tags: ['autodocs'],
} satisfies Meta<typeof SalesforceConfig>

export default meta
type Story = StoryObj<typeof meta>

export const Connected: Story = {
  args: {
    isConnected: true,
    isAvailable: true,
    lastSync: '2026-03-01T10:00:00Z',
    errorMessage: null,
    instanceUrl: 'https://mmt.my.salesforce.com',
    fieldMappings: [
      { mp_field: 'title', sf_field: 'Name', direction: 'bidirectional' },
      { mp_field: 'agency', sf_field: 'Account.Name', direction: 'sf_to_mp' },
      { mp_field: 'ceiling', sf_field: 'Amount', direction: 'bidirectional' },
    ],
  },
}

export const Disconnected: Story = {
  args: {
    isConnected: false,
    isAvailable: true,
    lastSync: null,
    errorMessage: null,
    instanceUrl: null,
    fieldMappings: null,
  },
}

export const ComingSoon: Story = {
  args: {
    isConnected: false,
    isAvailable: false,
    lastSync: null,
    errorMessage: null,
    instanceUrl: null,
    fieldMappings: null,
  },
}
