// filepath: components/features/admin/AuditRetentionConfig.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface AuditRetentionConfigProps {
  companyId: string
  currentRetentionDays: number
}

const RETENTION_OPTIONS = [
  { value: 90, label: '90 days' },
  { value: 180, label: '180 days' },
  { value: 365, label: '1 year' },
  { value: 730, label: '2 years' },
  { value: 1095, label: '3 years' },
  { value: 1825, label: '5 years' },
  { value: 2555, label: '7 years (DFARS/NIST recommended)' },
]

export function AuditRetentionConfig({
  companyId,
  currentRetentionDays,
}: AuditRetentionConfigProps) {
  const [retentionDays, setRetentionDays] = useState(currentRetentionDays)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/audit-retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, retentionDays }),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Retention Period</h3>
        <p className="text-sm text-muted-foreground">
          Audit logs are immutable and protected by database triggers. This setting controls
          when archived logs become eligible for automated cleanup.
        </p>
        <div className="space-y-2">
          {RETENTION_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="retention"
                checked={retentionDays === opt.value}
                onChange={() => {
                  setRetentionDays(opt.value)
                  setSaved(false)
                }}
                className="h-4 w-4"
              />
              <span className="text-sm">{opt.label}</span>
              {opt.value === currentRetentionDays && (
                <span className="text-xs text-muted-foreground">(current)</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Current stats */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-3">Audit Log Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Protection</p>
            <p className="font-medium text-green-500">Immutable (DB trigger)</p>
          </div>
          <div>
            <p className="text-muted-foreground">Current Retention</p>
            <p className="font-medium">{currentRetentionDays} days</p>
          </div>
          <div>
            <p className="text-muted-foreground">Compliance</p>
            <p className="font-medium">NIST 800-171 / DFARS</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving || retentionDays === currentRetentionDays}
        >
          {saving ? 'Saving...' : 'Update Retention Policy'}
        </Button>
        {saved && (
          <span className="text-sm text-green-500">Retention policy updated</span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        DFARS 252.204-7012 recommends 7-year retention for CUI-related records.
        Reducing the retention period does not delete existing logs — it only affects
        future automated archival scheduling.
      </p>
    </div>
  )
}
