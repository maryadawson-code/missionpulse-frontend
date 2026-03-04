import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { UserManagement } from '@/components/features/admin/UserManagement'

const meta = {
  title: 'Admin/UserManagement',
  component: UserManagement,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof UserManagement>

export default meta
type Story = StoryObj<typeof meta>

const sampleUsers = [
  { id: 'u1', full_name: 'Mary Womack', email: 'mary@missionmeetstech.com', role: 'executive', company: 'Mission Meets Tech', status: 'active', last_login: '2026-03-01T10:00:00Z', created_at: '2025-06-15' },
  { id: 'u2', full_name: 'Alice Chen', email: 'alice@example.com', role: 'capture_manager', company: 'Mission Meets Tech', status: 'active', last_login: '2026-02-28T14:00:00Z', created_at: '2025-08-01' },
  { id: 'u3', full_name: 'Bob Smith', email: 'bob@partner.com', role: 'partner', company: 'Partner LLC', status: 'active', last_login: '2026-02-25T09:00:00Z', created_at: '2025-09-01' },
  { id: 'u4', full_name: 'Carol Davis', email: 'carol@example.com', role: 'author', company: 'Mission Meets Tech', status: 'inactive', last_login: null, created_at: '2025-10-01' },
]

const sampleInvitations = [
  { id: 'inv1', email: 'new.user@example.com', full_name: 'New User', role: 'author', status: 'pending', created_at: '2026-02-20' },
]

export const Default: Story = {
  args: {
    users: sampleUsers,
    invitations: sampleInvitations,
  },
}

export const NoInvitations: Story = {
  args: {
    users: sampleUsers,
    invitations: [],
  },
}

export const Empty: Story = {
  args: {
    users: [],
    invitations: [],
  },
}
