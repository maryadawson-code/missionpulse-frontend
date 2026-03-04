/**
 * v1.1 Performance Benchmarking — measure and compare system performance.
 *
 * Targets from Product Spec:
 * - Proposal Dev Time: 340hr target (measure AI response time as proxy)
 * - HITL Review Turnaround: < 4 hours
 * - AI Cost per Proposal: $50-185
 * - Time to First Value: < 15 min
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { getPerformanceReport } from './performance'
import { getCacheMetrics } from '@/lib/cache/semantic-cache'

// ─── Types ──────────────────────────────────────────────────

export interface BenchmarkResult {
  name: string
  value: number
  unit: string
  target: number
  targetUnit: string
  status: 'pass' | 'warn' | 'fail'
}

export interface BenchmarkReport {
  timestamp: string
  results: BenchmarkResult[]
  overallStatus: 'pass' | 'warn' | 'fail'
  summary: string
}

// ─── Baselines ──────────────────────────────────────────────

const TARGETS = {
  aiResponseTimeMs: { target: 3000, warn: 5000, unit: 'ms' },
  aiCostPerProposal: { target: 185, warn: 250, unit: 'USD' },
  cacheHitRate: { target: 0.5, warn: 0.3, unit: '%' },
  p95LatencyMs: { target: 2000, warn: 3000, unit: 'ms' },
  timeToFirstValueMin: { target: 15, warn: 30, unit: 'min' },
}

// ─── Benchmark Runner ───────────────────────────────────────

/**
 * Run the full benchmark suite.
 */
export async function runBenchmark(): Promise<BenchmarkReport> {
  const supabase = await createClient()
  const results: BenchmarkResult[] = []

  // 1. AI Response Time (from token_usage table)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: tokenEntries } = await supabase
    .from('token_usage')
    .select('created_at, metadata')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(100)

  const responseTimes = (tokenEntries ?? [])
    .map((e) => {
      const meta = e.metadata as Record<string, unknown> | null
      return (meta?.duration_ms as number) ?? null
    })
    .filter((t): t is number => t !== null)

  const avgResponseTime =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0

  results.push({
    name: 'AI Response Time (avg)',
    value: avgResponseTime,
    unit: 'ms',
    target: TARGETS.aiResponseTimeMs.target,
    targetUnit: 'ms',
    status: classify(avgResponseTime, TARGETS.aiResponseTimeMs),
  })

  // 2. AI Cost Per Proposal
  const { data: costEntries } = await supabase
    .from('token_usage')
    .select('estimated_cost_usd, opportunity_id')
    .gte('created_at', thirtyDaysAgo.toISOString())

  const oppCosts = new Map<string, number>()
  for (const entry of costEntries ?? []) {
    const oppId = (entry.opportunity_id as string) ?? '__none__'
    oppCosts.set(oppId, (oppCosts.get(oppId) ?? 0) + ((entry.estimated_cost_usd as number) ?? 0))
  }
  const proposalCosts = Array.from(oppCosts.values()).filter((c) => c > 0)
  const avgCostPerProposal =
    proposalCosts.length > 0
      ? Math.round(proposalCosts.reduce((a, b) => a + b, 0) / proposalCosts.length)
      : 0

  results.push({
    name: 'AI Cost per Proposal',
    value: avgCostPerProposal,
    unit: 'USD',
    target: TARGETS.aiCostPerProposal.target,
    targetUnit: 'USD',
    status: classify(avgCostPerProposal, TARGETS.aiCostPerProposal),
  })

  // 3. Cache Hit Rate
  const cacheMetrics = await getCacheMetrics()
  const hitRatePct = Math.round(cacheMetrics.hit_rate * 100)

  results.push({
    name: 'Cache Hit Rate',
    value: hitRatePct,
    unit: '%',
    target: Math.round(TARGETS.cacheHitRate.target * 100),
    targetUnit: '%',
    status: hitRatePct >= TARGETS.cacheHitRate.target * 100
      ? 'pass'
      : hitRatePct >= TARGETS.cacheHitRate.warn * 100
        ? 'warn'
        : 'fail',
  })

  // 4. p95 Latency
  const perfReport = await getPerformanceReport()
  const worstP95 = perfReport.endpoints.length > 0
    ? Math.max(...perfReport.endpoints.map((e) => e.p95))
    : 0

  results.push({
    name: 'Worst p95 Latency',
    value: worstP95,
    unit: 'ms',
    target: TARGETS.p95LatencyMs.target,
    targetUnit: 'ms',
    status: classify(worstP95, TARGETS.p95LatencyMs),
  })

  // 5. System Health
  results.push({
    name: 'System Health',
    value: perfReport.healthStatus === 'healthy' ? 100 : perfReport.healthStatus === 'degraded' ? 50 : 0,
    unit: 'score',
    target: 100,
    targetUnit: 'score',
    status: perfReport.healthStatus === 'healthy' ? 'pass' : perfReport.healthStatus === 'degraded' ? 'warn' : 'fail',
  })

  // Overall status
  const fails = results.filter((r) => r.status === 'fail').length
  const warns = results.filter((r) => r.status === 'warn').length
  const overallStatus = fails > 0 ? 'fail' : warns > 0 ? 'warn' : 'pass'

  return {
    timestamp: new Date().toISOString(),
    results,
    overallStatus,
    summary: `${results.length - fails - warns} pass, ${warns} warn, ${fails} fail`,
  }
}

// ─── Helpers ────────────────────────────────────────────────

function classify(
  value: number,
  thresholds: { target: number; warn: number }
): 'pass' | 'warn' | 'fail' {
  if (value <= thresholds.target) return 'pass'
  if (value <= thresholds.warn) return 'warn'
  return 'fail'
}
