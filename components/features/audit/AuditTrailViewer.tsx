'use client'

import { useState, useMemo } from 'react'
import { Download, Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AuditEntry {
  id: string
  action: string
  user_id: string
  user_email: string | null
  user_role: string | null
  table_name: string | null
  record_id: string | null
  metadata: unknown
  created_at: string
}

interface AuditTrailViewerProps {
  entries: AuditEntry[]
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AuditTrailViewer({ entries }: AuditTrailViewerProps) {
  const [filterAction, setFilterAction] = useState<string>('All')
  const [filterUser, setFilterUser] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Derive unique actions and users for filters
  const actions = useMemo(
    () =>
      Array.from(new Set(entries.map((e) => e.action)))
        .sort(),
    [entries]
  )

  const users = useMemo(
    () =>
      Array.from(
        new Set(
          entries
            .map((e) => e.user_email ?? e.user_id.slice(0, 8))
            .filter(Boolean)
        )
      ).sort(),
    [entries]
  )

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchesAction =
        filterAction === 'All' || e.action === filterAction
      const matchesUser =
        filterUser === 'All' ||
        (e.user_email ?? e.user_id.slice(0, 8)) === filterUser
      const matchesSearch =
        !searchTerm ||
        e.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.user_email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.table_name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesDateFrom =
        !dateFrom || e.created_at >= dateFrom
      const matchesDateTo =
        !dateTo || e.created_at.slice(0, 10) <= dateTo
      return matchesAction && matchesUser && matchesSearch && matchesDateFrom && matchesDateTo
    })
  }, [entries, filterAction, filterUser, searchTerm, dateFrom, dateTo])

  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'User',
      'Role',
      'Action',
      'Entity Type',
      'Entity ID',
      'Details',
    ]
    const rows = filtered.map((e) => [
      e.created_at,
      e.user_email ?? e.user_id,
      e.user_role ?? '',
      e.action,
      e.table_name ?? '',
      e.record_id ?? '',
      JSON.stringify(e.metadata ?? {}),
    ])

    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* NIST banner */}
      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-xs text-primary">
          NIST 800-53 AU-9 — Audit records are immutable. No edit or delete
          operations are permitted.
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9 w-48 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Actions</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {formatAction(a)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder="User" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Users</SelectItem>
            {users.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExportCSV}
          className="ml-auto"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Action
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Entity
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    No audit records found
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => {
                  const meta = entry.metadata as Record<string, unknown> | null
                  const detailStr = meta
                    ? Object.entries(meta)
                        .filter(
                          ([k]) =>
                            !['user_id', 'resource_type', 'event_type'].includes(k)
                        )
                        .map(
                          ([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`
                        )
                        .join(', ')
                    : '—'

                  return (
                    <tr
                      key={entry.id}
                      className="transition-colors hover:bg-muted/10"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {formatTimestamp(entry.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {entry.user_email ?? entry.user_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground">
                          {(entry.user_role ?? 'unknown').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {formatAction(entry.action)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {entry.table_name ?? '—'}
                        {entry.record_id && (
                          <span className="ml-1 font-mono">
                            #{entry.record_id.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td
                        className="max-w-xs truncate px-4 py-3 text-xs text-muted-foreground"
                        title={detailStr}
                      >
                        {detailStr}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
