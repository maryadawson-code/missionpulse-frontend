import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AnalyticsDashboard } from '@/components/features/analytics/AnalyticsDashboard'

const meta = {
  title: 'Analytics/AnalyticsDashboard',
  component: AnalyticsDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof AnalyticsDashboard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    kpis: {
      activeCount: 24,
      pipelineValue: 45000000,
      avgPwin: 58,
      winRate: 42,
      wonCount: 12,
      lostCount: 8,
    },
    pipelineByPhase: [
      { phase: 'Gate 1', value: 12000000, count: 8 },
      { phase: 'Gate 2', value: 10000000, count: 6 },
      { phase: 'Gate 3', value: 8000000, count: 4 },
      { phase: 'Gate 4', value: 6000000, count: 3 },
      { phase: 'Gate 5', value: 5000000, count: 2 },
      { phase: 'Gate 6', value: 4000000, count: 1 },
    ],
    winRateTrend: [
      { date: '2025-10', winRate: 35, wins: 3, losses: 5 },
      { date: '2025-11', winRate: 40, wins: 4, losses: 6 },
      { date: '2025-12', winRate: 38, wins: 3, losses: 5 },
      { date: '2026-01', winRate: 45, wins: 5, losses: 6 },
      { date: '2026-02', winRate: 42, wins: 4, losses: 5 },
    ],
    statusBreakdown: [
      { name: 'Active', value: 18 },
      { name: 'Won', value: 12 },
      { name: 'Lost', value: 8 },
      { name: 'No-Bid', value: 4 },
    ],
    teamWorkload: [
      { name: 'Alice Chen', count: 6 },
      { name: 'Bob Smith', count: 5 },
      { name: 'Carol Davis', count: 4 },
      { name: 'Dan Wilson', count: 3 },
    ],
    complianceHealth: [
      { opportunity: 'DOD Cyber', score: 92 },
      { opportunity: 'VA Health IT', score: 78 },
      { opportunity: 'DHS Border', score: 45 },
      { opportunity: 'DISA Cloud', score: 88 },
    ],
    teamPerformance: [
      { name: 'Alice Chen', activeOpps: 6, avgCycleTimeDays: 45, winRate: 55 },
      { name: 'Bob Smith', activeOpps: 5, avgCycleTimeDays: 52, winRate: 40 },
    ],
    avgCycleTime: 48,
  },
}

export const Empty: Story = {
  args: {
    kpis: {
      activeCount: 0,
      pipelineValue: 0,
      avgPwin: 0,
      winRate: 0,
      wonCount: 0,
      lostCount: 0,
    },
    pipelineByPhase: [],
    winRateTrend: [],
    statusBreakdown: [],
    teamWorkload: [],
    complianceHealth: [],
  },
}
