/**
 * Suggested Prompts — role × Shipley phase context-aware prompt chips.
 * Sprint 28: Intelligent AI Chat UX (T-28.3)
 */

interface PromptEntry {
  label: string
  prompt: string
  agent: string
}

const PHASE_PROMPTS: Record<string, PromptEntry[]> = {
  // Gate 1 — Prospect / Identification
  'Gate 1': [
    { label: 'Score pWin', prompt: 'Score this opportunity\'s probability of win (pWin) and explain key factors.', agent: 'capture' },
    { label: 'Identify competitors', prompt: 'Identify potential competitors for this opportunity and their likely strategies.', agent: 'blackhat' },
    { label: 'Bid/No-bid analysis', prompt: 'Perform a bid/no-bid analysis for this opportunity.', agent: 'capture' },
    { label: 'Review solicitation', prompt: 'Summarize the key requirements from this solicitation.', agent: 'compliance' },
    { label: 'Initial capture plan', prompt: 'Draft an initial capture strategy for this opportunity.', agent: 'capture' },
    { label: 'Market research', prompt: 'What contract vehicles and set-asides apply to this opportunity?', agent: 'contracts' },
  ],

  // Gate 2 — Qualify / Pursuit
  'Gate 2': [
    { label: 'Compliance check', prompt: 'Analyze the compliance requirements from this RFP.', agent: 'compliance' },
    { label: 'Develop win themes', prompt: 'Develop initial win themes and discriminators for this opportunity.', agent: 'strategy' },
    { label: 'Competitor weaknesses', prompt: 'Analyze the incumbent\'s weaknesses we can exploit.', agent: 'blackhat' },
    { label: 'Teaming strategy', prompt: 'Recommend teaming partners and subcontracting strategy.', agent: 'strategy' },
    { label: 'Price-to-win', prompt: 'Develop a preliminary price-to-win estimate.', agent: 'pricing' },
    { label: 'Contract type analysis', prompt: 'Analyze the contract type and its implications for our bid.', agent: 'contracts' },
  ],

  // Gate 3 — Capture / Solution
  'Gate 3': [
    { label: 'Draft exec summary', prompt: 'Draft an executive summary for this proposal.', agent: 'writer' },
    { label: 'Generate BOE', prompt: 'Generate a basis of estimate (BOE) template for this opportunity.', agent: 'pricing' },
    { label: 'Section M alignment', prompt: 'Map our discriminators to Section M evaluation criteria.', agent: 'strategy' },
    { label: 'Ghost the competition', prompt: 'Develop ghost strategies against our top competitors.', agent: 'blackhat' },
    { label: 'Technical approach', prompt: 'Draft the technical approach section outline.', agent: 'writer' },
    { label: 'Labor categories', prompt: 'Recommend labor categories and staffing levels for the BOE.', agent: 'pricing' },
  ],

  // Gate 4 — Proposal Development
  'Gate 4': [
    { label: 'Review compliance', prompt: 'Review this section for compliance with RFP requirements.', agent: 'compliance' },
    { label: 'Draft tech approach', prompt: 'Draft the detailed technical approach section.', agent: 'writer' },
    { label: 'Past performance', prompt: 'Draft a past performance narrative highlighting relevant experience.', agent: 'writer' },
    { label: 'Refine win themes', prompt: 'Refine and strengthen our win themes for the proposal narrative.', agent: 'strategy' },
    { label: 'Cost volume review', prompt: 'Review the cost volume for consistency and competitiveness.', agent: 'pricing' },
    { label: 'FAR clause review', prompt: 'Review applicable FAR/DFARS clauses for this contract.', agent: 'contracts' },
    { label: 'Management approach', prompt: 'Draft the management approach section.', agent: 'writer' },
  ],

  // Gate 5 — Review / Orals
  'Gate 5': [
    { label: 'Evaluator Q&A', prompt: 'Generate likely evaluator questions and prepare answers.', agent: 'orals' },
    { label: 'Presentation outline', prompt: 'Prepare an oral presentation outline for the evaluation panel.', agent: 'orals' },
    { label: 'Rehearsal prep', prompt: 'Create a rehearsal plan with key talking points for each speaker.', agent: 'orals' },
    { label: 'Final compliance check', prompt: 'Perform a final compliance cross-reference check before submission.', agent: 'compliance' },
    { label: 'Strengthen narrative', prompt: 'Review and strengthen the proposal narrative for persuasiveness.', agent: 'writer' },
    { label: 'Counter competitor', prompt: 'Finalize counter-strategies against competitor strengths.', agent: 'blackhat' },
  ],

  // Gate 6 — Post-Submit / Transition
  'Gate 6': [
    { label: 'Contract clauses', prompt: 'Analyze the contract clauses and identify risk areas.', agent: 'contracts' },
    { label: 'T&C risks', prompt: 'Review terms and conditions for potential risks and negotiation points.', agent: 'contracts' },
    { label: 'Lessons learned', prompt: 'Summarize lessons learned from this proposal effort.', agent: 'capture' },
    { label: 'Transition plan', prompt: 'Draft a transition plan outline for contract start-up.', agent: 'writer' },
    { label: 'Protest analysis', prompt: 'Assess the likelihood and grounds for a potential protest.', agent: 'blackhat' },
    { label: 'Mod preparation', prompt: 'Prepare for potential contract modifications and change orders.', agent: 'contracts' },
  ],
}

const GENERAL_PROMPTS: PromptEntry[] = [
  { label: 'Score an opportunity', prompt: 'Help me assess the probability of win for an opportunity.', agent: 'capture' },
  { label: 'Draft proposal section', prompt: 'Help me draft a proposal section.', agent: 'writer' },
  { label: 'Check compliance', prompt: 'Help me verify compliance with RFP requirements.', agent: 'compliance' },
  { label: 'Analyze competitors', prompt: 'Help me analyze competitors for an upcoming bid.', agent: 'blackhat' },
  { label: 'Review pricing', prompt: 'Help me review the pricing strategy and cost model.', agent: 'pricing' },
  { label: 'Develop strategy', prompt: 'Help me develop win themes and discriminators.', agent: 'strategy' },
  { label: 'Review contract', prompt: 'Help me review contract terms and FAR/DFARS clauses.', agent: 'contracts' },
  { label: 'Prep for orals', prompt: 'Help me prepare for an oral presentation.', agent: 'orals' },
]

export function getSuggestedPrompts(
  role: string,
  phase: string | null,
  allowedAgents: string[],
  opportunityTitle?: string | null
): PromptEntry[] {
  const candidates = phase && PHASE_PROMPTS[phase]
    ? PHASE_PROMPTS[phase]
    : GENERAL_PROMPTS

  // Filter to prompts whose target agent is allowed for this role
  const filtered = candidates.filter((p) => allowedAgents.includes(p.agent))

  // If opportunity title available, contextualize generic "this opportunity" references
  const contextualized = opportunityTitle
    ? filtered.map((p) => ({
        ...p,
        prompt: p.prompt.replace(/this opportunity/gi, `"${opportunityTitle}"`),
      }))
    : filtered

  // Return top 4
  return contextualized.slice(0, 4)
}
