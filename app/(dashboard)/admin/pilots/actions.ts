/**
 * Server Actions for Pilot Admin page.
 */
'use server'

import { createPilot, convertPilot } from '@/lib/billing/pilots'

export async function createPilotAction(
  companyId: string,
  planTier: string,
  kpis: Record<string, unknown>
) {
  return createPilot(companyId, planTier, kpis)
}

export async function convertPilotAction(companyId: string) {
  return convertPilot(companyId)
}
