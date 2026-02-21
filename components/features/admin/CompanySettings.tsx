'use client'

import { useState, useTransition } from 'react'
import { Loader2, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addToast } from '@/components/ui/Toast'
import { updateCompanySettings } from '@/app/(dashboard)/admin/settings/actions'

interface CompanySettingsProps {
  company: {
    id: string
    name: string
    domain: string | null
    primary_color: string | null
    subscription_tier: string | null
  } | null
}

export function CompanySettings({ company }: CompanySettingsProps) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(company?.name ?? '')
  const [domain, setDomain] = useState(company?.domain ?? '')
  const [primaryColor, setPrimaryColor] = useState(
    company?.primary_color ?? '#00E5FA'
  )

  if (!company) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No company profile found. Contact support to set up your organization.
        </p>
      </div>
    )
  }

  const handleSave = () => {
    if (!name.trim()) {
      addToast('error', 'Company name is required')
      return
    }
    startTransition(async () => {
      const result = await updateCompanySettings({
        name: name.trim(),
        domain: domain.trim() || null,
        primary_color: primaryColor || null,
      })
      if (result.success) {
        addToast('success', 'Company settings updated')
      } else {
        addToast('error', result.error ?? 'Failed to update settings')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">
          Company Profile
        </h2>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Company Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 w-full max-w-md rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Domain
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. yourcompany.com"
              className="h-9 w-full max-w-md rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Brand Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-border bg-background"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-9 w-32 rounded-md border border-border bg-background px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending || !name.trim()}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Subscription info (read-only) */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Subscription
        </h2>
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {company.subscription_tier ?? 'Free'}
          </span>
          <span className="text-xs text-muted-foreground">
            Contact support to change your plan
          </span>
        </div>
      </div>
    </div>
  )
}
