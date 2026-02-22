'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteOpportunity } from '@/lib/actions/opportunities'
import { addToast } from '@/components/ui/Toast'

interface DangerZoneProps {
  opportunityId: string
  opportunityTitle: string
}

export function DangerZone({ opportunityId, opportunityTitle }: DangerZoneProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteOpportunity(opportunityId)
      if (result.success) {
        addToast('success', 'Opportunity deleted')
        router.push('/pipeline')
      } else {
        addToast('error', result.error ?? 'Failed to delete')
      }
      setConfirmOpen(false)
      setConfirmText('')
    })
  }

  return (
    <div className="rounded-xl border border-red-900/50 bg-red-950/10 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-red-400">
        Danger Zone
      </h2>
      <p className="mt-2 text-sm text-gray-400">
        Irreversible actions. Proceed with caution.
      </p>

      <div className="mt-4">
        {!confirmOpen ? (
          <button
            onClick={() => setConfirmOpen(true)}
            className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/50 hover:text-red-300"
          >
            Delete Opportunity
          </button>
        ) : (
          <div className="space-y-3 rounded-lg border border-red-800 bg-red-950/30 p-4">
            <p className="text-sm text-red-300">
              This will permanently delete <strong>&quot;{opportunityTitle}&quot;</strong> and all
              associated sections, documents, and assignments.
            </p>
            <p className="text-xs text-gray-400">
              Type <strong>delete</strong> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-md border border-red-800 bg-red-950/50 px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-red-600"
              placeholder="delete"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={confirmText !== 'delete' || isPending}
                className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => {
                  setConfirmOpen(false)
                  setConfirmText('')
                }}
                className="rounded-md px-4 py-1.5 text-sm text-gray-400 transition-colors hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
