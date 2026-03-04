/**
 * Shared classification helper for all AI providers.
 * Delegates to the existing classification-rules engine.
 */

import {
  CLASSIFICATION_RULES,
  getHighestClassification,
} from '../classification-rules'
import type { ProviderClassifyRequest, ProviderClassifyResponse, ProviderId } from './interface'

export function classifyContent(
  request: ProviderClassifyRequest,
  providerId: ProviderId
): ProviderClassifyResponse {
  const fullText = [request.content, request.context].filter(Boolean).join(' ')

  const matchedRules = CLASSIFICATION_RULES.filter((rule) =>
    rule.pattern.test(fullText)
  )

  if (matchedRules.length === 0) {
    return {
      classification: {
        level: 'UNCLASSIFIED',
        reasons: [],
        patterns_matched: [],
      },
      provider: providerId,
    }
  }

  const matchedLevels = matchedRules.map((r) => r.level)
  const level = getHighestClassification(matchedLevels)

  return {
    classification: {
      level,
      reasons: matchedRules.map((r) => r.description),
      patterns_matched: matchedRules.map((r) => r.pattern.source),
    },
    provider: providerId,
  }
}
