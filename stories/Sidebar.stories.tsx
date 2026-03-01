import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Sidebar from '@/components/layout/Sidebar'

const meta = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

const fullPermissions = {
  dashboard: { shouldRender: true, canView: true, canEdit: true },
  pipeline: { shouldRender: true, canView: true, canEdit: true },
  proposals: { shouldRender: true, canView: true, canEdit: true },
  pricing: { shouldRender: true, canView: true, canEdit: true },
  strategy: { shouldRender: true, canView: true, canEdit: true },
  blackhat: { shouldRender: true, canView: true, canEdit: true },
  personnel: { shouldRender: true, canView: true, canEdit: true },
  analytics: { shouldRender: true, canView: true, canEdit: true },
  admin: { shouldRender: true, canView: true, canEdit: true },
  integrations: { shouldRender: true, canView: true, canEdit: true },
  compliance: { shouldRender: true, canView: true, canEdit: true },
  settings: { shouldRender: true, canView: true, canEdit: true },
}

const viewOnlyPermissions = {
  dashboard: { shouldRender: true, canView: true, canEdit: false },
  pipeline: { shouldRender: true, canView: true, canEdit: false },
  proposals: { shouldRender: true, canView: true, canEdit: false },
}

export const AdminUser: Story = {
  args: {
    permissions: fullPermissions,
    userDisplayName: 'Mary Womack',
    userRole: 'admin',
    unreadNotifications: 3,
  },
}

export const LimitedAccess: Story = {
  args: {
    permissions: viewOnlyPermissions,
    userDisplayName: 'Partner User',
    userRole: 'partner',
    unreadNotifications: 0,
  },
}

export const NoNotifications: Story = {
  args: {
    permissions: fullPermissions,
    userDisplayName: 'Alice Chen',
    userRole: 'executive',
  },
}
