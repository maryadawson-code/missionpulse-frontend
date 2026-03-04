import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SectionMetrics } from '@/components/features/proposals/SectionMetrics'

const meta = {
  title: 'Features/SectionMetrics',
  component: SectionMetrics,
  tags: ['autodocs'],
} satisfies Meta<typeof SectionMetrics>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    content: 'The contractor shall provide comprehensive cybersecurity services including 24/7 monitoring, incident response, and vulnerability management. Our team brings over 15 years of experience supporting DoD networks with proven methodologies aligned to NIST 800-171 and CMMC Level 2 requirements.',
    currentPages: 3,
    pageLimit: 10,
  },
}

export const NearLimit: Story = {
  args: {
    content: 'A'.repeat(5000),
    currentPages: 9,
    pageLimit: 10,
  },
}

export const OverLimit: Story = {
  args: {
    content: 'A'.repeat(10000),
    currentPages: 12,
    pageLimit: 10,
  },
}

export const NoLimits: Story = {
  args: {
    content: 'Short section content.',
    currentPages: null,
    pageLimit: null,
  },
}
