import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { VersionDiff } from '@/components/features/proposals/VersionDiff'

const meta = {
  title: 'Features/VersionDiff',
  component: VersionDiff,
  tags: ['autodocs'],
} satisfies Meta<typeof VersionDiff>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    documentId: 'doc-1',
    opportunityId: 'opp-1',
  },
}
