/**
 * Cost Model template — maps pricing data to CostModelCLIN
 * structure for XLSX generation.
 */

import type { CostModelCLIN } from '../xlsx-engine'

interface PricingItemRecord {
  clin: string | null
  description: string | null
  labor_category: string | null
  quantity: number | null
  unit_price: number | null
  proposed_rate: number | null
  gsa_rate: number | null
}

/**
 * Map DB pricing_items rows to export-ready CostModelCLINs.
 * Groups items by CLIN number.
 */
export function buildCostModelCLINs(
  records: PricingItemRecord[]
): CostModelCLIN[] {
  const grouped = new Map<string, PricingItemRecord[]>()
  for (const r of records) {
    const key = r.clin ?? 'TBD'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(r)
  }

  return Array.from(grouped.entries()).map(([clinNumber, items]) => ({
    clin_number: clinNumber,
    description: items[0]?.description ?? '',
    labor_categories: items.map((item) => ({
      lcat: item.labor_category ?? '',
      quantity: item.quantity ?? 0,
      rate: item.proposed_rate ?? item.unit_price ?? 0,
      wrap_rate: item.gsa_rate ?? undefined,
    })),
  }))
}
