'use client'

import { useState, useTransition } from 'react'
import { Loader2, Trash2, UserPlus } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { FormModal, type FormFieldDef } from '@/components/ui/FormModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addToast } from '@/components/ui/Toast'
import {
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
} from '@/app/(dashboard)/pipeline/[id]/team/actions'

const TEAM_ROLES = [
  'Capture Manager',
  'Proposal Manager',
  'Volume Lead',
  'Lead Writer',
  'Writer',
  'Reviewer',
  'Subject Matter Expert',
  'Pricing Analyst',
  'Contracts',
  'Graphics',
  'Production',
  'Partner',
] as const

interface Assignment {
  id: string
  assignee_name: string
  assignee_email: string | null
  role: string
  created_at: string | null
}

interface TeamListProps {
  opportunityId: string
  assignments: Assignment[]
}

const inviteSchema = z.object({
  assignee_name: z.string().trim().min(1, 'Name is required'),
  assignee_email: z.string().trim().email('Valid email is required'),
  role: z.string().trim().min(1, 'Role is required'),
})

type InviteForm = z.infer<typeof inviteSchema>

const inviteFields: FormFieldDef<InviteForm>[] = [
  { name: 'assignee_name', label: 'Full Name', type: 'text', placeholder: 'Jane Smith' },
  { name: 'assignee_email', label: 'Email', type: 'email', placeholder: 'jane@company.com' },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    options: TEAM_ROLES.map((r) => ({ label: r, value: r })),
  },
]

export function TeamList({ opportunityId, assignments }: TeamListProps) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground">No team members yet.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Add First Member
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => (
                <TeamRow
                  key={a.id}
                  assignment={a}
                  opportunityId={opportunityId}
                  onDelete={() => setDeleteTarget(a)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Invite Modal */}
      <FormModal<InviteForm>
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Add Team Member"
        description="Invite a team member to this opportunity."
        schema={inviteSchema}
        fields={inviteFields}
        onSubmit={(data) => addTeamMember(opportunityId, data)}
        successMessage="Team member added."
        submitLabel="Add Member"
      />

      {/* Remove Confirmation */}
      {deleteTarget && (
        <ConfirmModal
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null)
          }}
          title="Remove Team Member"
          description={`Remove ${deleteTarget.assignee_name} from this opportunity? They will lose access to all opportunity data.`}
          confirmLabel="Remove"
          destructive
          onConfirm={() => removeTeamMember(deleteTarget.id, opportunityId)}
          successMessage={`${deleteTarget.assignee_name} removed.`}
          onSuccess={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

function TeamRow({
  assignment,
  opportunityId,
  onDelete,
}: {
  assignment: Assignment
  opportunityId: string
  onDelete: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleRoleChange(newRole: string) {
    startTransition(async () => {
      const res = await updateTeamMemberRole(assignment.id, newRole, opportunityId)
      if (res.success) {
        addToast('success', 'Role updated')
      } else {
        addToast('error', res.error ?? 'Failed to update role')
      }
    })
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{assignment.assignee_name}</TableCell>
      <TableCell className="text-muted-foreground">
        {assignment.assignee_email ?? '—'}
      </TableCell>
      <TableCell>
        <Select
          value={assignment.role}
          onValueChange={handleRoleChange}
          disabled={isPending}
        >
          <SelectTrigger className="h-8 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEAM_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  )
}
