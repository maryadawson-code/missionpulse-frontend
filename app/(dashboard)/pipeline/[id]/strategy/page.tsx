import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { CUIBanner } from '@/components/rbac/CUIBanner'
import { CompetitorManager } from '@/components/features/blackhat/CompetitorManager'
import { BlackHatAI } from '@/components/features/blackhat/BlackHatAI'
import { StrategyAnalysis } from '@/components/features/pipeline/StrategyAnalysis'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

interface Props {
  params: { id: string }
}

export default async function OpportunityStrategyPage({ params }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  // Require either strategy or blackhat permissions
  if (
    !hasPermission(role, 'strategy', 'shouldRender') &&
    !hasPermission(role, 'blackhat', 'shouldRender')
  ) {
    return null
  }

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, title, agency, description, set_aside, naics_code')
    .eq('id', params.id)
    .single()

  if (!opportunity) redirect('/pipeline')

  const { data: competitors } = await supabase
    .from('competitors')
    .select(
      'id, name, threat_level, pwin_estimate, incumbent, strengths, weaknesses, likely_strategy, counter_strategy, ghost_themes'
    )
    .eq('opportunity_id', params.id)
    .order('threat_level', { ascending: true })

  return (
    <div className="space-y-6">
      <CUIBanner marking="OPSEC" />

      {/* CUI Watermark overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.03,
          fontSize: '6rem',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          color: '#f59e0b',
          transform: 'rotate(-30deg)',
          userSelect: 'none',
        }}
      >
        CUI//OPSEC
      </div>

      <Breadcrumb
        items={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: opportunity.title, href: `/pipeline/${params.id}` },
          { label: 'Strategy' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-white">
          Black Hat Review — {opportunity.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Competitive analysis, ghost strategies, and counter-tactics for{' '}
          {opportunity.agency ?? 'this opportunity'}.
        </p>
      </div>

      {/* AI Strategy Analysis */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Strategy Generator
        </h2>
        <StrategyAnalysis
          opportunity={{
            id: opportunity.id,
            title: opportunity.title ?? '',
            agency: opportunity.agency,
            description: opportunity.description,
            set_aside: opportunity.set_aside,
            naics_code: opportunity.naics_code,
          }}
        />
      </div>

      <CompetitorManager
        opportunityId={opportunity.id}
        competitors={(competitors ?? []).map((c) => ({
          ...c,
          strengths: Array.isArray(c.strengths) ? c.strengths as string[] : [],
          weaknesses: Array.isArray(c.weaknesses) ? c.weaknesses as string[] : [],
          ghost_themes: Array.isArray(c.ghost_themes) ? c.ghost_themes as string[] : [],
        }))}
      />

      <BlackHatAI
        opportunity={{
          id: opportunity.id,
          title: opportunity.title ?? '',
          agency: opportunity.agency ?? 'Unknown',
          description: opportunity.description ?? '',
        }}
        competitors={(competitors ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          strengths: Array.isArray(c.strengths) ? c.strengths as string[] : [],
          weaknesses: Array.isArray(c.weaknesses) ? c.weaknesses as string[] : [],
        }))}
      />
    </div>
  )
}
