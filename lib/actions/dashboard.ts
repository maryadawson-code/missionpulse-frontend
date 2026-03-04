// filepath: lib/actions/dashboard.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createLogger } from '@/lib/logging/logger'
import type { DashboardKPIs } from '@/lib/types/opportunities'

const log = createLogger('dashboard')

/**
 * Fetch dashboard KPIs. RBAC scoping:
 * - executive/admin/CEO/COO: sees all opportunities
 * - others: sees only opportunities where owner_id = auth.uid()
 *
 * RLS on the `opportunities` table enforces the data boundary.
 * This function relies on RLS — no additional filtering needed
 * because the Supabase client uses the user's JWT.
 */
export async function getDashboardKPIs(): Promise<{
  data: DashboardKPIs | null
  error: string | null
}> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  // RLS-filtered query — user only sees what they're allowed to see
  const { data: opportunities, error: fetchError } = await supabase
    .from('opportunities')
    .select('id, ceiling, pwin, due_date, status')
    .eq('status', 'Active')

  if (fetchError) {
    log.error('KPI fetch failed', { error: fetchError.message })
    return { data: null, error: fetchError.message }
  }

  const opps = opportunities ?? []
  const now = new Date()
  const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const pipelineCount = opps.length

  const totalCeiling = opps.reduce((sum, opp) => {
    const val = opp.ceiling ? Number(opp.ceiling) : 0
    return sum + val
  }, 0)

  const avgPwin =
    pipelineCount > 0
      ? Math.round(
          opps.reduce((sum, opp) => sum + (opp.pwin ?? 50), 0) / pipelineCount
        )
      : 0

  const upcomingDeadlines = opps.filter((opp) => {
    if (!opp.due_date) return false
    const dueDate = new Date(opp.due_date)
    return dueDate >= now && dueDate <= thirtyDaysOut
  }).length

  return {
    data: { pipelineCount, totalCeiling, avgPwin, upcomingDeadlines },
    error: null,
  }
}
