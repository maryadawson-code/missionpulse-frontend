/**
 * Intent Patterns — keyword→agent mapping for deterministic intent classification.
 * Sprint 28: Intelligent AI Chat UX (T-28.1)
 */

export const AGENT_LABELS: Record<string, string> = {
  general: 'General Assistant',
  capture: 'Capture Agent',
  writer: 'Writer Agent',
  compliance: 'Compliance Agent',
  pricing: 'Pricing Agent',
  strategy: 'Strategy Agent',
  blackhat: 'Black Hat Agent',
  contracts: 'Contracts Agent',
  orals: 'Orals Coach',
}

export const AGENT_COLORS: Record<string, string> = {
  general: 'bg-gray-400',
  capture: 'bg-blue-400',
  writer: 'bg-green-400',
  compliance: 'bg-orange-400',
  pricing: 'bg-yellow-400',
  strategy: 'bg-purple-400',
  blackhat: 'bg-red-400',
  contracts: 'bg-teal-400',
  orals: 'bg-pink-400',
}

interface IntentPattern {
  keywords: string[]
  patterns: RegExp[]
  weight: number
}

export const INTENT_PATTERNS: Record<string, IntentPattern> = {
  capture: {
    keywords: [
      'pwin', 'p-win', 'win probability', 'competitive landscape',
      'capture strategy', 'bid/no-bid', 'bid no bid', 'gate review',
      'capture plan', 'opportunity assessment', 'go/no-go', 'go no go',
    ],
    patterns: [
      /\bscore\b.*\b(opportunity|opp)\b/i,
      /\b(assess|evaluate)\b.*\b(chance|likelihood|probability)\b/i,
      /\bshould\s+we\s+(bid|pursue)\b/i,
    ],
    weight: 3,
  },
  strategy: {
    keywords: [
      'discriminator', 'win theme', 'win themes', 'section m',
      'ghost', 'ghosting', 'competitive position', 'teaming',
      'teaming partner', 'teaming strategy', 'value proposition',
      'differentiator', 'strategic advantage',
    ],
    patterns: [
      /\b(develop|create|build)\b.*\b(strategy|theme)\b/i,
      /\b(position|differentiate)\b.*\b(against|from)\b/i,
      /\bevaluation\s+(criteria|factor)/i,
    ],
    weight: 3,
  },
  writer: {
    keywords: [
      'draft', 'write section', 'proposal text', 'volume',
      'executive summary', 'past performance', 'technical approach',
      'management approach', 'staffing plan', 'key personnel',
      'write', 'rewrite', 'edit section', 'narrative',
    ],
    patterns: [
      /\b(draft|write|compose|author)\b.*\b(section|volume|narrative|approach)\b/i,
      /\b(improve|revise|rewrite)\b.*\b(text|content|draft|section)\b/i,
      /\bexecutive\s+summary\b/i,
    ],
    weight: 2,
  },
  compliance: {
    keywords: [
      'requirement', 'requirements', 'shall', 'must',
      'compliance matrix', 'rfp', 'solicitation', 'l section',
      'm section', 'section l', 'section m', 'compliance check',
      'traceability', 'cross-reference', 'shred',
    ],
    patterns: [
      /\b(check|verify|validate|review)\b.*\bcomplian(ce|t)\b/i,
      /\b(extract|parse|analyze)\b.*\brequirement/i,
      /\bshall\b.*\brequirement/i,
      /\brfp\b.*\b(analysis|review|shred)/i,
    ],
    weight: 3,
  },
  pricing: {
    keywords: [
      'price', 'pricing', 'cost', 'boe', 'basis of estimate',
      'wrap rate', 'lcat', 'labor category', 'fte', 'cost volume',
      'price to win', 'rate', 'indirect rate', 'fringe', 'overhead',
      'g&a', 'fee', 'profit', 'cost model',
    ],
    patterns: [
      /\b(calculate|estimate|compute)\b.*\b(cost|price|rate)\b/i,
      /\b(labor|staff)\b.*\b(rate|category|cost)\b/i,
      /\bbasis\s+of\s+estimate\b/i,
    ],
    weight: 3,
  },
  blackhat: {
    keywords: [
      'black hat', 'blackhat', 'competitor', 'competitors',
      'weakness', 'counter', 'incumbent', 'protest',
      'competitor analysis', 'competitive intel', 'counter strategy',
      'competitor weakness', 'incumbent advantage',
    ],
    patterns: [
      /\b(analyze|assess|identify)\b.*\bcompetitor/i,
      /\bincumbent\b.*\b(weakness|strength|advantage)\b/i,
      /\b(counter|attack)\b.*\b(strategy|plan)\b/i,
    ],
    weight: 3,
  },
  contracts: {
    keywords: [
      'far', 'dfars', 'clause', 'clauses', 't&c', 'terms',
      'terms and conditions', 'contract type', 'idiq', 'task order',
      'contract clause', 'regulatory', 'modification', 'mod',
      'subcontract', 'teaming agreement', 'nda', 'cda',
    ],
    patterns: [
      /\b(far|dfars)\s+\d/i,
      /\bcontract\b.*\b(type|clause|term|risk)\b/i,
      /\b(review|analyze)\b.*\b(terms|t&c|clause)\b/i,
    ],
    weight: 3,
  },
  orals: {
    keywords: [
      'oral', 'orals', 'presentation', 'evaluator',
      'q&a', 'slide', 'slides', 'speaker', 'rehearsal',
      'oral presentation', 'oral defense', 'mock eval',
      'dry run', 'panel', 'briefing',
    ],
    patterns: [
      /\b(prepare|practice|rehearse)\b.*\b(oral|presentation|brief)\b/i,
      /\bevaluator\b.*\b(question|q&a)\b/i,
      /\b(oral|presentation)\b.*\b(outline|structure|slide)\b/i,
    ],
    weight: 3,
  },
}
