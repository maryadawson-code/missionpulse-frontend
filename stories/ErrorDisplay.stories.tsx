import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'

const meta = {
  title: 'UI/ErrorDisplay',
  component: ErrorDisplay,
  tags: ['autodocs'],
  argTypes: {
    context: { control: 'text' },
  },
} satisfies Meta<typeof ErrorDisplay>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    error: Object.assign(new Error('Something went wrong'), { digest: 'abc123' }),
    reset: () => alert('Reset clicked'),
    context: 'loading dashboard',
  },
}

export const WithoutContext: Story = {
  args: {
    error: new Error('Database connection failed'),
    reset: () => alert('Reset clicked'),
  },
}
