import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { PilotTable } from '@/components/features/admin/PilotTable'

const meta = {
  title: 'Admin/PilotTable',
  component: PilotTable,
  tags: ['autodocs'],
} satisfies Meta<typeof PilotTable>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
