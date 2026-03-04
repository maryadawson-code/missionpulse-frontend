import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SwimlaneBoard } from '@/components/features/swimlane/SwimlaneBoard'

// Mock the server action
vi.mock('@/app/(dashboard)/pipeline/[id]/swimlane/actions', () => ({
  updateSectionStatus: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock toast
vi.mock('@/components/ui/Toast', () => ({
  addToast: vi.fn(),
}))

// Mock SectionCard to keep test focused on SwimlaneBoard layout
vi.mock('@/components/features/swimlane/SectionCard', () => ({
  SectionCard: ({ section }: { section: { id: string; section_title: string } }) => (
    <div data-testid={`card-${section.id}`}>{section.section_title}</div>
  ),
}))

// Mock Select components
vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => <span>All</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const teamMembers = [
  { assignee_name: 'Alice Smith', assignee_email: 'alice@example.com' },
  { assignee_name: 'Bob Jones', assignee_email: 'bob@example.com' },
]

const testSections = [
  { id: 's1', section_title: 'Executive Summary', volume: 'Technical', status: 'draft', due_date: '2026-06-01', writer_id: 'u1', reviewer_id: 'u2', sort_order: 1 },
  { id: 's2', section_title: 'Technical Approach', volume: 'Technical', status: 'draft', due_date: '2026-06-15', writer_id: 'u1', reviewer_id: null, sort_order: 2 },
  { id: 's3', section_title: 'Past Performance', volume: 'Past Performance', status: 'pink_review', due_date: '2026-07-01', writer_id: 'u2', reviewer_id: 'u1', sort_order: 3 },
  { id: 's4', section_title: 'Cost Volume', volume: 'Cost', status: 'green_review', due_date: '2026-07-15', writer_id: 'u1', reviewer_id: 'u2', sort_order: 4 },
  { id: 's5', section_title: 'Staffing Plan', volume: 'Management', status: 'final', due_date: '2026-08-01', writer_id: 'u2', reviewer_id: 'u1', sort_order: 5 },
]

describe('SwimlaneBoard', () => {
  it('renders all 6 columns with correct labels', () => {
    render(
      <SwimlaneBoard
        opportunityId="opp-1"
        sections={testSections}
        teamMembers={teamMembers}
      />
    )
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('Pink Team')).toBeInTheDocument()
    expect(screen.getByText('Revision')).toBeInTheDocument()
    expect(screen.getByText('Green Team')).toBeInTheDocument()
    expect(screen.getByText('Red Team')).toBeInTheDocument()
    expect(screen.getByText('Final')).toBeInTheDocument()
  })

  it('renders section cards in correct columns based on status', () => {
    render(
      <SwimlaneBoard
        opportunityId="opp-1"
        sections={testSections}
        teamMembers={teamMembers}
      />
    )
    // All cards should be present
    expect(screen.getByTestId('card-s1')).toBeInTheDocument()
    expect(screen.getByTestId('card-s2')).toBeInTheDocument()
    expect(screen.getByTestId('card-s3')).toBeInTheDocument()
    expect(screen.getByTestId('card-s4')).toBeInTheDocument()
    expect(screen.getByTestId('card-s5')).toBeInTheDocument()

    // Verify card text matches section titles (use testid for "Past Performance"
    // because the volume filter also renders that string)
    expect(screen.getByText('Executive Summary')).toBeInTheDocument()
    expect(screen.getByText('Technical Approach')).toBeInTheDocument()
    expect(screen.getByTestId('card-s3')).toHaveTextContent('Past Performance')
    expect(screen.getByText('Cost Volume')).toBeInTheDocument()
    expect(screen.getByText('Staffing Plan')).toBeInTheDocument()
  })

  it('shows empty column placeholder when column has no sections', () => {
    render(
      <SwimlaneBoard
        opportunityId="opp-1"
        sections={testSections}
        teamMembers={teamMembers}
      />
    )
    // Revision and Red Team have no sections in testSections
    expect(screen.getByText('No sections in Revision')).toBeInTheDocument()
    expect(screen.getByText('No sections in Red Team')).toBeInTheDocument()
  })

  it('renders with empty sections array (all empty states)', () => {
    render(
      <SwimlaneBoard
        opportunityId="opp-1"
        sections={[]}
        teamMembers={teamMembers}
      />
    )
    // All 6 columns should show empty placeholder
    expect(screen.getByText('No sections in Draft')).toBeInTheDocument()
    expect(screen.getByText('No sections in Pink Team')).toBeInTheDocument()
    expect(screen.getByText('No sections in Revision')).toBeInTheDocument()
    expect(screen.getByText('No sections in Green Team')).toBeInTheDocument()
    expect(screen.getByText('No sections in Red Team')).toBeInTheDocument()
    expect(screen.getByText('No sections in Final')).toBeInTheDocument()
  })

  it('defaults sections without status to draft column', () => {
    const noStatusSections = [
      { id: 's-null', section_title: 'Orphan Section', volume: 'Technical', status: null, due_date: null, writer_id: null, reviewer_id: null, sort_order: null },
    ]
    render(
      <SwimlaneBoard
        opportunityId="opp-1"
        sections={noStatusSections}
        teamMembers={teamMembers}
      />
    )
    // Card should render (placed in draft column via `s.status ?? 'draft'`)
    expect(screen.getByTestId('card-s-null')).toBeInTheDocument()
    expect(screen.getByText('Orphan Section')).toBeInTheDocument()
    // Draft column should NOT show empty placeholder since it has 1 section
    expect(screen.queryByText('No sections in Draft')).not.toBeInTheDocument()
  })

  it('shows column counts matching section distribution', () => {
    render(
      <SwimlaneBoard
        opportunityId="opp-1"
        sections={testSections}
        teamMembers={teamMembers}
      />
    )
    // testSections: draft=2, pink_review=1, revision=0, green_review=1, red_review=0, final=1
    // Column aria-labels include counts
    expect(
      screen.getByLabelText('Draft column, 2 sections')
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Pink Team column, 1 section')
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Revision column, 0 sections')
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Green Team column, 1 section')
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Red Team column, 0 sections')
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Final column, 1 section')
    ).toBeInTheDocument()
  })
})
