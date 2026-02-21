'use server'

import { aiRequest } from '@/lib/ai/pipeline'
import type { AIResponse } from '@/lib/ai/types'

export async function runWriterAgent(context: {
  sectionTitle: string
  requirements: string[]
  rfpContext: string
  playbookContent: string[]
  opportunityId: string
}): Promise<AIResponse> {
  const requirementsList = context.requirements
    .map((r, i) => `${i + 1}. ${r}`)
    .join('\n')

  const playbookSection =
    context.playbookContent.length > 0
      ? `\n\nRelevant past performance and boilerplate content:\n${context.playbookContent.join('\n\n---\n\n')}`
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

  return aiRequest({
    taskType: 'writer',
    prompt,
    opportunityId: context.opportunityId,
    systemPrompt:
      'You are an expert government proposal writer following the Shipley methodology. Write compelling, compliant proposal content that directly addresses every requirement. Use specific, quantitative language. Avoid vague claims.',
  })
}
