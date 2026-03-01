import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComplianceMatrix } from '../ComplianceMatrix'

// ── Mock server actions ─────────────────────────────────────────

vi.mock(
  '@/app/(dashboard)/pipeline/[id]/compliance/actions',
  () => ({
    updateComplianceStatus: vi.fn(async () => ({ success: true })),
    assignComplianceReviewer: vi.fn(async () => ({ success: true })),
  })
)

// ── Mock Toast ──────────────────────────────────────────────────

vi.mock('@/components/ui/Toast', () => ({
  addToast: vi.fn(),
}))

// ── Test data ───────────────────────────────────────────────────

interface Requirement {
  id: string
  reference: string
  requirement: string
  section: string | null
  priority: string | null
  status: string | null
  assigned_to: string | null
  reviewer: string | null
  notes: string | null
  evidence_links: unknown
  page_reference: string | null
  volume_reference: string | null
  verified_at: string | null
  verified_by: string | null
  created_at: string | null
  updated_at: string | null
}

interface TeamMember {
  assignee_name: string
  assignee_email: string | null
}

function makeRequirement(overrides: Partial<Requirement> = {}): Requirement {
  return {
    id: 'req-1',
    reference: 'L.4.3.1',
    requirement: 'The contractor shall provide quarterly status reports.',
    section: 'Section L',
    priority: 'High',
    status: 'Not Started',
    assigned_to: null,
    reviewer: null,
    notes: null,
    evidence_links: null,
    page_reference: 'p.12',
    volume_reference: 'Vol I',
    verified_at: null,
    verified_by: null,
    created_at: '2026-02-15T00:00:00Z',
    updated_at: '2026-02-15T00:00:00Z',
    ...overrides,
  }
}

const sampleRequirements: Requirement[] = [
  makeRequirement({
    id: 'req-1',
    reference: 'L.4.3.1',
    requirement: 'The contractor shall provide quarterly status reports.',
    priority: 'Critical',
    status: 'Not Started',
  }),
  makeRequirement({
    id: 'req-2',
    reference: 'L.4.3.2',
    requirement: 'The contractor shall maintain CMMC Level 2 certification.',
    section: 'Section M',
    priority: 'High',
    status: 'In Progress',
    assigned_to: 'Jane Doe',
  }),
  makeRequirement({
    id: 'req-3',
    reference: 'L.4.3.3',
    requirement: 'All deliverables shall comply with Section 508.',
    priority: 'Medium',
    status: 'Addressed',
    notes: 'VPAT completed',
  }),
  makeRequirement({
    id: 'req-4',
    reference: 'L.4.3.4',
    requirement: 'Contractor shall provide key personnel resumes.',
    priority: 'Low',
    status: 'Verified',
  }),
]

const sampleTeamMembers: TeamMember[] = [
  { assignee_name: 'Jane Doe', assignee_email: 'jane@example.com' },
  { assignee_name: 'Bob Smith', assignee_email: 'bob@example.com' },
]

// ── Tests ───────────────────────────────────────────────────────

describe('ComplianceMatrix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders table with requirement data', () => {
    render(
      <ComplianceMatrix
        requirements={sampleRequirements}
        teamMembers={sampleTeamMembers}
        opportunityId="opp-1"
      />
    )

    // Column headers present
    expect(screen.getByText('Ref')).toBeInTheDocument()
    expect(screen.getByText('Requirement')).toBeInTheDocument()
    expect(screen.getByText('Section')).toBeInTheDocument()
    expect(screen.getByText('Priority')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Assigned To')).toBeInTheDocument()
    expect(screen.getByText('Evidence')).toBeInTheDocument()

    // Row data present — references
    expect(screen.getByText('L.4.3.1')).toBeInTheDocument()
    expect(screen.getByText('L.4.3.2')).toBeInTheDocument()
    expect(screen.getByText('L.4.3.3')).toBeInTheDocument()
    expect(screen.getByText('L.4.3.4')).toBeInTheDocument()
  })

  it('renders requirement text in rows', () => {
    render(
      <ComplianceMatrix
        requirements={sampleRequirements}
        teamMembers={sampleTeamMembers}
        opportunityId="opp-1"
      />
    )

    expect(
      screen.getByText(
        'The contractor shall provide quarterly status reports.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'The contractor shall maintain CMMC Level 2 certification.'
      )
    ).toBeInTheDocument()
  })

  it('shows empty message when no requirements', () => {
    render(
      <ComplianceMatrix
        requirements={[]}
        teamMembers={sampleTeamMembers}
        opportunityId="opp-1"
      />
    )

    expect(
      screen.getByText(
        'No compliance requirements found. Extract requirements from an RFP document to populate this matrix.'
      )
    ).toBeInTheDocument()
  })

  it('renders CSV export button', () => {
    render(
      <ComplianceMatrix
        requirements={sampleRequirements}
        teamMembers={sampleTeamMembers}
        opportunityId="opp-1"
      />
    )

    const exportButton = screen.getByRole('button', { name: /export csv/i })
    expect(exportButton).toBeInTheDocument()
    expect(exportButton).not.toBeDisabled()
  })

  it('disables CSV export when no requirements', () => {
    render(
      <ComplianceMatrix
        requirements={[]}
        teamMembers={sampleTeamMembers}
        opportunityId="opp-1"
      />
    )

    const exportButton = screen.getByRole('button', { name: /export csv/i })
    expect(exportButton).toBeDisabled()
  })

  it('renders priority with correct color classes', () => {
    render(
      <ComplianceMatrix
        requirements={sampleRequirements}
        teamMembers={sampleTeamMembers}
        opportunityId="opp-1"
      />
    )

    // Critical -> text-red-400
    const criticalEl = screen.getByText('Critical')
    expect(criticalEl.className).toContain('text-red-400')

    // High -> text-amber-400
    const highEl = screen.getByText('High')
    expect(highEl.className).toContain('text-amber-400')

    // Medium -> text-blue-400
    const mediumEl = screen.getByText('Medium')
    expect(mediumEl.className).toContain('text-blue-400')

    // Low -> text-muted-foreground
    const lowEl = screen.getByText('Low')
    expect(lowEl.className).toContain('text-muted-foreground')
  })

  it('renders section data in rows', () => {
    render(
      <ComplianceMatrix
        requirements={sampleRequirements}
        teamMembers={sampleTeamMembers}
        opportunityId="opp-1"
      />
    )

    // Multiple requirements share "Section L" as default, so use getAllByText
    const sectionLElements = screen.getAllByText('Section L')
    expect(sectionLElements.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Section M')).toBeInTheDocument()
  })

  it('renders search input for requirements', () => {
    render(
      <ComplianceMatrix
        requirements={sampleRequirements}
        teamMembers={sampleTeamMembers}
        opportunityId="opp-1"
      />
    )

    expect(
      screen.getByPlaceholderText('Search requirements...')
    ).toBeInTheDocument()
  })

  it('shows evidence/notes when present', () => {
    render(
      <ComplianceMatrix
        requirements={sampleRequirements}
        teamMembers={sampleTeamMembers}
        opportunityId="opp-1"
      />
    )

    expect(screen.getByText('VPAT completed')).toBeInTheDocument()
  })

  it('renders row count in pagination', () => {
    render(
      <ComplianceMatrix
        requirements={sampleRequirements}
        teamMembers={sampleTeamMembers}
        opportunityId="opp-1"
      />
    )

    expect(screen.getByText('4 row(s) total')).toBeInTheDocument()
  })
})
