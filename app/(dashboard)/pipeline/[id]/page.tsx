// filepath: app/(dashboard)/pipeline/[id]/page.tsx

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRolePermissions, resolveRole, hasPermission, getAllowedAgents } from '@/lib/rbac/config'
import {
  formatCurrency,
  formatPwin,
  formatDate,
  formatRelativeDate,
  pwinColor,
  phaseColor,
  statusColor,
} from '@/lib/utils/formatters'
import type { Database } from '@/lib/supabase/database.types'
import Link from 'next/link'
import { CaptureAnalysis } from '@/components/features/pipeline/CaptureAnalysis'
import { AwardHistory } from '@/components/features/pipeline/AwardHistory'
import { SpendingTrends } from '@/components/features/pipeline/SpendingTrends'
import { GovWinIntel } from '@/components/features/pipeline/GovWinIntel'
import { DangerZone } from '@/components/features/pipeline/DangerZone'
import { DeadlineCountdown } from '@/components/features/pipeline/DeadlineCountdown'
import { VolumeProgress } from '@/components/features/pipeline/VolumeProgress'
import { InlineEditFields } from '@/components/features/pipeline/InlineEditFields'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

type OpportunityRow = Database['public']['Tables']['opportunities']['Row']
type AssignmentRow = Database['public']['Tables']['opportunity_assignments']['Row']
type CommentRow = Database['public']['Tables']['opportunity_comments']['Row']

// ─── Detail Field ───────────────────────────────────────────────
function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-200">{value ?? '—'}</dd>
    </div>
  )
}

// ─── Page Component ─────────────────────────────────────────────
export default async function WarRoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // ─── Auth + Role ──────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let canEdit = false
  let showCaptureAgent = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = resolveRole(profile?.role)
    if (!hasPermission(role, 'pipeline', 'canView')) return null

    const perms = getRolePermissions(profile?.role ?? 'partner')
    canEdit = perms.pipeline?.canEdit === true
    showCaptureAgent = getAllowedAgents(role).includes('capture')
  }

  // ─── Fetch Opportunity ────────────────────────────────────
  const { data: opportunity, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !opportunity) {
    notFound()
  }

  const opp: OpportunityRow = opportunity

  // ─── Fetch Team Assignments ───────────────────────────────
  const { data: assignments } = await supabase
    .from('opportunity_assignments')
    .select('*')
    .eq('opportunity_id', id)
    .order('role', { ascending: true })

  const team: AssignmentRow[] = assignments ?? []

  // ─── Fetch Comments ───────────────────────────────────────
  const { data: comments } = await supabase
    .from('opportunity_comments')
    .select('*')
    .eq('opportunity_id', id)
    .order('created_at', { ascending: false })

  const commentList: CommentRow[] = comments ?? []

  // ─── Fetch Proposal Sections for Volume Progress ──────────
  const { data: proposalSections } = await supabase
    .from('proposal_sections')
    .select('volume, status')
    .eq('opportunity_id', id)

  // ─── Compute due date ──────────────────────────────────────
  const dueDate = opp.due_date ?? opp.submission_date

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Pipeline', href: '/pipeline' },
        { label: opp.title },
      ]} />

      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{opp.title}</h1>
            {opp.status && (
              <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${statusColor(opp.status)}`}>
                {opp.status}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
            {opp.agency && <span>{opp.agency}</span>}
            {opp.phase && (
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${phaseColor(opp.phase)}`}>
                {opp.phase}
              </span>
            )}
            {dueDate && (
              <DeadlineCountdown targetDate={dueDate} />
            )}
          </div>
        </div>

        {canEdit && (
          <Link
            href={`/pipeline/${id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
        )}
      </div>

      {/* ─── Key Metrics Bar ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Ceiling</p>
          <p className="mt-1 text-lg font-bold text-white">{formatCurrency(opp.ceiling)}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Win Probability</p>
          <p className={`mt-1 text-lg font-bold ${pwinColor(opp.pwin)}`}>{formatPwin(opp.pwin)}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Due Date</p>
          <p className="mt-1 text-lg font-bold text-white">{formatDate(opp.due_date)}</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Set-Aside</p>
          <p className="mt-1 text-lg font-bold text-white">{opp.set_aside ?? '—'}</p>
        </div>
      </div>

      {/* ─── Volume Progress Bars ─────────────────────────────── */}
      {(proposalSections ?? []).length > 0 && (
        <VolumeProgress
          sections={(proposalSections ?? []).map((s) => ({
            volume: s.volume,
            status: s.status,
          }))}
        />
      )}

      {/* ─── Two Column Detail ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Opportunity Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {opp.description && (
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Description
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">
                {opp.description}
              </p>
            </div>
          )}

          {/* AI Capture Analysis — only for roles with 'capture' agent */}
          {showCaptureAgent && (
            <div id="capture" className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Capture Analysis
              </h2>
              <CaptureAnalysis
                opportunity={{
                  id: opp.id,
                  title: opp.title ?? '',
                  agency: opp.agency,
                  ceiling: opp.ceiling ? Number(opp.ceiling) : null,
                  description: opp.description,
                  naics_code: opp.naics_code,
                  set_aside: opp.set_aside,
                }}
              />
            </div>
          )}

          {/* Market Intelligence */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Market Intelligence
            </h2>
            <div className="space-y-6">
              <AwardHistory
                agency={opp.agency}
                naicsCode={opp.naics_code}
              />
              <SpendingTrends
                agency={opp.agency}
                naicsCode={opp.naics_code}
              />
              <GovWinIntel
                govwinId={opp.govwin_id}
                competitors={[]}
                agencyIntel={null}
                lastUpdated={null}
              />
            </div>
          </div>

          {/* Details Grid — Inline Editable */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Opportunity Details
            </h2>
            <InlineEditFields
              opportunityId={id}
              canEdit={canEdit}
              fields={[
                { label: 'Agency', fieldName: 'agency', value: opp.agency },
                { label: 'Sub-Agency', fieldName: 'sub_agency', value: opp.sub_agency },
                { label: 'NAICS Code', fieldName: 'naics_code', value: opp.naics_code },
                { label: 'Contract Vehicle', fieldName: 'contract_vehicle', value: opp.contract_vehicle },
                { label: 'Solicitation #', fieldName: 'solicitation_number', value: opp.solicitation_number },
                { label: 'Incumbent', fieldName: 'incumbent', value: opp.incumbent },
                { label: 'Place of Performance', fieldName: 'place_of_performance', value: opp.place_of_performance },
                { label: 'Period of Performance', fieldName: 'period_of_performance', value: opp.period_of_performance },
                { label: 'Priority', fieldName: 'priority', value: opp.priority },
              ]}
            />
            {/* Non-editable fields */}
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <DetailField label="Recompete" value={opp.is_recompete ? 'Yes' : opp.is_recompete === false ? 'No' : '—'} />
              <DetailField label="Go/No-Go" value={opp.go_no_go} />
              <DetailField label="Deal Source" value={opp.deal_source} />
            </dl>
          </div>

          {/* Contact Info */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Point of Contact
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
              <DetailField label="Contact Name" value={opp.contact_name} />
              <DetailField label="Contact Email" value={opp.contact_email} />
            </dl>
          </div>

          {/* Key Dates */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Key Dates
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <DetailField label="Due Date" value={formatDate(opp.due_date)} />
              <DetailField label="Submission Date" value={formatDate(opp.submission_date)} />
              <DetailField label="Award Date" value={formatDate(opp.award_date)} />
              <DetailField label="PoP Start" value={formatDate(opp.pop_start)} />
              <DetailField label="PoP End" value={formatDate(opp.pop_end)} />
              <DetailField label="Created" value={formatDate(opp.created_at)} />
            </dl>
          </div>
        </div>

        {/* Right: Team & Comments */}
        <div className="space-y-6">
          {/* Team Assignments */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Team
            </h2>
            {team.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {team.map((assignment) => (
                  <li key={assignment.id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xs font-medium text-gray-300">
                      {assignment.assignee_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">
                        {assignment.assignee_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {assignment.role.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No team members assigned</p>
            )}
          </div>

          {/* Comments */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Comments
            </h2>
            {commentList.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {commentList.map((comment) => (
                  <li key={comment.id} className="border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-400">
                        {comment.author ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatRelativeDate(comment.created_at)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-300">{comment.content}</p>
                    {comment.is_pinned && (
                      <span className="mt-1 inline-block text-xs text-[#00E5FA]">📌 Pinned</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No comments yet</p>
            )}
          </div>

          {/* Metadata */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Metadata
            </h2>
            <dl className="mt-4 space-y-3">
              <DetailField label="SAM.gov ID" value={opp.sam_opportunity_id} />
              <DetailField label="GovWin ID" value={opp.govwin_id} />
              <DetailField label="HubSpot Deal ID" value={opp.hubspot_deal_id} />
              <DetailField label="Last Updated" value={formatDate(opp.updated_at)} />
            </dl>
          </div>
        </div>
      </div>

      {/* Notes */}
      {opp.notes && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Notes</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">
            {opp.notes}
          </p>
        </div>
      )}

      {/* Danger Zone — only for users with edit permission */}
      {canEdit && (
        <DangerZone opportunityId={id} opportunityTitle={opp.title} />
      )}
    </div>
  )
}
