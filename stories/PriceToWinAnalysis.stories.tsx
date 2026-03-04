import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { PriceToWinAnalysis } from '@/components/features/pricing/PriceToWinAnalysis'

const meta = {
  title: 'Features/PriceToWinAnalysis',
  component: PriceToWinAnalysis,
  tags: ['autodocs'],
} satisfies Meta<typeof PriceToWinAnalysis>

export default meta
type Story = StoryObj<typeof meta>

export const WithCeiling: Story = {
  args: {
    ceiling: 5000000,
  },
}

export const WithScenarios: Story = {
  args: {
    ceiling: 5000000,
    scenarios: [
      { label: 'Aggressive', pricePoint: 3800000, winProbability: 75, positioning: 'Below market — maximizes price score' },
      { label: 'Moderate', pricePoint: 4200000, winProbability: 60, positioning: 'Market-competitive — balanced approach' },
      { label: 'Conservative', pricePoint: 4800000, winProbability: 35, positioning: 'Above market — preserves margins' },
    ],
  },
}

export const NoCeiling: Story = {
  args: {
    ceiling: null,
  },
}
