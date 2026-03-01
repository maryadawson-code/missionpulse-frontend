'use client'

import { useState, useTransition } from 'react'
import {
  Plus,
  Loader2,
  UserX,
  UserCheck,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
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
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { updateUserRole } from '@/lib/actions/admin'
import { parseCSV } from '@/lib/migration/csv-parser'
import {
  inviteUser,
  deactivateUser,
  reactivateUser,
  validateBulkInvite,
  commitBulkInvite,
} from '@/app/(dashboard)/admin/users/actions'

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

interface Invitation {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  created_at: string | null
}

interface UserManagementProps {
  users: UserRow[]
  invitations: Invitation[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function UserManagement({ users, invitations }: UserManagementProps) {
  const [isPending, startTransition] = useTransition()
  const [showInvite, setShowInvite] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<UserRow | null>(null)
  const [filter, setFilter] = useState<string>('all')

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('author')

  // Bulk import state
  const [showBulk, setShowBulk] = useState(false)
  const [bulkStep, setBulkStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [bulkValidation, setBulkValidation] = useState<{
    valid: boolean
    records: { index: number; email: string; fullName: string; role: string; status: string; issues: string[] }[]
    summary: { total: number; valid: number; errors: number; duplicates: number }
  } | null>(null)
  const [bulkRawRows, setBulkRawRows] = useState<{ email: string; full_name: string; role: string }[]>([])

  const filteredUsers =
    filter === 'all'
      ? users
      : users.filter((u) => u.status === filter)

  const handleInvite = () => {
    if (!inviteEmail.trim() || !inviteName.trim()) {
      addToast('error', 'Email and name are required')
      return
    }
    startTransition(async () => {
      const result = await inviteUser({
        email: inviteEmail.trim(),
        fullName: inviteName.trim(),
        role: inviteRole,
      })
      if (result.success) {
        addToast('success', `Invitation sent to ${inviteEmail}`)
        setShowInvite(false)
        setInviteEmail('')
        setInviteName('')
        setInviteRole('author')
      } else {
        addToast('error', result.error ?? 'Failed to send invitation')
      }
    })
  }

  const handleRoleChange = (userId: string, newRole: string) => {
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

  const handleReactivate = (userId: string) => {
    startTransition(async () => {
      const result = await reactivateUser(userId)
      if (result.success) {
        addToast('success', 'User reactivated')
      } else {
        addToast('error', result.error ?? 'Failed to reactivate')
      }
    })
  }

  const handleCSVTemplateDownload = () => {
    const csv = `email,full_name,role\njane.doe@example.com,Jane Doe,capture_manager\njohn.smith@example.com,John Smith,author\nanna.lee@example.com,Anna Lee,proposal_manager\n`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'missionpulse-invite-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleBulkFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const parsed = await parseCSV(text)

    if (parsed.headers.length === 0) {
      addToast('error', 'Could not parse CSV file')
      return
    }

    // Validate required headers
    const normalizedHeaders = parsed.headers.map((h) => h.toLowerCase().trim())
    const hasEmail = normalizedHeaders.includes('email')
    const hasName = normalizedHeaders.includes('full_name')
    const hasRole = normalizedHeaders.includes('role')

    if (!hasEmail || !hasName || !hasRole) {
      const missing = [!hasEmail && 'email', !hasName && 'full_name', !hasRole && 'role'].filter(Boolean)
      addToast('error', `Missing required columns: ${missing.join(', ')}`)
      return
    }

    const rows = parsed.rows.map((row) => ({
      email: row['email'] ?? row['Email'] ?? '',
      full_name: row['full_name'] ?? row['Full_Name'] ?? row['Full Name'] ?? '',
      role: row['role'] ?? row['Role'] ?? '',
    }))

    setBulkRawRows(rows)

    startTransition(async () => {
      const result = await validateBulkInvite(rows)
      setBulkValidation(result)
      setBulkStep('preview')
    })
  }

  const handleBulkCommit = () => {
    startTransition(async () => {
      const result = await commitBulkInvite(bulkRawRows)
      if (result.success) {
        addToast('success', `${result.invited} invitation${result.invited !== 1 ? 's' : ''} sent`)
        setBulkStep('done')
        setBulkValidation(null)
        setBulkRawRows([])
        setShowBulk(false)
      } else {
        addToast('error', result.error ?? 'Failed to import users')
      }
    })
  }

  const handleBulkReset = () => {
    setBulkStep('upload')
    setBulkValidation(null)
    setBulkRawRows([])
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCSVTemplateDownload}
          >
            <Download className="h-4 w-4" />
            CSV Template
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setShowBulk(!showBulk); if (showBulk) handleBulkReset() }}
          >
            <Upload className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button
            size="sm"
            onClick={() => setShowInvite(!showInvite)}
          >
            <Plus className="h-4 w-4" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Invite New User
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Full name"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleInvite}
              disabled={
                isPending || !inviteEmail.trim() || !inviteName.trim()
              }
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Send Invitation
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowInvite(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Bulk import section */}
      {showBulk && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Bulk Import Users</h3>

          {/* Step 1: Upload */}
          {bulkStep === 'upload' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Upload a CSV file with columns: <code className="rounded bg-muted px-1">email</code>,{' '}
                <code className="rounded bg-muted px-1">full_name</code>,{' '}
                <code className="rounded bg-muted px-1">role</code>
              </p>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background p-6 transition-colors hover:border-primary/50">
                <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-foreground">Drop CSV file here or click to browse</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  Use &quot;CSV Template&quot; button for the correct format
                </span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleBulkFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Step 2: Preview */}
          {bulkStep === 'preview' && bulkValidation && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
                  <p className="text-lg font-semibold text-foreground">{bulkValidation.summary.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/10 p-3 text-center">
                  <CheckCircle2 className="mx-auto mb-1 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{bulkValidation.summary.valid}</p>
                  <p className="text-xs text-muted-foreground">Valid</p>
                </div>
                <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-3 text-center">
                  <XCircle className="mx-auto mb-1 h-4 w-4 text-red-600 dark:text-red-400" />
                  <p className="text-lg font-semibold text-red-600 dark:text-red-400">{bulkValidation.summary.errors}</p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
                <div className="rounded-lg border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/10 p-3 text-center">
                  <AlertTriangle className="mx-auto mb-1 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{bulkValidation.summary.duplicates}</p>
                  <p className="text-xs text-muted-foreground">Duplicates</p>
                </div>
              </div>

              {/* Preview table */}
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="border-b border-border bg-muted/30">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Email</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Role</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Issues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {bulkValidation.records.map((record) => (
                        <tr key={record.index}>
                          <td className="px-3 py-2 text-muted-foreground">{record.index + 1}</td>
                          <td className="px-3 py-2">
                            {record.status === 'valid' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                            {record.status === 'duplicate' && <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />}
                            {record.status === 'error' && <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />}
                          </td>
                          <td className="px-3 py-2 text-foreground">{record.email}</td>
                          <td className="px-3 py-2 text-foreground">{record.fullName}</td>
                          <td className="px-3 py-2 text-foreground">{record.role.replace(/_/g, ' ')}</td>
                          <td className="px-3 py-2">
                            {record.issues.length > 0 && (
                              <span className={record.status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}>
                                {record.issues.join(', ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleBulkCommit}
                  disabled={isPending || !bulkValidation.valid}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Import {bulkValidation.summary.valid} User{bulkValidation.summary.valid !== 1 ? 's' : ''}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleBulkReset}>
                  Upload Different File
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowBulk(false); handleBulkReset() }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending invitations */}
      {invitations.filter((i) => i.status === 'pending').length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">
            Pending Invitations
          </h4>
          <div className="space-y-1">
            {invitations
              .filter((i) => i.status === 'pending')
              .map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 text-xs text-muted-foreground"
                >
                  <span className="font-medium text-foreground">
                    {inv.full_name}
                  </span>
                  <span>{inv.email}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5">
                    {inv.role.replace(/_/g, ' ')}
                  </span>
                  <span className="ml-auto">{formatDate(inv.created_at)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* User table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Last Login
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Joined
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="transition-colors hover:bg-muted/10"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {u.full_name ?? 'No name'}
                    </p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === u.id ? (
                      <Select
                        defaultValue={u.role ?? 'partner'}
                        onValueChange={(v) => handleRoleChange(u.id, v)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-7 w-[140px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNABLE_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground">
                        {(u.role ?? 'none').replace(/_/g, ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        u.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {u.status ?? 'unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(u.last_login)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {editingId === u.id ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-primary"
                          onClick={() => setEditingId(u.id)}
                        >
                          Change Role
                        </Button>
                      )}
                      {u.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => setDeactivateTarget(u)}
                          disabled={isPending}
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground hover:text-emerald-600 dark:text-emerald-400"
                          onClick={() => handleReactivate(u.id)}
                          disabled={isPending}
                        >
                          <UserCheck className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deactivate confirm */}
      {deactivateTarget && (
        <ConfirmModal
          open={!!deactivateTarget}
          onOpenChange={(open) => {
            if (!open) setDeactivateTarget(null)
          }}
          title="Deactivate User"
          description={`Deactivate ${deactivateTarget.full_name ?? deactivateTarget.email}? They will lose access immediately.`}
          confirmLabel="Deactivate"
          destructive
          onConfirm={() => deactivateUser(deactivateTarget.id)}
          successMessage="User deactivated."
          onSuccess={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  )
}
