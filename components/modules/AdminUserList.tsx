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
        <p className="text-sm text-gray-400">
          {users.length} user{users.length !== 1 ? 's' : ''} total
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Company
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Joined
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-200">
                      {u.full_name ?? 'No name'}
                    </p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === u.id ? (
                      <select
                        defaultValue={u.role ?? 'partner'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={isPending}
                        className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-200 focus:border-[#00E5FA]/50 focus:outline-none disabled:opacity-50"
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-block rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                        {(u.role ?? 'none').replace(/_/g, ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {u.company ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                        u.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {u.status ?? 'unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === u.id ? (
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingId(u.id)}
                        className="text-xs text-gray-400 hover:text-[#00E5FA] transition-colors"
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
