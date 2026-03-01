import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CommentPanel } from '@/components/features/proposals/CommentPanel'

const meta = {
  title: 'Features/CommentPanel',
  component: CommentPanel,
  tags: ['autodocs'],
} satisfies Meta<typeof CommentPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    sectionId: 'section-1',
    userId: 'user-1',
    userName: 'Mary Womack',
  },
}

export const DifferentUser: Story = {
  args: {
    sectionId: 'section-2',
    userId: 'user-2',
    userName: 'Alice Chen',
  },
}
