/**
 * Mock opportunity fixtures in various states.
 *
 * v1.8 Sprint 50 T-50.3
 */

export interface MockOpportunity {
  id: string
  title: string
  agency: string
  ceiling: number
  pwin: number
  due_date: string
  phase: string
  status: string
  owner_id: string
  created_at: string
}

export const mockOpportunities: Record<string, MockOpportunity> = {
  active: {
    id: 'opp-active-001',
    title: 'Cloud Migration Services',
    agency: 'Department of Defense',
    ceiling: 5_000_000,
    pwin: 65,
    due_date: '2026-06-15',
    phase: 'Gate 3',
    status: 'Active',
    owner_id: 'user-capture-001',
    created_at: '2025-12-01T00:00:00Z',
  },
  draft: {
    id: 'opp-draft-001',
    title: 'Cybersecurity Assessment',
    agency: 'DHS',
    ceiling: 1_200_000,
    pwin: 40,
    due_date: '2026-09-01',
    phase: 'Gate 1',
    status: 'Active',
    owner_id: 'user-capture-001',
    created_at: '2026-01-15T00:00:00Z',
  },
  won: {
    id: 'opp-won-001',
    title: 'IT Modernization',
    agency: 'GSA',
    ceiling: 10_000_000,
    pwin: 90,
    due_date: '2025-11-01',
    phase: 'Gate 6',
    status: 'Won',
    owner_id: 'user-exec-001',
    created_at: '2025-06-01T00:00:00Z',
  },
  lost: {
    id: 'opp-lost-001',
    title: 'Data Analytics Platform',
    agency: 'VA',
    ceiling: 3_500_000,
    pwin: 25,
    due_date: '2025-10-01',
    phase: 'Gate 5',
    status: 'Lost',
    owner_id: 'user-capture-001',
    created_at: '2025-04-01T00:00:00Z',
  },
}

/** Get a mock opportunity by state key with optional overrides. */
export function getMockOpportunity(
  state: keyof typeof mockOpportunities,
  overrides?: Partial<MockOpportunity>
): MockOpportunity {
  return { ...mockOpportunities[state], ...overrides }
}

/** Get a list of mock opportunities for pipeline views. */
export function getMockOpportunityList(): MockOpportunity[] {
  return Object.values(mockOpportunities).map((o) => ({ ...o }))
}
