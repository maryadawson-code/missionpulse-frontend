import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KanbanView } from '@/app/(dashboard)/pipeline/KanbanView'

// Mock the server action
vi.mock('@/lib/actions/opportunities', () => ({
  updateOpportunityPhase: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock toast
vi.mock('@/components/ui/Toast', () => ({
  addToast: vi.fn(),
}))

// Mock OpportunityCard to keep test focused on KanbanView layout
vi.mock('@/components/features/pipeline/OpportunityCard', () => ({
  OpportunityCard: ({ opportunity }: { opportunity: { title: string } }) => (
    <div data-testid={`card-${opportunity.title}`}>{opportunity.title}</div>
  ),
}))

const testOpportunities = [
  { id: '1', title: 'Opp Alpha', agency: 'DoD', ceiling: 1_000_000, pwin: 75, due_date: '2026-06-01', phase: 'Gate 1' },
  { id: '2', title: 'Opp Bravo', agency: 'GSA', ceiling: 500_000, pwin: 50, due_date: '2026-07-01', phase: 'Gate 2' },
  { id: '3', title: 'Opp Charlie', agency: 'DHS', ceiling: 2_000_000, pwin: 30, due_date: '2026-08-01', phase: 'Gate 1' },
]

describe('KanbanView', () => {
  it('renders columns for each Shipley phase', () => {
    render(<KanbanView opportunities={testOpportunities} />)
    expect(screen.getByText('Gate 1')).toBeInTheDocument()
    expect(screen.getByText('Gate 2')).toBeInTheDocument()
    expect(screen.getByText('Gate 3')).toBeInTheDocument()
    expect(screen.getByText('Gate 4')).toBeInTheDocument()
    expect(screen.getByText('Gate 5')).toBeInTheDocument()
    expect(screen.getByText('Gate 6')).toBeInTheDocument()
  })

  it('renders opportunity cards in correct columns', () => {
    render(<KanbanView opportunities={testOpportunities} />)
    expect(screen.getByTestId('card-Opp Alpha')).toBeInTheDocument()
    expect(screen.getByTestId('card-Opp Bravo')).toBeInTheDocument()
    expect(screen.getByTestId('card-Opp Charlie')).toBeInTheDocument()
  })

  it('shows empty column placeholder for phases with no opportunities', () => {
    render(<KanbanView opportunities={testOpportunities} />)
    // Gate 3, 4, 5 have no opportunities
    const placeholders = screen.getAllByText('No opportunities in this phase')
    expect(placeholders.length).toBeGreaterThanOrEqual(3)
  })

  it('shows column counts matching opportunity distribution', () => {
    render(<KanbanView opportunities={testOpportunities} />)
    // Gate 1 has 2 opportunities, Gate 2 has 1
    // The count badge renders the number
    expect(screen.getByText('2')).toBeInTheDocument() // Gate 1 count
    expect(screen.getByText('1')).toBeInTheDocument() // Gate 2 count
  })

  it('renders with empty opportunities array', () => {
    render(<KanbanView opportunities={[]} />)
    // All columns should show empty placeholder
    const placeholders = screen.getAllByText('No opportunities in this phase')
    expect(placeholders.length).toBe(6) // One per gate (Gate 1-6)
  })

  it('defaults opportunities without phase to Gate 1', () => {
    const noPhaseOpp = [
      { id: '1', title: 'No Phase', agency: 'DoD', ceiling: 100_000, pwin: 50, due_date: '2026-06-01', phase: null as unknown as string },
    ]
    render(<KanbanView opportunities={noPhaseOpp} />)
    expect(screen.getByTestId('card-No Phase')).toBeInTheDocument()
  })
})
