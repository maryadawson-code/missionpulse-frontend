'use client'

import { useState, useTransition } from 'react'
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  Shield,
  FileText,
  Scale,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addToast } from '@/components/ui/Toast'
import {
  approveReviewItem,
  rejectReviewItem,
  requestChanges,
} from '@/app/(dashboard)/proposals/actions'

interface ReviewItem {
  id: string
  type: 'compliance' | 'contract' | 'document'
  title: string
  description: string
  status: string
  opportunityTitle: string | null
  opportunityId: string | null
  updatedAt: string | null
}

interface ReviewQueueProps {
  items: ReviewItem[]
}

const TYPE_ICONS = {
  compliance: Shield,
  contract: Scale,
  document: FileText,
}

const TYPE_COLORS = {
  compliance: 'text-blue-400',
  contract: 'text-amber-400',
  document: 'text-emerald-400',
}

const TYPE_LABELS = {
  compliance: 'Compliance',
  contract: 'Contract',
  document: 'Document',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ReviewQueue({ items }: ReviewQueueProps) {
  const [filterType, setFilterType] = useState<string>('All')

  const filtered =
    filterType === 'All'
      ? items
      : items.filter((i) => i.type === filterType)

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter by type:</span>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-8 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="document">Document</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
          <p className="mt-3 text-sm text-muted-foreground">
            No items pending review. All caught up!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <ReviewItemRow key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewItemRow({ item }: { item: ReviewItem }) {
  const [isPending, startTransition] = useTransition()
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showChangesForm, setShowChangesForm] = useState(false)
  const [reason, setReason] = useState('')
  const Icon = TYPE_ICONS[item.type]

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveReviewItem(item.id, item.type)
      if (result.success) {
        addToast('success', 'Item approved')
      } else {
        addToast('error', result.error ?? 'Failed to approve')
      }
    })
  }

  const handleReject = () => {
    if (!reason.trim()) {
      addToast('error', 'Rejection reason is required')
      return
    }
    startTransition(async () => {
      const result = await rejectReviewItem(item.id, item.type, reason)
      if (result.success) {
        addToast('success', 'Item rejected')
        setShowRejectForm(false)
        setReason('')
      } else {
        addToast('error', result.error ?? 'Failed to reject')
      }
    })
  }

  const handleRequestChanges = () => {
    if (!reason.trim()) {
      addToast('error', 'Feedback is required')
      return
    }
    startTransition(async () => {
      const result = await requestChanges(item.id, item.type, reason)
      if (result.success) {
        addToast('success', 'Changes requested')
        setShowChangesForm(false)
        setReason('')
      } else {
        addToast('error', result.error ?? 'Failed to request changes')
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-start gap-3 px-4 py-3">
        <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${TYPE_COLORS[item.type]}`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-medium uppercase ${TYPE_COLORS[item.type]}`}
            >
              {TYPE_LABELS[item.type]}
            </span>
            {item.opportunityTitle && (
              <span className="text-[10px] text-muted-foreground">
                · {item.opportunityTitle}
              </span>
            )}
            <span className="ml-auto text-[10px] text-muted-foreground">
              {formatDate(item.updatedAt)}
            </span>
          </div>

          <p className="mt-1 text-sm font-medium text-foreground">
            {item.title}
          </p>

          {item.description && item.description !== item.title && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleApprove}
              disabled={isPending}
              className="h-7 text-xs text-emerald-400 hover:text-emerald-300"
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowRejectForm(!showRejectForm)
                setShowChangesForm(false)
              }}
              disabled={isPending}
              className="h-7 text-xs text-red-400 hover:text-red-300"
            >
              <XCircle className="h-3 w-3" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowChangesForm(!showChangesForm)
                setShowRejectForm(false)
              }}
              disabled={isPending}
              className="h-7 text-xs text-amber-400 hover:text-amber-300"
            >
              <MessageSquare className="h-3 w-3" />
              Request Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Reject form */}
      {showRejectForm && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          <p className="text-xs font-medium text-red-400">Rejection Reason</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Why is this being rejected? (required)"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={isPending || !reason.trim()}
              className="h-7 text-xs"
            >
              Confirm Reject
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowRejectForm(false)
                setReason('')
              }}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Request changes form */}
      {showChangesForm && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          <p className="text-xs font-medium text-amber-400">Feedback</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="What changes are needed? (required)"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleRequestChanges}
              disabled={isPending || !reason.trim()}
              className="h-7 text-xs"
            >
              Send Feedback
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowChangesForm(false)
                setReason('')
              }}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
