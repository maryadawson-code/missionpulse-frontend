// filepath: components/features/admin/CustomRoleBuilder.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ModuleId } from '@/lib/rbac/config'

interface CustomRoleBuilderProps {
  companyId: string
}

const MODULES: { id: ModuleId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'proposals', label: 'Proposals' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'blackhat', label: 'Competitive Intel' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'workflow_board', label: 'Workflow Board' },
  { id: 'ai_chat', label: 'AI Chat' },
  { id: 'documents', label: 'Documents' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'admin', label: 'Admin' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'audit_log', label: 'Audit Log' },
  { id: 'personnel', label: 'Personnel' },
]

type PermLevel = 'none' | 'view' | 'edit'

export function CustomRoleBuilder({ companyId }: CustomRoleBuilderProps) {
  const [roleName, setRoleName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<Record<ModuleId, PermLevel>>(
    Object.fromEntries(MODULES.map((m) => [m.id, 'none'])) as Record<ModuleId, PermLevel>
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function setPermission(moduleId: ModuleId, level: PermLevel) {
    setPermissions((prev) => ({ ...prev, [moduleId]: level }))
  }

  function setAll(level: PermLevel) {
    setPermissions(
      Object.fromEntries(MODULES.map((m) => [m.id, level])) as Record<ModuleId, PermLevel>
    )
  }

  async function handleSave() {
    if (!roleName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          name: roleName.trim(),
          description: description.trim(),
          permissions,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setRoleName('')
        setDescription('')
        setAll('none')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Role metadata */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Role Details</h3>
        <div>
          <label className="text-sm font-medium block mb-1">Role Name</label>
          <input
            type="text"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="e.g., Proposal Reviewer"
            className="w-full max-w-md rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Read-only access to proposals with edit access to compliance"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Permission matrix */}
      <div className="rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Module Permissions</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAll('none')}>
              Clear All
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAll('view')}>
              All View
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAll('edit')}>
              All Edit
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Module</th>
                <th className="text-center p-3 font-medium w-24">None</th>
                <th className="text-center p-3 font-medium w-24">View</th>
                <th className="text-center p-3 font-medium w-24">Edit</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod) => (
                <tr key={mod.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{mod.label}</td>
                  {(['none', 'view', 'edit'] as PermLevel[]).map((level) => (
                    <td key={level} className="p-3 text-center">
                      <input
                        type="radio"
                        name={`perm-${mod.id}`}
                        checked={permissions[mod.id] === level}
                        onChange={() => setPermission(mod.id, level)}
                        className="h-4 w-4"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving || !roleName.trim()}>
          {saving ? 'Creating...' : 'Create Custom Role'}
        </Button>
        {saved && (
          <span className="text-sm text-green-500">Role created successfully</span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Custom roles supplement the 12 built-in roles. Assign custom roles to users via the
        User Management page. Custom roles follow the same fail-closed RBAC pattern.
      </p>
    </div>
  )
}
