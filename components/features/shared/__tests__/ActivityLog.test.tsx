import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ActivityLog } from '../ActivityLog'

// ── Mock Supabase client ────────────────────────────────────────

const mockQueryResult = { data: [] as unknown[], error: null }

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  then: vi.fn((resolve: (_v: unknown) => void) => resolve(mockQueryResult)),
}

// Make the builder thenable so `await query` resolves to mockQueryResult
Object.defineProperty(mockQueryBuilder, Symbol.toStringTag, {
  get: () => 'Promise',
})
// Override the implicit await by providing a proper thenable
mockQueryBuilder.then = vi.fn((resolve: (_v: unknown) => void) =>
  Promise.resolve(mockQueryResult).then(resolve)
)

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}

const mockSupabase = {
  from: vi.fn(() => mockQueryBuilder),
  channel: vi.fn(() => mockChannel),
  removeChannel: vi.fn(),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

// ── Mock activity utils ─────────────────────────────────────────

vi.mock('@/lib/utils/activity', () => ({
  formatAction: vi.fn((action: string) => `formatted:${action}`),
  timeAgo: vi.fn((ts: string | null) => (ts ? `ago:${ts}` : '')),
  getInitials: vi.fn((name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }),
  groupByDate: vi.fn((items: unknown[]) =>
    items.length > 0 ? [{ label: 'Today', items }] : []
  ),
}))

// ── Test data ───────────────────────────────────────────────────

const sampleEntries = [
  {
    id: 'act-1',
    action: 'create_opportunity',
    timestamp: '2026-03-01T10:00:00Z',
    user_name: 'Jane Doe',
    user_role: 'capture_manager',
    details: { entity_type: 'opportunity', entity_id: 'opp-1' },
  },
  {
    id: 'act-2',
    action: 'update_section_status',
    timestamp: '2026-03-01T09:30:00Z',
    user_name: 'Bob Smith',
    user_role: 'proposal_writer',
    details: { entity_type: 'section', entity_id: 'sec-1' },
  },
]

// ── Tests ───────────────────────────────────────────────────────

describe('ActivityLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: resolve with empty data
    mockQueryResult.data = []
    mockQueryResult.error = null
    mockQueryBuilder.then = vi.fn((resolve: (_v: unknown) => void) =>
      Promise.resolve(mockQueryResult).then(resolve)
    )
  })

  it('shows loading skeleton initially', () => {
    // The query will never resolve during the synchronous render check
    mockQueryBuilder.then = vi.fn(() => new Promise(() => {}))

    const { container } = render(<ActivityLog />)

    const pulseElements = container.querySelectorAll('.animate-pulse')
    // 5 skeleton rows, each with 3 pulse elements (circle + 2 bars) = 15
    expect(pulseElements.length).toBe(15)
  })

  it('renders entries after data loads', async () => {
    mockQueryResult.data = sampleEntries

    render(<ActivityLog />)

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })

    expect(screen.getByText('Bob Smith')).toBeInTheDocument()
    expect(screen.getByText('formatted:create_opportunity')).toBeInTheDocument()
    expect(screen.getByText('formatted:update_section_status')).toBeInTheDocument()
  })

  it('shows empty state when no entries', async () => {
    mockQueryResult.data = []

    render(<ActivityLog />)

    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument()
    })
  })

  it('displays user initials in avatar', async () => {
    mockQueryResult.data = sampleEntries

    render(<ActivityLog />)

    await waitFor(() => {
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    expect(screen.getByText('BS')).toBeInTheDocument()
  })

  it('shows formatted action text', async () => {
    mockQueryResult.data = [sampleEntries[0]]

    render(<ActivityLog />)

    await waitFor(() => {
      expect(
        screen.getByText('formatted:create_opportunity')
      ).toBeInTheDocument()
    })
  })

  it('renders date group labels', async () => {
    mockQueryResult.data = sampleEntries

    render(<ActivityLog />)

    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument()
    })
  })

  it('shows timeAgo for each entry', async () => {
    mockQueryResult.data = [sampleEntries[0]]

    render(<ActivityLog />)

    await waitFor(() => {
      expect(
        screen.getByText('ago:2026-03-01T10:00:00Z')
      ).toBeInTheDocument()
    })
  })

  it('passes entityId and entityType filters to query', async () => {
    mockQueryResult.data = []

    render(<ActivityLog entityId="opp-123" entityType="opportunity" />)

    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument()
    })

    expect(mockQueryBuilder.contains).toHaveBeenCalledWith('details', {
      entity_type: 'opportunity',
      entity_id: 'opp-123',
    })
  })

  it('applies limit to query', async () => {
    mockQueryResult.data = []

    render(<ActivityLog limit={10} />)

    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument()
    })

    expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10)
  })

  it('subscribes to realtime channel when realtime=true', async () => {
    mockQueryResult.data = []

    render(<ActivityLog realtime />)

    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument()
    })

    expect(mockSupabase.channel).toHaveBeenCalledWith('activity_log_changes')
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'activity_log' },
      expect.any(Function)
    )
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })
})
