import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { RfpUploader } from '@/components/features/shredder/RfpUploader'

const meta = {
  title: 'Features/RfpUploader',
  component: RfpUploader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof RfpUploader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    opportunityId: 'opp-1',
  },
}
