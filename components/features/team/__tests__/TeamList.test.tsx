import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TeamList } from '@/components/features/team/TeamList'

// Mock server actions
vi.mock('@/app/(dashboard)/pipeline/[id]/team/actions', () => ({
  addTeamMember: vi.fn().mockResolvedValue({ success: true }),
  removeTeamMember: vi.fn().mockResolvedValue({ success: true }),
  updateTeamMemberRole: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock toast
vi.mock('@/components/ui/Toast', () => ({
  addToast: vi.fn(),
}))

// Mock FormModal — render a simple div so it doesn't interfere
vi.mock('@/components/ui/FormModal', () => ({
  FormModal: () => <div data-testid="form-modal" />,
}))

// Mock ConfirmModal
vi.mock('@/components/ui/ConfirmModal', () => ({
  ConfirmModal: () => <div data-testid="confirm-modal" />,
}))

// Mock Select components (shadcn radix primitives don't render in jsdom)
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value }: { children: React.ReactNode; value?: string }) => (
    <div data-testid="select">{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => <span>Role</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

interface Assignment {
  id: string
  assignee_name: string
  assignee_email: string | null
  role: string
  created_at: string | null
}

const mockAssignments: Assignment[] = [
  {
    id: 'a1',
    assignee_name: 'Alice Johnson',
    assignee_email: 'alice@example.com',
    role: 'Capture Manager',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'a2',
    assignee_name: 'Bob Williams',
    assignee_email: null,
    role: 'Volume Lead',
    created_at: '2026-01-16T14:30:00Z',
  },
  {
    id: 'a3',
    assignee_name: 'Carol Davis',
    assignee_email: 'carol@example.com',
    role: 'Reviewer',
    created_at: null,
  },
]

describe('TeamList', () => {
  it('renders empty state when no assignments', () => {
    render(<TeamList opportunityId="opp-1" assignments={[]} />)

    expect(screen.getByText('No team members yet.')).toBeInTheDocument()
    expect(screen.getByText('Add First Member')).toBeInTheDocument()
  })

  it('renders table rows for each assignment', () => {
    render(<TeamList opportunityId="opp-1" assignments={mockAssignments} />)

    // Each assignment name should appear as a table row
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.getByText('Bob Williams')).toBeInTheDocument()
    expect(screen.getByText('Carol Davis')).toBeInTheDocument()
  })

  it('displays member name and email', () => {
    render(<TeamList opportunityId="opp-1" assignments={mockAssignments} />)

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()

    expect(screen.getByText('Carol Davis')).toBeInTheDocument()
    expect(screen.getByText('carol@example.com')).toBeInTheDocument()
  })

  it('shows em-dash for null email', () => {
    render(<TeamList opportunityId="opp-1" assignments={mockAssignments} />)

    // Bob Williams has null email, component renders em-dash (U+2014)
    expect(screen.getByText('\u2014')).toBeInTheDocument()
  })

  it('renders Add Member button', () => {
    render(<TeamList opportunityId="opp-1" assignments={mockAssignments} />)

    expect(screen.getByText('Add Member')).toBeInTheDocument()
  })

  it('shows correct number of team members', () => {
    render(<TeamList opportunityId="opp-1" assignments={mockAssignments} />)

    // There should be exactly 3 rows (one per assignment)
    const rows = screen.getAllByRole('row')
    // 1 header row + 3 data rows = 4 total
    expect(rows).toHaveLength(4)
  })
})
