/**
 * Server Actions for Pilot Admin page.
 */
'use server'

import { createPilot, convertPilotToAnnual } from '@/lib/billing/pilots'

export async function createPilotAction(
  companyId: string,
  planTier: string,
  kpis: Record<string, unknown>
) {
  return createPilot({
    companyId,
    planId: planTier,
    pilotKpi: typeof kpis.target === 'string' ? kpis.target : JSON.stringify(kpis),
  })
}

export async function convertPilotAction(companyId: string) {
  return convertPilotToAnnual(companyId)
}
