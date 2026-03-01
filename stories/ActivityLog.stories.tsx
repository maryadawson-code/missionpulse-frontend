import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ActivityLog } from '@/components/features/shared/ActivityLog'

const meta = {
  title: 'Features/ActivityLog',
  component: ActivityLog,
  tags: ['autodocs'],
  argTypes: {
    entityType: {
      control: 'select',
      options: ['opportunity', 'section', 'compliance', undefined],
    },
    limit: { control: 'number' },
    realtime: { control: 'boolean' },
  },
} satisfies Meta<typeof ActivityLog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    limit: 10,
    realtime: false,
  },
}

export const WithEntityFilter: Story = {
  args: {
    entityType: 'opportunity',
    limit: 5,
    realtime: false,
  },
}
