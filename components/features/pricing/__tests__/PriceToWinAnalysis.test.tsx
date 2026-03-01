import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriceToWinAnalysis } from '@/components/features/pricing/PriceToWinAnalysis'

describe('PriceToWinAnalysis', () => {
  it('renders ceiling card when ceiling provided', () => {
    render(<PriceToWinAnalysis ceiling={1_000_000} />)

    expect(
      screen.getByText('Government Ceiling Estimate')
    ).toBeInTheDocument()
    expect(screen.getByText('$1,000,000')).toBeInTheDocument()
  })

  it('does not render ceiling when null', () => {
    render(<PriceToWinAnalysis ceiling={null} />)

    expect(
      screen.queryByText('Government Ceiling Estimate')
    ).not.toBeInTheDocument()
  })

  it('renders 3 default scenarios from ceiling value', () => {
    render(<PriceToWinAnalysis ceiling={1_000_000} />)

    // Scenario labels appear in both the card and the comparison table header
    expect(screen.getAllByText('Aggressive').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Moderate').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Conservative').length).toBeGreaterThanOrEqual(2)

    // Default price points calculated from ceiling:
    // Aggressive: 1_000_000 * 0.85 = 850_000
    // Moderate: 1_000_000 * 0.92 = 920_000
    // Conservative: 1_000_000 * 0.98 = 980_000
    // Each price appears in the scenario card AND in the comparison table row
    expect(screen.getAllByText('$850,000').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('$920,000').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('$980,000').length).toBeGreaterThanOrEqual(1)

    // Default win probabilities: 70%, 55%, 35%
    expect(screen.getAllByText('70%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('55%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('35%').length).toBeGreaterThanOrEqual(1)
  })

  it('shows moderate scenario selected by default', () => {
    render(<PriceToWinAnalysis ceiling={1_000_000} />)

    // The detail box should show the Moderate positioning text by default
    // The h3 renders "{label} Positioning" with two text nodes
    expect(
      screen.getByText((_content, element) =>
        element?.tagName === 'H3' && element?.textContent === 'Moderate Positioning'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Market-competitive — balances competitiveness with profitability'
      )
    ).toBeInTheDocument()
  })

  it('renders custom scenarios when provided', () => {
    const customScenarios = [
      {
        label: 'Low Ball',
        pricePoint: 400_000,
        winProbability: 80,
        positioning: 'Undercut everyone',
      },
      {
        label: 'Sweet Spot',
        pricePoint: 600_000,
        winProbability: 60,
        positioning: 'Best value trade-off',
      },
      {
        label: 'Premium',
        pricePoint: 900_000,
        winProbability: 25,
        positioning: 'High margin play',
      },
    ]

    render(
      <PriceToWinAnalysis ceiling={1_000_000} scenarios={customScenarios} />
    )

    // Labels appear in both the scenario card and comparison table header
    expect(screen.getAllByText('Low Ball').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Sweet Spot').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Premium').length).toBeGreaterThanOrEqual(2)

    expect(screen.getAllByText('$400,000').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('$600,000').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('$900,000').length).toBeGreaterThanOrEqual(1)

    // The second scenario (index 1) is selected by default
    expect(
      screen.getByText((_content, element) =>
        element?.tagName === 'H3' && element?.textContent === 'Sweet Spot Positioning'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Best value trade-off')).toBeInTheDocument()
  })

  it('shows dash for null price and probability', () => {
    render(<PriceToWinAnalysis ceiling={null} />)

    // Without a ceiling, default scenarios have null pricePoint
    // formatCurrency(null) returns '—' (em dash)
    // winProbability is still set (70, 55, 35) even without ceiling,
    // but pricePoint is null, so em dashes appear for price points
    const dashes = screen.getAllByText('—')
    // At least 3 dashes for null price points in scenario cards,
    // plus 3 more in the comparison table Price Point row,
    // plus 3 in the % of Ceiling row
    expect(dashes.length).toBeGreaterThanOrEqual(6)
  })
})
