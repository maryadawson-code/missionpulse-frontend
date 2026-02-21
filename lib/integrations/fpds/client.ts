/**
 * FPDS (Federal Procurement Data System) API Client
 *
 * Pulls contract actions, vendor history, and pricing benchmarks.
 * Feeds into the Pricing Agent for price-to-win analysis.
 *
 * API: https://www.fpds.gov/fpdsng_cms/index.php/en/resources/atom-feed.html
 * Public Atom feed — no API key required.
 */
'use server'

// ─── Config ──────────────────────────────────────────────────

const FPDS_BASE = 'https://www.fpds.gov/ezsearch/LATEST'

// ─── Types ───────────────────────────────────────────────────

export interface ContractAction {
  contractId: string
  piid: string
  modNumber: string | null
  agency: string
  subAgency: string | null
  vendorName: string
  vendorDuns: string | null
  naicsCode: string | null
  obligatedAmount: number
  baseAndAllOptionsValue: number | null
  signedDate: string | null
  completionDate: string | null
  placeOfPerformance: string | null
  contractType: string | null
  setAside: string | null
  description: string | null
}

export interface VendorHistory {
  vendorName: string
  totalContracts: number
  totalObligated: number
  averageContractValue: number
  naicsCodes: string[]
  agencies: string[]
  performanceRatings: PerformanceRating[]
  recentContracts: ContractAction[]
}

export interface PerformanceRating {
  contractId: string
  rating: 'Exceptional' | 'Very Good' | 'Satisfactory' | 'Marginal' | 'Unsatisfactory' | 'Unknown'
  evaluatedOn: string | null
}

export interface PricingBenchmark {
  naicsCode: string
  agency: string
  averageValue: number
  medianValue: number
  contractCount: number
  minValue: number
  maxValue: number
  averageDuration: number // months
  commonSetAsides: string[]
  commonContractTypes: string[]
}

export interface FPDSSearchParams {
  agency?: string
  vendor?: string
  naicsCode?: string
  dateFrom?: string // YYYY/MM/DD
  dateTo?: string // YYYY/MM/DD
  keyword?: string
  setAside?: string
  limit?: number
}

// ─── Atom Feed Parser ────────────────────────────────────────

/**
 * Parse FPDS Atom feed XML response into ContractAction objects.
 * FPDS returns data as Atom XML — we extract the relevant fields.
 */
function parseAtomFeed(xml: string): ContractAction[] {
  const actions: ContractAction[] = []

  // Extract each entry from the Atom feed
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let match: RegExpExecArray | null

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1]

    const extractField = (tag: string): string | null => {
      const fieldRegex = new RegExp(`<(?:[a-z0-9]+:)?${tag}[^>]*>([^<]*)<`, 'i')
      const fieldMatch = fieldRegex.exec(entry)
      return fieldMatch ? fieldMatch[1].trim() || null : null
    }

    const extractAttr = (tag: string, attr: string): string | null => {
      const attrRegex = new RegExp(`<(?:[a-z0-9]+:)?${tag}[^>]*${attr}="([^"]*)"`, 'i')
      const attrMatch = attrRegex.exec(entry)
      return attrMatch ? attrMatch[1].trim() || null : null
    }

    const piid = extractField('PIID') ?? extractField('piid') ?? ''
    if (!piid) continue

    actions.push({
      contractId: piid + (extractField('modNumber') ?? ''),
      piid,
      modNumber: extractField('modNumber'),
      agency: extractAttr('contractingOfficeAgencyID', 'description') ??
        extractField('contractingOfficeAgencyID') ?? 'Unknown',
      subAgency: extractAttr('contractingOfficeID', 'description') ?? null,
      vendorName: extractField('vendorName') ??
        extractField('vendorDoingAsBusinessName') ?? 'Unknown',
      vendorDuns: extractField('DUNSNumber') ?? null,
      naicsCode: extractField('principalNAICSCode') ?? null,
      obligatedAmount: parseFloat(extractField('obligatedAmount') ?? '0'),
      baseAndAllOptionsValue: extractField('baseAndAllOptionsValue')
        ? parseFloat(extractField('baseAndAllOptionsValue')!)
        : null,
      signedDate: extractField('signedDate') ?? null,
      completionDate: extractField('ultimateCompletionDate') ?? null,
      placeOfPerformance: extractAttr('placeOfPerformanceStateCode', 'description') ?? null,
      contractType: extractAttr('typeOfContractPricing', 'description') ?? null,
      setAside: extractAttr('typeOfSetAside', 'description') ?? null,
      description: extractField('descriptionOfContractRequirement') ?? null,
    })
  }

  return actions
}

// ─── Contract Action Search ──────────────────────────────────

/**
 * Search FPDS for contract actions matching criteria.
 */
export async function searchContractActions(
  params: FPDSSearchParams
): Promise<{ actions: ContractAction[]; error?: string }> {
  try {
    const queryParts: string[] = []

    if (params.agency) {
      queryParts.push(`CONTRACTING_AGENCY_NAME:"${params.agency}"`)
    }
    if (params.vendor) {
      queryParts.push(`VENDOR_FULL_NAME:"${params.vendor}"`)
    }
    if (params.naicsCode) {
      queryParts.push(`PRINCIPAL_NAICS_CODE:"${params.naicsCode}"`)
    }
    if (params.keyword) {
      queryParts.push(`DESCRIPTION_OF_REQUIREMENT:"${params.keyword}"`)
    }
    if (params.setAside) {
      queryParts.push(`TYPE_OF_SET_ASIDE:"${params.setAside}"`)
    }
    if (params.dateFrom) {
      queryParts.push(`SIGNED_DATE:[${params.dateFrom},${params.dateTo ?? '*'}]`)
    }

    if (queryParts.length === 0) {
      return { actions: [], error: 'At least one search parameter required' }
    }

    const query = queryParts.join(' ')
    const limit = params.limit ?? 25
    const url = `${FPDS_BASE}?q=${encodeURIComponent(query)}&num_record=${limit}`

    const res = await fetch(url, {
      headers: { Accept: 'application/atom+xml' },
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      return { actions: [], error: `FPDS returned ${res.status}` }
    }

    const xml = await res.text()
    const actions = parseAtomFeed(xml)

    return { actions }
  } catch (err) {
    return {
      actions: [],
      error: err instanceof Error ? err.message : 'FPDS search failed',
    }
  }
}

// ─── Vendor History ──────────────────────────────────────────

/**
 * Build a vendor history profile from FPDS data.
 */
export async function getVendorHistory(
  vendorName: string,
  naicsCode?: string
): Promise<{ vendor: VendorHistory | null; error?: string }> {
  try {
    const searchParams: FPDSSearchParams = { vendor: vendorName, limit: 50 }
    if (naicsCode) searchParams.naicsCode = naicsCode

    const { actions, error } = await searchContractActions(searchParams)
    if (error) return { vendor: null, error }
    if (actions.length === 0) return { vendor: null, error: 'No contract history found' }

    const totalObligated = actions.reduce((sum, a) => sum + a.obligatedAmount, 0)
    const naicsCodes = Array.from(new Set(actions.map((a) => a.naicsCode).filter(Boolean))) as string[]
    const agencies = Array.from(new Set(actions.map((a) => a.agency)))

    const vendor: VendorHistory = {
      vendorName,
      totalContracts: actions.length,
      totalObligated,
      averageContractValue: totalObligated / actions.length,
      naicsCodes,
      agencies,
      performanceRatings: [], // CPARS data not publicly available via FPDS
      recentContracts: actions.slice(0, 10),
    }

    return { vendor }
  } catch (err) {
    return {
      vendor: null,
      error: err instanceof Error ? err.message : 'Vendor history failed',
    }
  }
}

// ─── Pricing Benchmarks ──────────────────────────────────────

/**
 * Calculate pricing benchmarks for an agency + NAICS combination.
 * Analyzes recent FPDS data to provide market intelligence.
 */
export async function getPricingBenchmarks(
  agency: string,
  naicsCode: string
): Promise<{ benchmark: PricingBenchmark | null; error?: string }> {
  try {
    // Search for recent contracts in the same agency + NAICS
    const currentYear = new Date().getFullYear()
    const { actions, error } = await searchContractActions({
      agency,
      naicsCode,
      dateFrom: `${currentYear - 3}/01/01`,
      limit: 50,
    })

    if (error) return { benchmark: null, error }
    if (actions.length === 0) return { benchmark: null, error: 'No benchmark data found' }

    const values = actions.map((a) => a.obligatedAmount).filter((v) => v > 0)
    const sorted = [...values].sort((a, b) => a - b)

    // Calculate duration in months for contracts with both dates
    const durations = actions
      .filter((a) => a.signedDate && a.completionDate)
      .map((a) => {
        const start = new Date(a.signedDate!)
        const end = new Date(a.completionDate!)
        return Math.max(1, Math.round((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000)))
      })

    // Common set-asides
    const setAsideCounts = new Map<string, number>()
    for (const a of actions) {
      if (a.setAside) {
        setAsideCounts.set(a.setAside, (setAsideCounts.get(a.setAside) ?? 0) + 1)
      }
    }
    const commonSetAsides = Array.from(setAsideCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)

    // Common contract types
    const typeCounts = new Map<string, number>()
    for (const a of actions) {
      if (a.contractType) {
        typeCounts.set(a.contractType, (typeCounts.get(a.contractType) ?? 0) + 1)
      }
    }
    const commonContractTypes = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)

    const benchmark: PricingBenchmark = {
      naicsCode,
      agency,
      averageValue: values.reduce((sum, v) => sum + v, 0) / values.length,
      medianValue: sorted[Math.floor(sorted.length / 2)] ?? 0,
      contractCount: actions.length,
      minValue: sorted[0] ?? 0,
      maxValue: sorted[sorted.length - 1] ?? 0,
      averageDuration: durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0,
      commonSetAsides,
      commonContractTypes,
    }

    return { benchmark }
  } catch (err) {
    return {
      benchmark: null,
      error: err instanceof Error ? err.message : 'Benchmark calculation failed',
    }
  }
}

// ─── Build Pricing Context ───────────────────────────────────

/**
 * Build a pricing context string for the Pricing Agent.
 * Fetches FPDS benchmarks and formats them for AI consumption.
 */
export async function buildPricingContext(
  agency: string,
  naicsCode: string
): Promise<string> {
  const { benchmark } = await getPricingBenchmarks(agency, naicsCode)

  if (!benchmark) {
    return 'No FPDS pricing benchmark data available for this agency/NAICS combination.'
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
    return `$${amount.toLocaleString()}`
  }

  return `FPDS Market Intelligence (${benchmark.agency} / NAICS ${benchmark.naicsCode}):
- Contracts analyzed: ${benchmark.contractCount} (past 3 years)
- Average contract value: ${formatCurrency(benchmark.averageValue)}
- Median contract value: ${formatCurrency(benchmark.medianValue)}
- Range: ${formatCurrency(benchmark.minValue)} – ${formatCurrency(benchmark.maxValue)}
- Average duration: ${Math.round(benchmark.averageDuration)} months
- Common set-asides: ${benchmark.commonSetAsides.join(', ') || 'None specified'}
- Common contract types: ${benchmark.commonContractTypes.join(', ') || 'Not specified'}

Use this market data to calibrate pricing recommendations and price-to-win analysis.`
}
