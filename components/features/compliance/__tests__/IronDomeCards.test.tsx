import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IronDomeCards } from '@/components/features/compliance/IronDomeCards'

const defaultProps = {
  totalReqs: 142,
  totalAddressed: 118,
  totalVerified: 95,
  overallPct: 83,
  gapCount: 7,
  activeOpps: 4,
}

describe('IronDomeCards', () => {
  it('renders all 6 metrics with correct values', () => {
    render(<IronDomeCards {...defaultProps} />)

    expect(screen.getByText('Overall Health')).toBeInTheDocument()
    expect(screen.getByText('83%')).toBeInTheDocument()

    expect(screen.getByText('Total Requirements')).toBeInTheDocument()
    expect(screen.getByText('142')).toBeInTheDocument()

    expect(screen.getByText('Addressed')).toBeInTheDocument()
    expect(screen.getByText('118')).toBeInTheDocument()

    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByText('95')).toBeInTheDocument()

    expect(screen.getByText('Gaps')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()

    expect(screen.getByText('Active Pursuits')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('overall health shows emerald for >=80%', () => {
    const { container } = render(
      <IronDomeCards {...defaultProps} overallPct={85} />
    )

    // The value element for Overall Health is the <p> with the percentage text
    const valueEl = screen.getByText('85%')
    expect(valueEl.className).toContain('text-emerald-600 dark:text-emerald-400')

    // The icon (svg) in the same card should also use emerald
    const cards = container.querySelectorAll('.rounded-lg.border')
    const healthCard = cards[0] // Overall Health is the first card
    const icon = healthCard.querySelector('svg')
    expect(icon?.className.baseVal || icon?.getAttribute('class')).toContain(
      'text-emerald-600 dark:text-emerald-400'
    )
  })

  it('overall health shows amber for 50-79%', () => {
    const { container } = render(
      <IronDomeCards {...defaultProps} overallPct={65} />
    )

    const valueEl = screen.getByText('65%')
    expect(valueEl.className).toContain('text-amber-600 dark:text-amber-400')

    const cards = container.querySelectorAll('.rounded-lg.border')
    const healthCard = cards[0]
    const icon = healthCard.querySelector('svg')
    expect(icon?.className.baseVal || icon?.getAttribute('class')).toContain(
      'text-amber-600 dark:text-amber-400'
    )
  })

  it('overall health shows red for <50%', () => {
    const { container } = render(
      <IronDomeCards {...defaultProps} overallPct={30} />
    )

    const valueEl = screen.getByText('30%')
    expect(valueEl.className).toContain('text-red-600 dark:text-red-400')

    const cards = container.querySelectorAll('.rounded-lg.border')
    const healthCard = cards[0]
    const icon = healthCard.querySelector('svg')
    expect(icon?.className.baseVal || icon?.getAttribute('class')).toContain(
      'text-red-600 dark:text-red-400'
    )
  })

  it('gap count shows amber styling when gaps > 0', () => {
    const { container } = render(
      <IronDomeCards {...defaultProps} gapCount={3} />
    )

    // Gaps card is the 5th card (index 4)
    const cards = container.querySelectorAll('.rounded-lg.border')
    const gapCard = cards[4]

    // The value text should have amber class
    const gapValue = gapCard.querySelector('p.mt-2')
    expect(gapValue?.className).toContain('text-amber-600 dark:text-amber-400')

    // The icon should also have amber class
    const icon = gapCard.querySelector('svg')
    expect(icon?.className.baseVal || icon?.getAttribute('class')).toContain(
      'text-amber-600 dark:text-amber-400'
    )
  })
})
