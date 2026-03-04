/**
 * Parallel Artifact Collaboration View — Side-by-side editing
 * Sprint 30 (T-30.4) — Phase J v1.3
 *
 * Displays two volumes from the same opportunity side by side
 * for cross-referencing and parallel editing.
 *
 * © 2026 Mission Meets Tech
 */

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import SplitEditor from '@/components/features/collaboration/SplitEditor'

export default async function SplitViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Auth gate
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'proposals', 'canView')) redirect('/dashboard')

  // Fetch opportunity
  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, title')
    .eq('id', id)
    .single()

  if (!opportunity) notFound()

  // Fetch volumes
  const { data: volumes } = await supabase
    .from('proposal_volumes')
    .select('id, volume_name, volume_number')
    .eq('opportunity_id', id)
    .order('volume_number', { ascending: true })

  // Fetch sections for all volumes
  const { data: sections } = await supabase
    .from('proposal_sections')
    .select('id, section_title, volume, content, section_number')
    .eq('opportunity_id', id)
    .order('section_number', { ascending: true })

  return (
    <div className="flex flex-col h-full">
      <Breadcrumb
        items={[
          { label: 'Proposals', href: '/proposals' },
          { label: opportunity.title, href: `/proposals/${id}` },
          { label: 'Split View' },
        ]}
      />

      <div className="mt-4 mb-2">
        <h1 className="text-xl font-bold text-white">
          Parallel Editing &mdash; {opportunity.title}
        </h1>
        <p className="text-sm text-white/50">
          Compare and cross-reference two volumes side by side.
        </p>
      </div>

      <SplitEditor
        volumes={(volumes ?? []).map(v => ({
          id: v.id,
          name: v.volume_name,
          number: v.volume_number,
        }))}
        sections={(sections ?? []).map(s => ({
          id: s.id,
          title: s.section_title,
          volume: s.volume,
          content: (s.content as string) ?? '',
          sectionNumber: s.section_number,
        }))}
      />
    </div>
  )
}
