// filepath: components/modules/AdminUserList.tsx
'use client'

import { useState, useTransition } from 'react'
import { updateUserRole } from '@/lib/actions/admin'
import { addToast } from '@/components/ui/Toast'

interface UserRow {
  id: string
  full_name: string | null
  email: string
  role: string | null
  company: string | null
  status: string | null
  last_login: string | null
  created_at: string | null
}

const ASSIGNABLE_ROLES = [
  'executive',
  'operations',
  'capture_manager',
  'proposal_manager',
  'volume_lead',
  'pricing_manager',
  'contracts',
  'hr_staffing',
  'author',
  'partner',
  'subcontractor',
  'consultant',
] as const

interface AdminUserListProps {
  users: UserRow[]
}

export function AdminUserList({ users }: AdminUserListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleRoleChange(userId: string, newRole: string) {
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole)
      if (result.success) {
        addToast('success', 'Role updated')
        setEditingId(null)
      } else {
        addToast('error', result.error ?? 'Failed to update role')
      }
    })
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {users.length} user{users.length !== 1 ? 's' : ''} total
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-card/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Company
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Joined
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {u.full_name ?? 'No name'}
                    </p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === u.id ? (
                      <select
                        defaultValue={u.role ?? 'partner'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={isPending}
                        className="rounded border border-border bg-card px-2 py-1 text-xs text-foreground focus:border-primary/50 focus:outline-none disabled:opacity-50"
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {(u.role ?? 'none').replace(/_/g, ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.company ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                        u.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-muted/20 text-muted-foreground'
                      }`}
                    >
                      {u.status ?? 'unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === u.id ? (
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingId(u.id)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        Change Role
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
