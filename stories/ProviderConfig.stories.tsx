import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ProviderConfig } from '@/components/features/admin/ProviderConfig'

const meta = {
  title: 'Admin/ProviderConfig',
  component: ProviderConfig,
  tags: ['autodocs'],
} satisfies Meta<typeof ProviderConfig>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
