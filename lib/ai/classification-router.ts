/**
 * Classification Router — Server-side middleware.
 * Classifies AI requests by data sensitivity before routing.
 * CUI/OPSEC → AskSage only. Unclassified → configurable.
 */
'use server'

import type { ClassificationLevel, ClassificationResult, AIEngine } from './types'
import {
  CLASSIFICATION_RULES,
  getHighestClassification,
} from './classification-rules'

/**
 * Classify content by scanning for CUI markings, PII, OPSEC indicators.
 */
export async function classifyRequest(
  content: string,
  context?: string
): Promise<ClassificationResult> {
  const fullText = [content, context].filter(Boolean).join(' ')

  const matchedRules = CLASSIFICATION_RULES.filter((rule) =>
    rule.pattern.test(fullText)
  )

  if (matchedRules.length === 0) {
    return {
      level: 'UNCLASSIFIED',
      reasons: [],
      patterns_matched: [],
    }
  }

  const matchedLevels = matchedRules.map((r) => r.level)
  const level = getHighestClassification(matchedLevels)

  return {
    level,
    reasons: matchedRules.map((r) => r.description),
    patterns_matched: matchedRules.map((r) => r.pattern.source),
  }
}

/**
 * Determine allowed engine based on classification level.
 * CUI and above MUST route through AskSage only.
 */
export async function getAllowedEngine(
  classification: ClassificationLevel
): Promise<AIEngine> {
  switch (classification) {
    case 'CUI':
    case 'CUI//SP-PROPIN':
    case 'OPSEC':
      return 'asksage'
    case 'UNCLASSIFIED':
    default:
      // Unclassified can use either engine
      // Default to AskSage for consistency
      return 'asksage'
  }
}

/**
 * Check if a classification level requires CUI protections.
 */
export async function requiresCuiProtection(
  level: ClassificationLevel
): Promise<boolean> {
  return level !== 'UNCLASSIFIED'
}
