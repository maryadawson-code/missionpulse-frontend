'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { addToast } from '@/components/ui/Toast'

interface ConfirmModalProps {
  /** Whether modal is open */
  open: boolean
  /** Close handler */
  onOpenChange: (_open: boolean) => void
  /** Modal title */
  title: string
  /** Description/warning message */
  description: string
  /** Confirm button label */
  confirmLabel?: string
  /** Whether the action is destructive (red button styling) */
  destructive?: boolean
  /** Action to perform on confirm */
  onConfirm: () => Promise<{ success: boolean; error?: string }>
  /** Success toast message */
  successMessage?: string
  /** Callback after successful confirm */
  onSuccess?: () => void
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
  onConfirm,
  successMessage = 'Done.',
  onSuccess,
}: ConfirmModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await onConfirm()
      if (result.success) {
        addToast('success', successMessage)
        onOpenChange(false)
        onSuccess?.()
      } else {
        setError(result.error ?? 'An unexpected error occurred.')
        addToast('error', result.error ?? 'An unexpected error occurred.')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className={
              destructive
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : undefined
            }
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
