/**
 * Playbook Quality Scoring Engine
 *
 * Scores every playbook entry on:
 * 1. Relevance — pgvector similarity to current active opportunities
 * 2. Freshness — decay based on days since last use
 * 3. Win correlation — entries used in won proposals score higher
 *
 * Formula: quality = (relevance × 0.4) + (freshness × 0.3) + (winMultiplier × 0.3)
 *
 * Scores recalculated nightly via Edge Function (see supabase/functions/).
 * Manual override: users can pin/boost entries to override algorithmic score.
 */
'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ───────────────────────────────────────────────────

export interface QualityScore {
  total: number // 0-100 composite score
  relevance: number // 0-100
  freshness: number // 0-100
  winCorrelation: number // 0-100
  isPinned: boolean
  isBoosted: boolean
  lastScored: string
}

export interface ScoredEntry {
  id: string
  title: string
  category: string
  qualityScore: QualityScore
  useCount: number
  effectivenessScore: number
}

// ─── Scoring Constants ──────────────────────────────────────

const RELEVANCE_WEIGHT = 0.4
const FRESHNESS_WEIGHT = 0.3
const WIN_WEIGHT = 0.3

/** Freshness half-life in days: score drops to 50% after this many days */
const FRESHNESS_HALF_LIFE_DAYS = 90

/** Boost multiplier for pinned entries */
const PIN_BOOST = 1.2

/** Minimum score for any entry (floor) */
const MIN_SCORE = 5

// ─── Score Calculation ──────────────────────────────────────

/**
 * Calculate the quality score for a single playbook entry.
 */
export function calculateQualityScore(params: {
  relevanceSimilarity: number // 0-1 from pgvector
  daysSinceLastUse: number
  useCount: number
  wasUsedInWin: boolean
  wasUsedInLoss: boolean
  isPinned: boolean
  isBoosted: boolean
}): QualityScore {
  // Relevance: direct from pgvector similarity (0-1 → 0-100)
  const relevance = Math.round(params.relevanceSimilarity * 100)

  // Freshness: exponential decay
  const freshnessDecay = Math.pow(0.5, params.daysSinceLastUse / FRESHNESS_HALF_LIFE_DAYS)
  const freshness = Math.round(freshnessDecay * 100)

  // Win correlation: win=100, loss=30, neutral=50, scaled by use count
  let winBase = 50 // neutral
  if (params.wasUsedInWin) winBase = 100
  if (params.wasUsedInLoss) winBase = 30
  // Use count bonus: more uses = more trusted (logarithmic)
  const useBonus = Math.min(Math.log2(params.useCount + 1) * 10, 30)
  const winCorrelation = Math.min(Math.round(winBase + useBonus), 100)

  // Composite
  let total = Math.round(
    relevance * RELEVANCE_WEIGHT +
    freshness * FRESHNESS_WEIGHT +
    winCorrelation * WIN_WEIGHT
  )

  // Apply boosts
  if (params.isPinned) total = Math.round(total * PIN_BOOST)
  if (params.isBoosted) total = Math.min(total + 15, 100)

  total = Math.max(MIN_SCORE, Math.min(100, total))

  return {
    total,
    relevance,
    freshness,
    winCorrelation,
    isPinned: params.isPinned,
    isBoosted: params.isBoosted,
    lastScored: new Date().toISOString(),
  }
}

/**
 * Score badge label for UI display.
 */
export function getScoreBadge(score: number): {
  label: string
  color: string
} {
  if (score >= 80) return { label: 'Excellent', color: 'text-emerald-400' }
  if (score >= 60) return { label: 'Good', color: 'text-cyan-400' }
  if (score >= 40) return { label: 'Fair', color: 'text-amber-400' }
  return { label: 'Low', color: 'text-gray-500' }
}

// ─── Batch Scoring ──────────────────────────────────────────

/**
 * Recalculate quality scores for all playbook entries in a company.
 * Called nightly by Edge Function or manually by admin.
 */
export async function recalculateAllScores(): Promise<{
  scored: number
  errors: string[]
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { scored: 0, errors: ['Not authenticated'] }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { scored: 0, errors: ['No company'] }

  // Get all playbook entries
  const { data: entries, error: fetchError } = await supabase
    .from('playbook_entries')
    .select('id, title, use_count, metadata, updated_at, effectiveness_score')
    .order('updated_at', { ascending: false })

  if (fetchError || !entries) {
    return { scored: 0, errors: [fetchError?.message ?? 'No entries'] }
  }

  // Get won/lost opportunities for win correlation
  const { data: wonOpps } = await supabase
    .from('opportunities')
    .select('id')
    .eq('company_id', profile.company_id)
    .eq('status', 'awarded')

  const { data: lostOpps } = await supabase
    .from('opportunities')
    .select('id')
    .eq('company_id', profile.company_id)
    .eq('status', 'lost')

  const wonIds = new Set((wonOpps ?? []).map((o) => o.id))
  const lostIds = new Set((lostOpps ?? []).map((o) => o.id))

  let scored = 0
  const errors: string[] = []

  for (const entry of entries) {
    try {
      const meta = (entry.metadata as Record<string, unknown>) ?? {}
      const linkedOpps = (meta.linked_opportunities as string[]) ?? []
      const isPinned = (meta.is_pinned as boolean) ?? false
      const isBoosted = (meta.is_boosted as boolean) ?? false

      // Days since last use
      const lastUsed = new Date(entry.updated_at)
      const daysSinceUse = Math.floor(
        (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Win/loss correlation
      const wasUsedInWin = linkedOpps.some((id) => wonIds.has(id))
      const wasUsedInLoss = linkedOpps.some((id) => lostIds.has(id)) && !wasUsedInWin

      // Relevance: use existing effectiveness_score as proxy
      // (pgvector similarity would be calculated per-query at retrieval time)
      const relevanceSimilarity = (entry.effectiveness_score ?? 50) / 100

      const score = calculateQualityScore({
        relevanceSimilarity,
        daysSinceLastUse: daysSinceUse,
        useCount: entry.use_count ?? 0,
        wasUsedInWin,
        wasUsedInLoss,
        isPinned,
        isBoosted,
      })

      // Update entry metadata with score
      await supabase
        .from('playbook_entries')
        .update({
          metadata: JSON.parse(JSON.stringify({
            ...meta,
            quality_score: score,
          })),
        })
        .eq('id', entry.id)

      scored++
    } catch (err) {
      errors.push(`${entry.id}: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  }

  return { scored, errors }
}

// ─── Pin/Boost Operations ───────────────────────────────────

/**
 * Pin a playbook entry (manual override to keep it highly ranked).
 */
export async function pinEntry(
  entryId: string,
  pinned: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: entry } = await supabase
    .from('playbook_entries')
    .select('metadata')
    .eq('id', entryId)
    .single()

  if (!entry) return { success: false, error: 'Entry not found' }

  const meta = (entry.metadata as Record<string, unknown>) ?? {}

  const { error } = await supabase
    .from('playbook_entries')
    .update({
      metadata: JSON.parse(JSON.stringify({
        ...meta,
        is_pinned: pinned,
      })),
    })
    .eq('id', entryId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Boost a playbook entry (temporary score increase).
 */
export async function boostEntry(
  entryId: string,
  boosted: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: entry } = await supabase
    .from('playbook_entries')
    .select('metadata')
    .eq('id', entryId)
    .single()

  if (!entry) return { success: false, error: 'Entry not found' }

  const meta = (entry.metadata as Record<string, unknown>) ?? {}

  const { error } = await supabase
    .from('playbook_entries')
    .update({
      metadata: JSON.parse(JSON.stringify({
        ...meta,
        is_boosted: boosted,
      })),
    })
    .eq('id', entryId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
