import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import DashboardHeader from '@/components/layout/DashboardHeader'

const meta = {
  title: 'Layout/DashboardHeader',
  component: DashboardHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof DashboardHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    userEmail: 'mary@missionmeetstech.com',
    notifications: [
      { id: '1', title: 'Proposal deadline approaching', message: 'DOD Cyber bid due in 3 days', notification_type: 'deadline', priority: 'high', is_read: false, link_url: '/pipeline/opp-1', link_text: 'View', created_at: '2026-03-01T10:00:00Z' },
      { id: '2', title: 'New team member added', message: 'Carol Davis joined Cloud Migration', notification_type: 'assignment', priority: null, is_read: true, link_url: null, link_text: null, created_at: '2026-02-28T14:30:00Z' },
    ],
  },
}

export const NoNotifications: Story = {
  args: {
    userEmail: 'alice@example.com',
    notifications: [],
  },
}

export const NoEmail: Story = {
  args: {
    userEmail: null,
  },
}
