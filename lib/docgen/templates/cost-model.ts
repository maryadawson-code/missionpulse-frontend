/**
 * Cost Model template — maps pricing data to CostModelCLIN
 * structure for XLSX generation.
 */

import type { CostModelCLIN } from '../xlsx-engine'

interface PricingRecord {
  clin_number: string | null
  clin_description: string | null
  labor_categories: Array<{
    title: string
    quantity: number
    hourly_rate: number
    wrap_rate?: number
  }> | null
}

/**
 * Map pricing records to export-ready CostModelCLINs.
 */
export function buildCostModelCLINs(
  records: PricingRecord[]
): CostModelCLIN[] {
  return records.map((r) => ({
    clin_number: r.clin_number ?? 'TBD',
    description: r.clin_description ?? '',
    labor_categories: (r.labor_categories ?? []).map((lcat) => ({
      lcat: lcat.title,
      quantity: lcat.quantity,
      rate: lcat.hourly_rate,
      wrap_rate: lcat.wrap_rate,
    })),
  }))
}
