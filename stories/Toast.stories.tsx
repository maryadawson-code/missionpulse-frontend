import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ToastContainer, addToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/button'

function ToastDemo() {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button onClick={() => addToast('success', 'Opportunity saved successfully')}>
          Success Toast
        </Button>
        <Button variant="destructive" onClick={() => addToast('error', 'Failed to save opportunity')}>
          Error Toast
        </Button>
        <Button variant="outline" onClick={() => addToast('info', 'Changes have been queued')}>
          Info Toast
        </Button>
      </div>
      <ToastContainer />
    </div>
  )
}

const meta = {
  title: 'UI/Toast',
  component: ToastDemo,
  tags: ['autodocs'],
} satisfies Meta<typeof ToastDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
