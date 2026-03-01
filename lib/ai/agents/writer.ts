'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import type { AIResponse } from '@/lib/ai/types'
import { getVoiceProfile, type VoiceProfile } from '@/lib/ai/voice-fingerprint'
import { buildFeedbackContext } from '@/lib/ai/feedback-context'

/**
 * Run the Writer Agent with optional company voice profile.
 * If a voice profile exists, it modifies the system prompt to match
 * the company's writing style (anti-homogenization).
 */
export async function runWriterAgent(context: {
  sectionTitle: string
  requirements: string[]
  rfpContext: string
  playbookContent: string[]
  opportunityId: string
  useVoiceProfile?: boolean
}): Promise<AIResponse> {
  const requirementsList = context.requirements
    .map((r, i) => `${i + 1}. ${r}`)
    .join('\n')

  const playbookSection =
    context.playbookContent.length > 0
      ? `\n\nRelevant past performance and boilerplate content:\n${context.playbookContent.join('\n\n---\n\n')}`
      : ''

  // Load voice profile if available and requested
  const voiceProfile =
    context.useVoiceProfile !== false ? await getVoiceProfile() : null

  const voiceInstructions = voiceProfile
    ? buildVoiceInstructions(voiceProfile)
    : ''

  const prompt = `Draft proposal content for the following section:

**Section**: ${context.sectionTitle}

**Requirements to address**:
${requirementsList}

**RFP Context**:
${context.rfpContext.slice(0, 4000)}
${playbookSection}

Please write a professional proposal section that:
1. Directly addresses each requirement listed above
2. Uses active voice and quantitative evidence where possible
3. Follows government proposal writing conventions
4. Includes clear topic sentences for each paragraph
5. References relevant past performance where applicable

For each paragraph, provide a brief "Because" explanation of why you wrote it that way.

Format: Write each paragraph separately, with a "Because:" line after it.`

  const baseSystemPrompt =
    'You are an expert government proposal writer following the Shipley methodology. Write compelling, compliant proposal content that directly addresses every requirement. Use specific, quantitative language. Avoid vague claims.'

  // Build system prompt: base + voice profile + feedback context
  const feedbackCtx = await buildFeedbackContext('writer')
  const promptParts = [baseSystemPrompt]
  if (voiceInstructions) promptParts.push(voiceInstructions)
  if (feedbackCtx) promptParts.push(feedbackCtx.instructions)

  return aiRequest({
    taskType: 'writer',
    prompt,
    opportunityId: context.opportunityId,
    systemPrompt: promptParts.join('\n\n'),
  })
}

/**
 * Run the Writer Agent WITHOUT voice profile (for A/B comparison).
 */
export async function runWriterAgentGeneric(context: {
  sectionTitle: string
  requirements: string[]
  rfpContext: string
  playbookContent: string[]
  opportunityId: string
}): Promise<AIResponse> {
  return runWriterAgent({ ...context, useVoiceProfile: false })
}

// ─── Voice Profile Integration ──────────────────────────────

function buildVoiceInstructions(profile: VoiceProfile): string {
  const parts: string[] = []

  // Custom prompt modifier (highest priority)
  if (profile.promptModifier) {
    parts.push(`COMPANY VOICE: ${profile.promptModifier}`)
  }

  // Structural guidance
  const { structure } = profile
  parts.push(
    `TARGET STYLE: Average sentence length ~${Math.round(structure.avgSentenceLength)} words. ` +
    `Active voice ratio: ${Math.round(structure.activeVoiceRatio * 100)}%. ` +
    `Heading style: ${structure.headingStyle}.`
  )

  // Tone guidance
  const { tone } = profile
  parts.push(
    `TONE: Formality ${tone.formalityScore}/100, Technical depth ${tone.technicalDepth}/100, ` +
    `Assertiveness ${tone.assertiveness}/100. Persuasion style: ${tone.persuasionStyle}.`
  )

  // Terminology
  if (profile.terminology.length > 0) {
    parts.push(
      `PREFERRED TERMINOLOGY: ${profile.terminology.slice(0, 20).join(', ')}`
    )
  }

  // Sample phrases
  if (profile.samplePhrases.length > 0) {
    parts.push(
      `CHARACTERISTIC PHRASES (use similar phrasing): ${profile.samplePhrases.slice(0, 5).map((p) => `"${p}"`).join(', ')}`
    )
  }

  // Avoided terms
  if (profile.vocabulary.avoidedTerms.length > 0) {
    parts.push(
      `AVOID THESE GENERIC PHRASES: ${profile.vocabulary.avoidedTerms.slice(0, 10).join(', ')}`
    )
  }

  return parts.join('\n')
}
