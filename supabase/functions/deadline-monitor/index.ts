/**
 * Deadline Monitor — Supabase Edge Function
 *
 * Runs daily via cron to assess deadline risks across all companies.
 * Creates alerts for at-risk and critical sections.
 *
 * Cron: 0 6 * * * (6 AM UTC daily)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (_req: Request) => {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Get all active companies with opportunities that have deadlines
  const { data: companies } = await supabase
    .from('opportunities')
    .select('company_id')
    .not('deadline', 'is', null)
    .in('phase', ['Capture Planning', 'Proposal Development'])

  if (!companies || companies.length === 0) {
    return new Response(JSON.stringify({ message: 'No active deadlines', companies: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Deduplicate company IDs
  const uniqueCompanyIds = [...new Set(companies.map((c: { company_id: string }) => c.company_id))]

  let totalAlerts = 0

  for (const companyId of uniqueCompanyIds) {
    // Get opportunities for this company
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('id, title, deadline, phase, metadata')
      .eq('company_id', companyId)
      .not('deadline', 'is', null)
      .in('phase', ['Capture Planning', 'Proposal Development'])

    if (!opportunities) continue

    for (const opp of opportunities) {
      const now = new Date()
      const due = new Date(opp.deadline)
      const daysRemaining = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Simple risk assessment for Edge Function
      // Full assessment uses lib/ai/proactive/deadline-risk.ts
      const metadata = opp.metadata as Record<string, unknown> | null
      const completionPct = estimateCompletion(opp.phase)

      const remainingPct = 100 - completionPct
      const requiredVelocity = daysRemaining > 0 ? remainingPct / daysRemaining : Infinity

      let riskLevel = 'on_track'
      if (daysRemaining <= 0) {
        riskLevel = 'critical'
      } else if (requiredVelocity > 10) {
        // Need more than 10% per day — critical
        riskLevel = 'critical'
      } else if (requiredVelocity > 5) {
        // Need more than 5% per day — at risk
        riskLevel = 'at_risk'
      }

      if (riskLevel !== 'on_track') {
        await supabase.from('activity_log').insert({
          company_id: companyId,
          action: 'deadline_risk_alert',
          entity_type: 'opportunity',
          entity_id: opp.id,
          description: `[${riskLevel.toUpperCase()}] "${opp.title}" — ${daysRemaining > 0 ? `${daysRemaining} days remaining` : 'PAST DUE'}, ${completionPct}% complete`,
          metadata: {
            risk_level: riskLevel,
            days_remaining: Math.max(0, daysRemaining),
            completion_pct: completionPct,
            required_velocity: Math.round(requiredVelocity * 10) / 10,
          },
        })
        totalAlerts++
      }
    }
  }

  return new Response(
    JSON.stringify({
      message: 'Deadline monitor complete',
      companies: uniqueCompanyIds.length,
      alerts: totalAlerts,
      timestamp: new Date().toISOString(),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})

function estimateCompletion(phase: string): number {
  const map: Record<string, number> = {
    'Long Range': 5,
    'Opportunity Assessment': 15,
    'Capture Planning': 35,
    'Proposal Development': 65,
    'Post-Submission': 90,
  }
  return map[phase] ?? 0
}
