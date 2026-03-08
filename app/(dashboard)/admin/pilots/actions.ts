/**
 * Server Actions for Pilot Admin page.
 */
'use server'

import { createPilot, convertPilotToAnnual, getPilotCheckoutUrl } from '@/lib/billing/pilots'

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

/**
 * Convert pilot via Stripe Checkout (preferred path — applies pilot credit).
 * Returns { url } for redirect, or falls back to direct DB conversion if Stripe isn't configured.
 */
export async function convertPilotAction(companyId: string) {
  const checkout = await getPilotCheckoutUrl(companyId)
  if (checkout.url) {
    return { success: true, redirectUrl: checkout.url }
  }
  // Fallback: direct conversion if Stripe annual price not configured
  return convertPilotToAnnual(companyId)
}
