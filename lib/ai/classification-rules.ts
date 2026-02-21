/**
 * Classification rules for AI request content scanning.
 * Detects CUI markings, PII patterns, OPSEC indicators.
 */

export interface ClassificationRule {
  pattern: RegExp
  level: 'CUI' | 'CUI//SP-PROPIN' | 'OPSEC'
  description: string
}

export const CLASSIFICATION_RULES: ClassificationRule[] = [
  // CUI Markings
  {
    pattern: /\bCUI\b/i,
    level: 'CUI',
    description: 'CUI marking detected',
  },
  {
    pattern: /\bCUI\/\/SP-PROPIN\b/i,
    level: 'CUI//SP-PROPIN',
    description: 'CUI SP-PROPIN marking detected',
  },
  {
    pattern: /\bCONTROLLED UNCLASSIFIED\b/i,
    level: 'CUI',
    description: 'Controlled Unclassified marking',
  },

  // OPSEC Indicators
  {
    pattern: /\bOPSEC\b/,
    level: 'OPSEC',
    description: 'OPSEC marking detected',
  },
  {
    pattern: /\bFOR OFFICIAL USE ONLY\b/i,
    level: 'CUI',
    description: 'FOUO marking detected',
  },
  {
    pattern: /\bSENSITIVE BUT UNCLASSIFIED\b/i,
    level: 'CUI',
    description: 'SBU marking detected',
  },

  // Proprietary Content
  {
    pattern: /\bPROPRIETARY\b/i,
    level: 'CUI//SP-PROPIN',
    description: 'Proprietary marking detected',
  },
  {
    pattern: /\bTRADE SECRET\b/i,
    level: 'CUI//SP-PROPIN',
    description: 'Trade secret marking detected',
  },
  {
    pattern: /\bCOMPETITION SENSITIVE\b/i,
    level: 'CUI//SP-PROPIN',
    description: 'Competition-sensitive content',
  },

  // PII Patterns
  {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/,
    level: 'CUI',
    description: 'SSN pattern detected',
  },
  {
    pattern: /\bSocial Security\b/i,
    level: 'CUI',
    description: 'SSN reference detected',
  },

  // Pricing / Cost Data
  {
    pattern: /\b(wrap rate|labor rate|indirect rate|overhead rate)\b/i,
    level: 'CUI//SP-PROPIN',
    description: 'Pricing rate data detected',
  },
  {
    pattern: /\b(LCAT|labor category)\b/i,
    level: 'CUI//SP-PROPIN',
    description: 'Labor category data detected',
  },
  {
    pattern: /\bBOE\b/,
    level: 'CUI//SP-PROPIN',
    description: 'Basis of Estimate data detected',
  },

  // Clearance / Access
  {
    pattern: /\b(TS\/SCI|TOP SECRET|SECRET clearance)\b/i,
    level: 'OPSEC',
    description: 'Security clearance reference detected',
  },
]

/**
 * Get the highest classification level from a set of matched levels.
 */
export function getHighestClassification(
  levels: ('CUI' | 'CUI//SP-PROPIN' | 'OPSEC')[]
): 'CUI' | 'CUI//SP-PROPIN' | 'OPSEC' {
  const priority: Record<string, number> = {
    OPSEC: 3,
    'CUI//SP-PROPIN': 2,
    CUI: 1,
  }

  return levels.reduce((highest, current) => {
    return (priority[current] ?? 0) > (priority[highest] ?? 0)
      ? current
      : highest
  }, levels[0])
}
