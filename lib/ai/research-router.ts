/**
 * Research Router — pre-agent live intelligence layer.
 *
 * Single entry point for all pre-agent research. Before an agent generates,
 * the router determines if live intelligence is needed, selects an engine,
 * executes the search, and returns context for prompt injection.
 *
 * CUI ROUTING RULE (NON-NEGOTIABLE):
 * - DLP classifier result (isCUI) is passed in by the caller
 * - CUI detected → engine 'asksage' (no-op here; CUI stays in pipeline.ts)
 * - No CUI → Perplexity deep research or Anthropic web search
 *
 * Engine selection:
 * - perplexity-deep: multi-step research (~$5/run, 10-15 source synthesis)
 *   Best for: incumbent ID, agency spend history, competitor profiles
 * - anthropic-search: single-step web search (Anthropic Messages API + web_search tool)
 *   Best for: quick fact checks, vehicle status, regulation lookups
 * - asksage: CUI-classified queries — returns empty result (AskSage handles CUI in pipeline.ts)
 * - none: agent type doesn't need research (writer, orals, contracts)
 */
'use server'

import { createLogger } from '@/lib/logging/logger'

// ─── Types ──────────────────────────────────────────────────

export type ResearchEngine = 'anthropic-search' | 'perplexity-deep' | 'asksage' | 'none'

export interface ResearchQuery {
  query: string
  agentType: 'capture' | 'strategy' | 'blackhat' | 'compliance' |
             'writer' | 'pricing' | 'contracts' | 'orals'
  opportunityContext?: {
    title: string
    agency?: string
    vehicle?: string
    ceiling?: number
  }
  isCUI: boolean
}

export interface ResearchResult {
  engine: ResearchEngine
  content: string
  sources: string[]
  researchDurationMs: number
  skippedReason?: string
}

// ─── Config ─────────────────────────────────────────────────

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY ?? ''
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'
const PERPLEXITY_MODEL = 'sonar-deep-research'
const PERPLEXITY_TIMEOUT_MS = 120_000

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? ''
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_SEARCH_MODEL = 'claude-sonnet-4-20250514'
const ANTHROPIC_SEARCH_TIMEOUT_MS = 30_000

const log = createLogger('research-router')

// ─── Deep Research Signal Keywords ──────────────────────────

const DEEP_RESEARCH_SIGNALS = [
  'incumbent', 'who holds', 'who won', 'prime contractor', 'recompete',
  'expiration', 'budget', 'spending', 'award history', 'fpds', 'usaspending',
  'competitor', 'competition', 'govwin', 'market intel', 'capture intel',
]

function hasDeepResearchSignals(query: string): boolean {
  const lower = query.toLowerCase()
  return DEEP_RESEARCH_SIGNALS.some((signal) => lower.includes(signal))
}

// ─── Engine Selection ───────────────────────────────────────

/**
 * Pure function: select research engine based on CUI status, agent type,
 * query content, and API key availability.
 */
export function selectEngine(query: ResearchQuery): ResearchEngine {
  // Rule 1: CUI content → asksage (no-op; CUI handled by pipeline.ts)
  if (query.isCUI) {
    return 'asksage'
  }

  // Rule 2: capture / strategy / blackhat → deep or search based on signals
  if (['capture', 'strategy', 'blackhat'].includes(query.agentType)) {
    if (hasDeepResearchSignals(query.query)) {
      if (PERPLEXITY_API_KEY) return 'perplexity-deep'
      if (ANTHROPIC_API_KEY) return 'anthropic-search'
      return 'none'
    }
    if (ANTHROPIC_API_KEY) return 'anthropic-search'
    return 'none'
  }

  // Rule 3: compliance → anthropic-search (vehicle status, regulation updates)
  if (query.agentType === 'compliance') {
    if (ANTHROPIC_API_KEY) return 'anthropic-search'
    return 'none'
  }

  // Rule 4: pricing → anthropic-search for public data (FPDS, GSA rates)
  if (query.agentType === 'pricing') {
    if (ANTHROPIC_API_KEY) return 'anthropic-search'
    return 'none'
  }

  // Rule 5: writer / orals / contracts → no research (generation tasks)
  return 'none'
}

// ─── Prompt Builders ────────────────────────────────────────

function buildSearchPrompt(query: ResearchQuery): string {
  const parts: string[] = [query.query]

  if (query.opportunityContext) {
    const ctx = query.opportunityContext
    const details: string[] = []
    if (ctx.agency) details.push(`Agency: ${ctx.agency}`)
    if (ctx.vehicle) details.push(`Contract Vehicle: ${ctx.vehicle}`)
    if (ctx.ceiling) details.push(`Ceiling: $${ctx.ceiling.toLocaleString()}`)
    if (details.length > 0) {
      parts.push(`\nOpportunity context:\n${details.join('\n')}`)
    }
  }

  parts.push(
    '\nFocus on: incumbent identification, contract expiration dates, ' +
    'agency budget profile, set-aside type, and recent awards in the same NAICS.' +
    '\nCite SAM.gov, USAspending.gov, and FPDS.gov as primary sources when available.'
  )

  return parts.join('\n')
}

function buildDeepResearchPrompt(query: ResearchQuery): string {
  const parts: string[] = [query.query]

  if (query.opportunityContext) {
    const ctx = query.opportunityContext
    const details: string[] = []
    if (ctx.agency) details.push(`Agency: ${ctx.agency}`)
    if (ctx.vehicle) details.push(`Contract Vehicle: ${ctx.vehicle}`)
    if (ctx.ceiling) details.push(`Ceiling: $${ctx.ceiling.toLocaleString()}`)
    if (details.length > 0) {
      parts.push(`\nOpportunity context:\n${details.join('\n')}`)
    }
  }

  parts.push(
    '\nSynthesize intelligence across multiple sources. Return a structured capture intelligence brief with these sections:' +
    '\n**Incumbent** | **Budget Profile** | **Recompete Timeline** | **Competitive Landscape** | **Recommended Vehicle**' +
    '\nCite SAM.gov, USAspending.gov, FPDS.gov, and agency procurement forecasts as primary sources.'
  )

  return parts.join('\n')
}

// ─── Anthropic Web Search ───────────────────────────────────

async function runAnthropicSearch(query: ResearchQuery): Promise<ResearchResult> {
  const startTime = Date.now()

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_SEARCH_MODEL,
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: buildSearchPrompt(query) }],
      }),
      signal: AbortSignal.timeout(ANTHROPIC_SEARCH_TIMEOUT_MS),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      log.error('Anthropic search API error', { status: response.status, body: errorBody })
      return {
        engine: 'anthropic-search',
        content: '',
        sources: [],
        researchDurationMs: Date.now() - startTime,
        skippedReason: `Anthropic API returned ${response.status}`,
      }
    }

    const data = await response.json()
    let content = ''
    const sources: string[] = []

    for (const block of data.content ?? []) {
      if (block.type === 'text') {
        content += block.text
        if (block.citations) {
          for (const citation of block.citations) {
            if (citation.url && !sources.includes(citation.url)) {
              sources.push(citation.url)
            }
          }
        }
      }
    }

    log.info('Anthropic web search complete', {
      durationMs: Date.now() - startTime,
      contentLength: content.length,
      sourceCount: sources.length,
    })

    return {
      engine: 'anthropic-search',
      content,
      sources,
      researchDurationMs: Date.now() - startTime,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    log.error('Anthropic web search failed', { error: message })
    return {
      engine: 'anthropic-search',
      content: '',
      sources: [],
      researchDurationMs: Date.now() - startTime,
      skippedReason: `Anthropic search failed: ${message}`,
    }
  }
}

// ─── Perplexity Deep Research ───────────────────────────────

async function runPerplexityDeep(query: ResearchQuery): Promise<ResearchResult> {
  const startTime = Date.now()

  // Handle missing API key: fall back to Anthropic search
  if (!PERPLEXITY_API_KEY) {
    log.warn('PERPLEXITY_API_KEY not configured, falling back to anthropic-search')
    if (ANTHROPIC_API_KEY) {
      const fallback = await runAnthropicSearch(query)
      return {
        ...fallback,
        skippedReason: 'PERPLEXITY_API_KEY not configured, fell back to anthropic-search',
      }
    }
    return {
      engine: 'none',
      content: '',
      sources: [],
      researchDurationMs: Date.now() - startTime,
      skippedReason: 'PERPLEXITY_API_KEY not configured and no ANTHROPIC_API_KEY fallback',
    }
  }

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a federal contracting intelligence analyst. ' +
              'Provide sourced, specific intelligence. Always cite sources. ' +
              'Focus on actionable capture intelligence, not general information.',
          },
          { role: 'user', content: buildDeepResearchPrompt(query) },
        ],
      }),
      signal: AbortSignal.timeout(PERPLEXITY_TIMEOUT_MS),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      log.error('Perplexity API error', { status: response.status, body: errorBody })
      return {
        engine: 'perplexity-deep',
        content: '',
        sources: [],
        researchDurationMs: Date.now() - startTime,
        skippedReason: `Perplexity API returned ${response.status}`,
      }
    }

    const data = await response.json()
    const content: string = data.choices?.[0]?.message?.content ?? ''
    const citations: string[] = data.citations ?? []

    log.info('Perplexity deep research complete', {
      durationMs: Date.now() - startTime,
      contentLength: content.length,
      citationCount: citations.length,
    })

    return {
      engine: 'perplexity-deep',
      content,
      sources: citations,
      researchDurationMs: Date.now() - startTime,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    log.error('Perplexity deep research failed', { error: message })
    return {
      engine: 'perplexity-deep',
      content: '',
      sources: [],
      researchDurationMs: Date.now() - startTime,
      skippedReason: `Perplexity research failed: ${message}`,
    }
  }
}

// ─── Main Export ────────────────────────────────────────────

/**
 * Execute pre-agent research. This is the only function agents call.
 *
 * Never throws. On any failure, returns a ResearchResult with empty content
 * and a skippedReason. Never breaks the agent pipeline.
 */
export async function runResearch(query: ResearchQuery): Promise<ResearchResult> {
  try {
    const engine = selectEngine(query)

    // No research needed
    if (engine === 'none') {
      return {
        engine: 'none',
        content: '',
        sources: [],
        researchDurationMs: 0,
        skippedReason: `Agent type '${query.agentType}' does not require live research`,
      }
    }

    // CUI → AskSage handles in pipeline; research router returns empty
    if (engine === 'asksage') {
      return {
        engine: 'asksage',
        content: '',
        sources: [],
        researchDurationMs: 0,
        skippedReason: 'CUI content — route to AskSage in agent pipeline',
      }
    }

    log.info('Starting research', { engine, agentType: query.agentType })

    if (engine === 'anthropic-search') {
      return await runAnthropicSearch(query)
    }

    if (engine === 'perplexity-deep') {
      return await runPerplexityDeep(query)
    }

    return {
      engine: 'none',
      content: '',
      sources: [],
      researchDurationMs: 0,
      skippedReason: `Unknown engine: ${engine}`,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    log.error('Research router error', { error: message })
    return {
      engine: 'none',
      content: '',
      sources: [],
      researchDurationMs: 0,
      skippedReason: message,
    }
  }
}
