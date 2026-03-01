import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { MobileNav } from '@/components/layout/MobileNav'

const meta = {
  title: 'Layout/MobileNav',
  component: MobileNav,
  tags: ['autodocs'],
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof MobileNav>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <div className="h-full bg-card p-4">
        <p className="font-semibold text-foreground">Navigation Content</p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>Dashboard</li>
          <li>Pipeline</li>
          <li>Proposals</li>
          <li>Settings</li>
        </ul>
      </div>
    ),
  },
}
