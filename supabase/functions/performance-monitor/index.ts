/**
 * Performance Monitor — Supabase Edge Function (Deno)
 *
 * Runs every 15 minutes via cron. Samples key endpoints
 * and stores latency results in the performance_metrics table.
 *
 * TODO: deploy via `supabase functions deploy performance-monitor`
 * TODO: set up cron: `supabase functions schedule performance-monitor --schedule "*/15 * * * *"`
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface EndpointSample {
  name: string
  url: string
}

const ENDPOINTS: EndpointSample[] = [
  { name: '/api/health', url: '/api/health' },
  { name: '/dashboard', url: '/dashboard' },
  { name: '/pipeline', url: '/pipeline' },
  { name: '/ai-chat', url: '/ai-chat' },
]

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? Deno.env.get('NEXT_PUBLIC_SITE_URL')

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!appUrl) {
    return new Response(
      JSON.stringify({ error: 'Missing NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const results: Array<{
    name: string
    p50_ms: number
    p95_ms: number
    p99_ms: number
    avg_ms: number
    sample_count: number
  }> = []

  for (const endpoint of ENDPOINTS) {
    const samples: number[] = []

    // Take 5 samples per endpoint
    for (let i = 0; i < 5; i++) {
      const start = performance.now()
      try {
        await fetch(`${appUrl}${endpoint.url}`, {
          method: 'GET',
          headers: { 'User-Agent': 'MissionPulse-PerfMonitor/1.0' },
          signal: AbortSignal.timeout(10000),
        })
      } catch {
        // Record timeout as 10000ms
        samples.push(10000)
        continue
      }
      samples.push(Math.round(performance.now() - start))
    }

    if (samples.length === 0) continue

    const sorted = [...samples].sort((a, b) => a - b)
    const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0
    const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 0
    const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length)

    results.push({
      name: endpoint.name,
      p50_ms: p50,
      p95_ms: p95,
      p99_ms: p99,
      avg_ms: avg,
      sample_count: samples.length,
    })
  }

  // Store results
  const now = new Date().toISOString()
  const rows = results.map((r) => ({
    metric_type: 'endpoint',
    name: r.name,
    p50_ms: r.p50_ms,
    p95_ms: r.p95_ms,
    p99_ms: r.p99_ms,
    avg_ms: r.avg_ms,
    min_ms: 0,
    max_ms: Math.max(...results.map((x) => x.p99_ms)),
    sample_count: r.sample_count,
    health_status: r.p95_ms > 5000 ? 'critical' : r.p95_ms > 2000 ? 'degraded' : 'healthy',
    measured_at: now,
  }))

  if (rows.length > 0) {
    const { error } = await supabase.from('performance_metrics').insert(rows)
    if (error) {
      console.error('[performance-monitor] Insert error:', error.message)
    }
  }

  console.log(`[performance-monitor] Sampled ${results.length} endpoints`)

  return new Response(
    JSON.stringify({ sampled: results.length, results }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
