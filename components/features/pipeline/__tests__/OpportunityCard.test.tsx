import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OpportunityCard } from '@/components/features/pipeline/OpportunityCard'
import { getMockOpportunity } from '@/tests/fixtures'

const fixture = getMockOpportunity('active')
const baseOpportunity = {
  id: fixture.id,
  title: fixture.title,
  agency: fixture.agency,
  ceiling: fixture.ceiling,
  pwin: fixture.pwin,
  due_date: fixture.due_date,
}

describe('OpportunityCard', () => {
  it('renders opportunity title', () => {
    render(<OpportunityCard opportunity={baseOpportunity} />)
    expect(screen.getByText(fixture.title)).toBeInTheDocument()
  })

  it('renders agency when provided', () => {
    render(<OpportunityCard opportunity={baseOpportunity} />)
    expect(screen.getByText(fixture.agency)).toBeInTheDocument()
  })

  it('does not render agency when null', () => {
    render(
      <OpportunityCard
        opportunity={{ ...baseOpportunity, agency: null }}
      />,
    )
    expect(screen.queryByText(fixture.agency)).not.toBeInTheDocument()
  })

  it('formats ceiling as USD currency', () => {
    render(<OpportunityCard opportunity={baseOpportunity} />)
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(fixture.ceiling)
    expect(screen.getByText(formatted)).toBeInTheDocument()
  })

  it('shows dash when ceiling is null', () => {
    render(
      <OpportunityCard
        opportunity={{ ...baseOpportunity, ceiling: null }}
      />,
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows pwin percentage', () => {
    render(<OpportunityCard opportunity={baseOpportunity} />)
    expect(screen.getByText(`${fixture.pwin}%`)).toBeInTheDocument()
  })

  it('applies emerald color for pwin >= 70', () => {
    render(<OpportunityCard opportunity={{ ...baseOpportunity, pwin: 70 }} />)
    const pwinEl = screen.getByText('70%')
    expect(pwinEl.className).toContain('text-emerald-600 dark:text-emerald-400')
  })

  it('applies amber color for pwin >= 40 and < 70', () => {
    render(<OpportunityCard opportunity={{ ...baseOpportunity, pwin: 50 }} />)
    const pwinEl = screen.getByText('50%')
    expect(pwinEl.className).toContain('text-amber-600 dark:text-amber-400')
  })

  it('applies red color for pwin < 40', () => {
    render(<OpportunityCard opportunity={{ ...baseOpportunity, pwin: 20 }} />)
    const pwinEl = screen.getByText('20%')
    expect(pwinEl.className).toContain('text-red-600 dark:text-red-400')
  })

  it('renders due date when provided', () => {
    render(<OpportunityCard opportunity={baseOpportunity} />)
    const expected = new Date(fixture.due_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    expect(
      screen.getByText((_content, el) => {
        return el?.tagName === 'P' && el.textContent === `Due ${expected}`
      }),
    ).toBeInTheDocument()
  })

  it('does not render due date when null', () => {
    render(
      <OpportunityCard
        opportunity={{ ...baseOpportunity, due_date: null }}
      />,
    )
    expect(screen.queryByText(/^Due /)).not.toBeInTheDocument()
  })

  it('links to correct war-room URL', () => {
    render(<OpportunityCard opportunity={baseOpportunity} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', `/war-room/${fixture.id}`)
  })
})
