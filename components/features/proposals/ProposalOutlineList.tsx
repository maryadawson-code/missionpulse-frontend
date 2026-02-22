'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, Loader2, Trash2, FileText, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import {
  createProposalOutline,
  deleteProposalOutline,
} from '@/app/(dashboard)/proposals/actions'

interface ProposalOutline {
  id: string
  outline_name: string
  volume_type: string | null
  status: string | null
  opportunity_id: string | null
  opportunityTitle: string | null
  created_at: string | null
}

interface OpportunityOption {
  id: string
  title: string
}

interface ProposalOutlineListProps {
  outlines: ProposalOutline[]
  opportunities: OpportunityOption[]
  canEdit: boolean
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-300',
  in_progress: 'bg-blue-500/20 text-blue-300',
  submitted: 'bg-emerald-500/20 text-emerald-300',
  archived: 'bg-amber-500/20 text-amber-300',
}

export function ProposalOutlineList({
  outlines,
  opportunities,
  canEdit,
}: ProposalOutlineListProps) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedOpp, setSelectedOpp] = useState('')
  const [outlineName, setOutlineName] = useState('')
  const [volumeType, setVolumeType] = useState('standard')

  function handleCreate() {
    if (!selectedOpp || !outlineName.trim()) return
    startTransition(async () => {
      const result = await createProposalOutline(
        selectedOpp,
        outlineName.trim(),
        volumeType
      )
      if (result.success) {
        addToast('success', 'Proposal outline created')
        setShowForm(false)
        setOutlineName('')
        setSelectedOpp('')
      } else {
        addToast('error', result.error ?? 'Failed to create')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this proposal outline?')) return
    startTransition(async () => {
      const result = await deleteProposalOutline(id)
      if (result.success) {
        addToast('success', 'Outline deleted')
      } else {
        addToast('error', result.error ?? 'Failed to delete')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Proposal Outlines
        </h2>
        {canEdit && (
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4" />
            New Proposal
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Opportunity
              </label>
              <select
                value={selectedOpp}
                onChange={(e) => setSelectedOpp(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Select opportunity...</option>
                {opportunities.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Outline Name
              </label>
              <input
                type="text"
                value={outlineName}
                onChange={(e) => setOutlineName(e.target.value)}
                placeholder="e.g. DHA EHR Modernization"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Volume Structure
              </label>
              <select
                value={volumeType}
                onChange={(e) => setVolumeType(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="standard">Standard (Tech/Mgmt/PP/Cost)</option>
                <option value="combined">Combined (Tech+Mgmt/PP/Cost)</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={isPending || !selectedOpp || !outlineName.trim()}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Outline
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Outlines List */}
      {outlines.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No proposal outlines yet. Create one to start managing your proposal volumes.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {outlines.map((outline) => (
            <div
              key={outline.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/30 transition-colors"
            >
              <Link
                href={`/proposals/${outline.id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {outline.outline_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {outline.opportunityTitle && (
                      <span className="text-xs text-muted-foreground truncate">
                        {outline.opportunityTitle}
                      </span>
                    )}
                    {outline.volume_type && (
                      <span className="text-[10px] text-muted-foreground">
                        {outline.volume_type}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[outline.status ?? 'draft'] ?? STATUS_COLORS.draft}`}
                >
                  {(outline.status ?? 'draft').replace(/_/g, ' ')}
                </span>
                {canEdit && (
                  <button
                    onClick={() => handleDelete(outline.id)}
                    className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                    title="Delete outline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
