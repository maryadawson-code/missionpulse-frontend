'use client'

import { useTransition } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Download, Loader2 } from 'lucide-react'

import { DataTable } from '@/components/ui/DataTable'
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
  updateComplianceStatus,
  assignComplianceReviewer,
} from '@/app/(dashboard)/pipeline/[id]/compliance/actions'

const STATUSES = ['Not Started', 'In Progress', 'Addressed', 'Verified'] as const
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const

interface Requirement {
  id: string
  reference: string
  requirement: string
  section: string | null
  priority: string | null
  status: string | null
  assigned_to: string | null
  reviewer: string | null
  notes: string | null
  evidence_links: unknown
  page_reference: string | null
  volume_reference: string | null
  verified_at: string | null
  verified_by: string | null
  created_at: string | null
  updated_at: string | null
}

interface TeamMember {
  assignee_name: string
  assignee_email: string | null
}

interface ComplianceMatrixProps {
  requirements: Requirement[]
  teamMembers: TeamMember[]
  opportunityId: string
}

function exportToCsv(requirements: Requirement[]) {
  const headers = [
    'Reference',
    'Requirement',
    'Section',
    'Priority',
    'Status',
    'Assigned To',
    'Evidence/Notes',
    'Page Ref',
    'Volume Ref',
  ]

  const rows = requirements.map((r) => [
    r.reference,
    `"${(r.requirement ?? '').replace(/"/g, '""')}"`,
    r.section ?? '',
    r.priority ?? '',
    r.status ?? '',
    r.assigned_to ?? '',
    `"${(r.notes ?? '').replace(/"/g, '""')}"`,
    r.page_reference ?? '',
    r.volume_reference ?? '',
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `compliance-matrix-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function ComplianceMatrix({
  requirements,
  teamMembers,
  opportunityId,
}: ComplianceMatrixProps) {
  const columns: ColumnDef<Requirement>[] = [
    {
      accessorKey: 'reference',
      header: 'Ref',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {row.getValue('reference')}
        </span>
      ),
      size: 90,
    },
    {
      accessorKey: 'requirement',
      header: 'Requirement',
      cell: ({ row }) => (
        <p className="max-w-md text-xs leading-relaxed text-foreground line-clamp-2">
          {row.getValue('requirement')}
        </p>
      ),
    },
    {
      accessorKey: 'section',
      header: 'Section',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.getValue('section') ?? '—'}
        </span>
      ),
      size: 110,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const p = row.getValue('priority') as string | null
        const color =
          p === 'Critical'
            ? 'text-red-600 dark:text-red-400'
            : p === 'High'
              ? 'text-amber-600 dark:text-amber-400'
              : p === 'Medium'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-muted-foreground'
        return <span className={`text-xs font-medium ${color}`}>{p ?? 'Medium'}</span>
      },
      size: 80,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusCell
          requirement={row.original}
          opportunityId={opportunityId}
        />
      ),
      size: 150,
    },
    {
      accessorKey: 'assigned_to',
      header: 'Assigned To',
      cell: ({ row }) => (
        <AssigneeCell
          requirement={row.original}
          teamMembers={teamMembers}
          opportunityId={opportunityId}
        />
      ),
      size: 150,
    },
    {
      accessorKey: 'notes',
      header: 'Evidence',
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate text-xs text-muted-foreground">
          {(row.getValue('notes') as string) ?? '—'}
        </span>
      ),
      size: 160,
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToCsv(requirements)}
          disabled={requirements.length === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={requirements}
        searchColumn="requirement"
        searchPlaceholder="Search requirements..."
        filters={[
          {
            columnId: 'status',
            label: 'Status',
            options: STATUSES.map((s) => ({ label: s, value: s })),
          },
          {
            columnId: 'priority',
            label: 'Priority',
            options: PRIORITIES.map((p) => ({ label: p, value: p })),
          },
        ]}
        pageSize={25}
        emptyMessage="No compliance requirements found. Extract requirements from an RFP document to populate this matrix."
      />
    </div>
  )
}

function StatusCell({
  requirement,
  opportunityId,
}: {
  requirement: Requirement
  opportunityId: string
}) {
  const [isPending, startTransition] = useTransition()

  const handleChange = (status: string) => {
    startTransition(async () => {
      const result = await updateComplianceStatus(
        requirement.id,
        status,
        opportunityId
      )
      if (!result.success) {
        addToast('error', result.error ?? 'Failed to update')
      }
    })
  }

  return (
    <Select
      value={requirement.status ?? 'Not Started'}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="h-7 w-[130px] text-xs">
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function AssigneeCell({
  requirement,
  teamMembers,
  opportunityId,
}: {
  requirement: Requirement
  teamMembers: TeamMember[]
  opportunityId: string
}) {
  const [isPending, startTransition] = useTransition()

  const handleChange = (name: string) => {
    startTransition(async () => {
      const result = await assignComplianceReviewer(
        requirement.id,
        name === '__none__' ? null : name,
        opportunityId
      )
      if (!result.success) {
        addToast('error', result.error ?? 'Failed to assign')
      }
    })
  }

  if (teamMembers.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        {requirement.assigned_to ?? '—'}
      </span>
    )
  }

  return (
    <Select
      value={requirement.assigned_to ?? '__none__'}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="h-7 w-[130px] text-xs">
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <SelectValue placeholder="Unassigned" />
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Unassigned</SelectItem>
        {teamMembers.map((tm) => (
          <SelectItem key={tm.assignee_name} value={tm.assignee_name}>
            {tm.assignee_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
