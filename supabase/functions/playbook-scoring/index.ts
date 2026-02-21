/**
 * Playbook Quality Scoring — Supabase Edge Function
 *
 * Runs nightly via cron to recalculate quality scores for all
 * playbook entries across all companies.
 *
 * Cron schedule: 0 3 * * * (3 AM UTC daily)
 *
 * To deploy: supabase functions deploy playbook-scoring
 * To schedule: supabase functions schedule playbook-scoring --cron "0 3 * * *"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

/** Freshness half-life in days */
const FRESHNESS_HALF_LIFE_DAYS = 90

const RELEVANCE_WEIGHT = 0.4
const FRESHNESS_WEIGHT = 0.3
const WIN_WEIGHT = 0.3

Deno.serve(async (req: Request) => {
  // Verify authorization
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    // Get all playbook entries
    const { data: entries, error: fetchErr } = await supabase
      .from('playbook_entries')
      .select('id, use_count, metadata, updated_at, effectiveness_score')

    if (fetchErr) throw new Error(fetchErr.message)
    if (!entries?.length) {
      return Response.json({ scored: 0, message: 'No entries to score' })
    }

    // Get won/lost opportunities across all companies
    const { data: wonOpps } = await supabase
      .from('opportunities')
      .select('id')
      .eq('status', 'awarded')

    const { data: lostOpps } = await supabase
      .from('opportunities')
      .select('id')
      .eq('status', 'lost')

    const wonIds = new Set((wonOpps ?? []).map((o: { id: string }) => o.id))
    const lostIds = new Set((lostOpps ?? []).map((o: { id: string }) => o.id))

    let scored = 0
    const errors: string[] = []

    for (const entry of entries) {
      try {
        const meta = (entry.metadata ?? {}) as Record<string, unknown>
        const linkedOpps = (meta.linked_opportunities as string[]) ?? []
        const isPinned = (meta.is_pinned as boolean) ?? false
        const isBoosted = (meta.is_boosted as boolean) ?? false

        const daysSinceUse = Math.floor(
          (Date.now() - new Date(entry.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        )

        const wasUsedInWin = linkedOpps.some((id: string) => wonIds.has(id))
        const wasUsedInLoss = linkedOpps.some((id: string) => lostIds.has(id)) && !wasUsedInWin

        // Calculate scores
        const relevance = ((entry.effectiveness_score ?? 50) / 100) * 100
        const freshness = Math.pow(0.5, daysSinceUse / FRESHNESS_HALF_LIFE_DAYS) * 100

        let winBase = 50
        if (wasUsedInWin) winBase = 100
        if (wasUsedInLoss) winBase = 30
        const useBonus = Math.min(Math.log2((entry.use_count ?? 0) + 1) * 10, 30)
        const winCorrelation = Math.min(winBase + useBonus, 100)

        let total = Math.round(
          relevance * RELEVANCE_WEIGHT +
          freshness * FRESHNESS_WEIGHT +
          winCorrelation * WIN_WEIGHT
        )

        if (isPinned) total = Math.round(total * 1.2)
        if (isBoosted) total = Math.min(total + 15, 100)
        total = Math.max(5, Math.min(100, total))

        const score = {
          total,
          relevance: Math.round(relevance),
          freshness: Math.round(freshness),
          winCorrelation: Math.round(winCorrelation),
          isPinned,
          isBoosted,
          lastScored: new Date().toISOString(),
        }

        await supabase
          .from('playbook_entries')
          .update({
            metadata: { ...meta, quality_score: score },
          })
          .eq('id', entry.id)

        scored++
      } catch (err) {
        errors.push(`${entry.id}: ${(err as Error).message}`)
      }
    }

    return Response.json({
      scored,
      total: entries.length,
      errors: errors.length,
      errorDetails: errors.slice(0, 5),
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
})
