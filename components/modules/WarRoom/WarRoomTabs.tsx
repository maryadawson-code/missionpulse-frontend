// filepath: components/modules/WarRoom/WarRoomTabs.tsx
'use client'

import { useState } from 'react'
import { CUIBanner } from '@/components/rbac/CUIBanner'
import type { Opportunity, Profile } from '@/lib/types/opportunities'

type TabKey = 'overview' | 'strategy' | 'team' | 'timeline'

interface WarRoomTabsProps {
  opportunity: Opportunity
  assignments: Array<{
    id: string
    role: string | null
    profile: Pick<Profile, 'id' | 'full_name' | 'email' | 'role'> | null
  }>
  canAccessSensitive: boolean
}

const TABS: Array<{ key: TabKey; label: string; sensitive: boolean }> = [
  { key: 'overview', label: 'Overview', sensitive: false },
  { key: 'strategy', label: 'Strategy', sensitive: true },
  { key: 'team', label: 'Team', sensitive: false },
  { key: 'timeline', label: 'Timeline', sensitive: false },
]

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—'
  const num = typeof value === 'string' ? Number(value) : value
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num)
}

function OverviewTab({ opp }: { opp: Opportunity }) {
  const fields = [
    { label: 'Agency', value: opp.agency },
    { label: 'Sub-Agency', value: opp.sub_agency },
    { label: 'Contract Value', value: formatCurrency(opp.ceiling) },
    { label: 'Shipley Phase', value: opp.phase },
    { label: 'Status', value: opp.status },
    { label: 'Priority', value: opp.priority },
    { label: 'Set-Aside', value: opp.set_aside },
    { label: 'Contract Vehicle', value: opp.contract_vehicle },
    { label: 'NAICS', value: opp.naics_code },
    { label: 'Period of Performance', value: opp.period_of_performance },
    { label: 'Place of Performance', value: opp.place_of_performance },
    { label: 'Due Date', value: formatDate(opp.due_date) },
    { label: 'Incumbent', value: opp.incumbent },
    { label: 'Solicitation #', value: opp.solicitation_number },
    { label: 'Recompete', value: opp.is_recompete ? 'Yes' : 'No' },
  ]

  return (
    <div className="space-y-6">
      {opp.description && (
        <div>
          <h3 className="text-sm font-medium text-slate mb-2">Description</h3>
          <p className="text-sm text-foreground leading-relaxed">{opp.description}</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs font-medium text-slate">{label}</dt>
            <dd className="text-sm text-foreground mt-0.5">{value ?? '—'}</dd>
          </div>
        ))}
      </div>
      {(opp.contact_name || opp.contact_email) && (
        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-medium text-slate mb-2">
            Primary Contact
          </h3>
          <p className="text-sm text-foreground">
            {opp.contact_name ?? '—'}
            {opp.contact_email && (
              <span className="text-slate ml-2">({opp.contact_email})</span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

function StrategyTab({
  opp,
  canAccessSensitive,
}: {
  opp: Opportunity
  canAccessSensitive: boolean
}) {
  if (!canAccessSensitive) {
    // Invisible RBAC — don't render sensitive content
    return null
  }

  return (
    <div className="space-y-4">
      <CUIBanner marking="OPSEC" />
      <div className="rounded-lg border border-border bg-navy p-6">
        <h3 className="text-sm font-medium text-foreground mb-3">
          Capture Strategy
        </h3>
        <p className="text-sm text-slate">
          Strategy details will be populated from the AI Strategy Agent and
          manual capture inputs. Go/No-Go decision:{' '}
          <span className="font-medium text-foreground">
            {opp.go_no_go ?? 'Pending'}
          </span>
        </p>
        {opp.notes && (
          <div className="mt-4 border-t border-border pt-4">
            <h4 className="text-xs font-medium text-slate mb-1">Notes</h4>
            <p className="text-sm text-foreground whitespace-pre-wrap">{opp.notes}</p>
          </div>
        )}
      </div>
      <p className="text-xs text-slate italic">
        AI GENERATED — REQUIRES HUMAN REVIEW
      </p>
    </div>
  )
}

function TeamTab({
  assignments,
}: {
  assignments: WarRoomTabsProps['assignments']
}) {
  if (assignments.length === 0) {
    return (
      <p className="text-sm text-slate">
        No team members assigned. Use the assignment panel to add team members.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {assignments.map((a) => (
        <div
          key={a.id}
          className="flex items-center justify-between rounded-md border border-border bg-navy px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-foreground">
              {a.profile?.full_name ?? a.profile?.email ?? 'Unknown'}
            </p>
            <p className="text-xs text-slate">{a.profile?.role ?? '—'}</p>
          </div>
          <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-slate">
            {a.role ?? 'Member'}
          </span>
        </div>
      ))}
    </div>
  )
}

function TimelineTab({ opp }: { opp: Opportunity }) {
  const events = [
    { label: 'Created', date: opp.created_at, done: true },
    { label: 'Due Date', date: opp.due_date, done: false },
    { label: 'Submission', date: opp.submission_date, done: false },
    { label: 'Award', date: opp.award_date, done: false },
    { label: 'PoP Start', date: opp.pop_start, done: false },
    { label: 'PoP End', date: opp.pop_end, done: false },
  ].filter((e) => e.date)

  if (events.length === 0) {
    return (
      <p className="text-sm text-slate">No timeline events configured.</p>
    )
  }

  return (
    <div className="relative space-y-0">
      {events.map((event, idx) => (
        <div key={event.label} className="flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div
              className={`h-3 w-3 rounded-full border-2 ${
                event.done
                  ? 'border-cyan bg-cyan'
                  : 'border-border bg-navy'
              }`}
            />
            {idx < events.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1" />
            )}
          </div>
          <div className="pb-2">
            <p className="text-sm font-medium text-foreground">{event.label}</p>
            <p className="text-xs text-slate">{formatDate(event.date)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function WarRoomTabs({
  opportunity,
  assignments,
  canAccessSensitive,
}: WarRoomTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  // Filter tabs based on RBAC — invisible RBAC pattern
  const visibleTabs = TABS.filter(
    (tab) => !tab.sensitive || canAccessSensitive
  )

  return (
    <div>
      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border mb-6">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-cyan text-foreground'
                : 'border-transparent text-slate hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && <OverviewTab opp={opportunity} />}
        {activeTab === 'strategy' && (
          <StrategyTab
            opp={opportunity}
            canAccessSensitive={canAccessSensitive}
          />
        )}
        {activeTab === 'team' && <TeamTab assignments={assignments} />}
        {activeTab === 'timeline' && <TimelineTab opp={opportunity} />}
      </div>
    </div>
  )
}
