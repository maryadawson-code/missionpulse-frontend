import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RBACGate } from '../RBACGate'

// Mock useRole to control role state in tests
const mockUseRole = vi.fn()

vi.mock('@/lib/rbac/hooks', () => ({
  useRole: () => mockUseRole(),
}))

describe('RBACGate', () => {
  beforeEach(() => {
    mockUseRole.mockReset()
  })

  it('renders children when user has view permission (executive + dashboard)', () => {
    mockUseRole.mockReturnValue({ dbRole: 'executive', loading: false })
    render(
      <RBACGate moduleId="dashboard" require="view">
        <div data-testid="protected">Secret Content</div>
      </RBACGate>
    )
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })

  it('renders nothing when user lacks permission (partner + admin)', () => {
    mockUseRole.mockReturnValue({ dbRole: 'partner', loading: false })
    const { container } = render(
      <RBACGate moduleId="admin" require="edit">
        <div data-testid="protected">Admin Panel</div>
      </RBACGate>
    )
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
    expect(container.innerHTML).toBe('')
  })

  it('renders fallback while loading', () => {
    mockUseRole.mockReturnValue({ dbRole: null, loading: true })
    render(
      <RBACGate moduleId="dashboard" fallback={<div data-testid="loading">Loading...</div>}>
        <div data-testid="protected">Content</div>
      </RBACGate>
    )
    expect(screen.getByTestId('loading')).toBeInTheDocument()
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
  })

  it('renders nothing when loading and no fallback provided', () => {
    mockUseRole.mockReturnValue({ dbRole: null, loading: true })
    const { container } = render(
      <RBACGate moduleId="dashboard">
        <div data-testid="protected">Content</div>
      </RBACGate>
    )
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when dbRole is null (no user)', () => {
    mockUseRole.mockReturnValue({ dbRole: null, loading: false })
    const { container } = render(
      <RBACGate moduleId="dashboard">
        <div data-testid="protected">Content</div>
      </RBACGate>
    )
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
    expect(container.innerHTML).toBe('')
  })

  it('defaults require to "view"', () => {
    mockUseRole.mockReturnValue({ dbRole: 'executive', loading: false })
    render(
      <RBACGate moduleId="dashboard">
        <div data-testid="protected">Content</div>
      </RBACGate>
    )
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })

  it('require="render" allows access with shouldRender only', () => {
    // Partner can render proposals (shouldRender=true)
    mockUseRole.mockReturnValue({ dbRole: 'partner', loading: false })
    render(
      <RBACGate moduleId="proposals" require="render">
        <div data-testid="protected">Proposals</div>
      </RBACGate>
    )
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })

  it('require="edit" blocks view-only users', () => {
    // Author can view proposals but might not be able to edit admin
    mockUseRole.mockReturnValue({ dbRole: 'author', loading: false })
    const { container } = render(
      <RBACGate moduleId="admin" require="edit">
        <div data-testid="protected">Admin Edit</div>
      </RBACGate>
    )
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
  })
})
