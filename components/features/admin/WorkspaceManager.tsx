// filepath: components/features/admin/WorkspaceManager.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Workspace {
  id: string
  name: string
  domain: string
  tier: string
}

interface WorkspaceManagerProps {
  currentWorkspace: Workspace
}

export function WorkspaceManager({ currentWorkspace }: WorkspaceManagerProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDomain, setNewDomain] = useState('')

  return (
    <div className="space-y-6">
      {/* Current workspace */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{currentWorkspace.name}</h3>
            <p className="text-sm text-muted-foreground">
              {currentWorkspace.domain || 'No domain configured'} &middot;{' '}
              <span className="capitalize">{currentWorkspace.tier || 'standard'}</span> plan
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
        </div>
      </div>

      {/* Workspace features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-medium">Data Isolation</p>
          <p className="text-xs text-muted-foreground mt-1">
            Each workspace has independent data with Row Level Security (RLS)
            enforcement. No cross-workspace data leakage.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-medium">Shared Users</p>
          <p className="text-xs text-muted-foreground mt-1">
            Users can belong to multiple workspaces with different roles in each.
            Switch workspaces from the profile menu.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-medium">Billing Separation</p>
          <p className="text-xs text-muted-foreground mt-1">
            Token metering and billing are tracked independently per workspace.
            Each workspace has its own subscription tier.
          </p>
        </div>
      </div>

      {/* Create new workspace */}
      {!showCreate ? (
        <Button variant="outline" onClick={() => setShowCreate(true)}>
          Create New Workspace
        </Button>
      ) : (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="font-semibold">New Workspace</h3>
          <div>
            <label className="text-sm font-medium block mb-1">Workspace Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., West Coast Division"
              className="w-full max-w-md rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Domain (optional)</label>
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="e.g., westcoast.example.com"
              className="w-full max-w-md rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button disabled={!newName.trim()}>Create Workspace</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Multi-workspace support enables enterprise organizations to manage separate business
        units, JV partnerships, and subsidiary operations under a single account. Each workspace
        maintains independent opportunities, proposals, compliance data, and AI token allocation.
      </p>
    </div>
  )
}
