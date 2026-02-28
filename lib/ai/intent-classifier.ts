/**
 * Intent Classifier — deterministic regex/keyword engine for auto-routing.
 * Sprint 28: Intelligent AI Chat UX (T-28.1)
 *
 * Pure function, no async, no LLM. Classifies user messages to the correct
 * AI agent using keyword/regex pattern matching.
 */

import { INTENT_PATTERNS, AGENT_LABELS } from './intent-patterns'

export interface ClassificationResult {
  agent: string
  confidence: number
  reasoning: string
}

const FALLBACK_AGENT = 'writer'
const MIN_SCORE_THRESHOLD = 2
const AUTO_ROUTE_CONFIDENCE = 0.6

export { AUTO_ROUTE_CONFIDENCE }

export function classifyIntent(
  message: string,
  allowedAgents: string[]
): ClassificationResult {
  const normalized = message.toLowerCase().replace(/[^\w\s&/-]/g, ' ')

  const scores: Record<string, number> = {}
  const matchDetails: Record<string, string[]> = {}

  for (const [agent, pattern] of Object.entries(INTENT_PATTERNS)) {
    let score = 0
    const matches: string[] = []

    // Keyword matching: +3 per hit
    for (const keyword of pattern.keywords) {
      if (normalized.includes(keyword)) {
        score += 3
        matches.push(`keyword: "${keyword}"`)
      }
    }

    // Regex matching: +2 per hit
    for (const regex of pattern.patterns) {
      if (regex.test(message)) {
        score += 2
        matches.push(`pattern: ${regex.source}`)
      }
    }

    if (score > 0) {
      scores[agent] = score
      matchDetails[agent] = matches
    }
  }

  // Sort by score descending
  const ranked = Object.entries(scores).sort(([, a], [, b]) => b - a)

  // If no matches at all, fallback
  if (ranked.length === 0) {
    if (allowedAgents.includes(FALLBACK_AGENT)) {
      return {
        agent: FALLBACK_AGENT,
        confidence: 0.4,
        reasoning: 'No specific intent detected. Routing to Writer Agent.',
      }
    }
    // If writer isn't allowed, use first allowed agent
    return {
      agent: allowedAgents[0] ?? 'general',
      confidence: 0.3,
      reasoning: `No specific intent detected. Routing to ${AGENT_LABELS[allowedAgents[0]] ?? 'General Assistant'}.`,
    }
  }

  const [topAgent, topScore] = ranked[0]
  const secondScore = ranked.length > 1 ? ranked[1][1] : 0

  // Check if top agent is allowed
  if (!allowedAgents.includes(topAgent)) {
    const fallback = allowedAgents.includes(FALLBACK_AGENT)
      ? FALLBACK_AGENT
      : allowedAgents[0] ?? 'general'
    return {
      agent: fallback,
      confidence: 0.4,
      reasoning: `${AGENT_LABELS[topAgent] ?? topAgent} not available for your role. Routing to ${AGENT_LABELS[fallback]}.`,
    }
  }

  // Score below threshold → fallback
  if (topScore < MIN_SCORE_THRESHOLD) {
    const fallback = allowedAgents.includes(FALLBACK_AGENT)
      ? FALLBACK_AGENT
      : topAgent
    return {
      agent: fallback,
      confidence: 0.4,
      reasoning: 'Low confidence match. Routing to Writer Agent.',
    }
  }

  // Compute normalized relative confidence
  const confidence = Math.min(topScore / (topScore + secondScore + 1), 1.0)

  const topMatches = matchDetails[topAgent] ?? []
  const reasoning = `Matched ${AGENT_LABELS[topAgent]}: ${topMatches.slice(0, 3).join(', ')}`

  return {
    agent: topAgent,
    confidence,
    reasoning,
  }
}
