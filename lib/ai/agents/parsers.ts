// Pure parsing functions — NOT 'use server' (these are sync, client-importable)

// ── Capture ─────────────────────────────────────────────

export interface CaptureAnalysisResult {
  pwin: number
  winThemes: string[]
  riskFactors: string[]
  competitiveLandscape: string
}

export function parseCaptureAnalysis(
  content: string
): CaptureAnalysisResult {
  const pwinMatch = content.match(/(\d{1,3})%/)
  const pwin = pwinMatch ? parseInt(pwinMatch[1], 10) : 50

  const sections = content.split(/\*\*([^*]+)\*\*/)

  const winThemes: string[] = []
  const riskFactors: string[] = []
  let competitiveLandscape = ''
  let currentSection = ''

  for (const section of sections) {
    const trimmed = section.trim().toLowerCase()
    if (trimmed.includes('win theme')) {
      currentSection = 'themes'
    } else if (trimmed.includes('risk')) {
      currentSection = 'risks'
    } else if (trimmed.includes('competitive') || trimmed.includes('landscape')) {
      currentSection = 'landscape'
    } else if (currentSection === 'themes') {
      const items = section
        .split('\n')
        .map((l) => l.replace(/^[\d.)\-*]+\s*/, '').trim())
        .filter((l) => l.length > 10)
      winThemes.push(...items.slice(0, 5))
    } else if (currentSection === 'risks') {
      const items = section
        .split('\n')
        .map((l) => l.replace(/^[\d.)\-*]+\s*/, '').trim())
        .filter((l) => l.length > 10)
      riskFactors.push(...items.slice(0, 5))
    } else if (currentSection === 'landscape') {
      competitiveLandscape = section.trim()
    }
  }

  return {
    pwin: Math.min(100, Math.max(0, pwin)),
    winThemes: winThemes.length > 0 ? winThemes : ['Analysis pending'],
    riskFactors: riskFactors.length > 0 ? riskFactors : ['Analysis pending'],
    competitiveLandscape:
      competitiveLandscape || 'Competitive landscape analysis pending',
  }
}

// ── Compliance ──────────────────────────────────────────

export interface ExtractedRequirement {
  reference: string
  requirement: string
  section: string
  priority: string
  confidence: 'high' | 'medium' | 'low'
  because: string
}

export function parseExtractedRequirements(
  content: string
): ExtractedRequirement[] {
  const requirements: ExtractedRequirement[] = []

  const blocks = content.split(/(?=\d+\.\s|\bREQ-\d+)/)

  for (const block of blocks) {
    if (block.trim().length < 20) continue

    const refMatch = block.match(/REQ-(\d+)|(\d+)\./)?.[0] ?? ''
    const reference =
      refMatch.startsWith('REQ') ? refMatch : `REQ-${String(requirements.length + 1).padStart(3, '0')}`

    const reqMatch = block.match(
      /\*\*Requirement\*\*[:\s]*([\s\S]+?)(?=\*\*|$)/
    )
    const sectionMatch = block.match(
      /\*\*Section\*\*[:\s]*([\s\S]+?)(?=\*\*|$)/
    )
    const priorityMatch = block.match(
      /\*\*Priority\*\*[:\s]*([\s\S]+?)(?=\*\*|$)/
    )
    const confMatch = block.match(
      /\*\*Confidence\*\*[:\s]*([\s\S]+?)(?=\*\*|$)/
    )
    const becauseMatch = block.match(
      /\*\*Because\*\*[:\s]*([\s\S]+?)(?=\*\*|$)/
    )

    const requirementText =
      reqMatch?.[1]?.trim() ?? block.replace(/^[\d.\s]+/, '').trim().slice(0, 300)
    if (requirementText.length < 10) continue

    const priorityRaw = priorityMatch?.[1]?.trim() ?? 'Medium'
    const confRaw = confMatch?.[1]?.trim().toLowerCase() ?? 'medium'

    requirements.push({
      reference,
      requirement: requirementText,
      section: sectionMatch?.[1]?.trim() ?? 'Other',
      priority: ['Critical', 'High', 'Medium', 'Low'].includes(priorityRaw)
        ? priorityRaw
        : 'Medium',
      confidence: confRaw.includes('high')
        ? 'high'
        : confRaw.includes('low')
          ? 'low'
          : 'medium',
      because:
        becauseMatch?.[1]?.trim() ??
        'Identified as a compliance requirement based on solicitation language.',
    })
  }

  return requirements
}

// ── Writer ──────────────────────────────────────────────

export interface WriterParagraph {
  id: string
  content: string
  because: string
  confidence: 'high' | 'medium' | 'low'
}

export function parseWriterOutput(content: string): WriterParagraph[] {
  const paragraphs: WriterParagraph[] = []

  const blocks = content.split(/(?=Because:)/i)

  let currentContent = ''
  for (const block of blocks) {
    if (block.toLowerCase().startsWith('because:')) {
      const because = block.replace(/^because:\s*/i, '').trim()
      if (currentContent) {
        paragraphs.push({
          id: crypto.randomUUID(),
          content: currentContent.trim(),
          because: because.split('\n')[0].trim(),
          confidence: 'high',
        })
        currentContent = ''
      }
    } else {
      currentContent += block
    }
  }

  if (currentContent.trim().length > 20) {
    paragraphs.push({
      id: crypto.randomUUID(),
      content: currentContent.trim(),
      because: 'Generated to address section requirements.',
      confidence: 'medium',
    })
  }

  return paragraphs
}

// ── Orals ───────────────────────────────────────────────

export interface OralsQA {
  id: string
  question: string
  suggestedAnswer: string
  coachingTip: string
  because: string
}

export function parseOralsOutput(content: string): OralsQA[] {
  const qas: OralsQA[] = []

  const blocks = content.split(/(?=\d+\.\s|\bQ\d*[:.]\s)/i)

  for (const block of blocks) {
    if (block.trim().length < 30) continue

    const lines = block.split('\n').filter((l) => l.trim())
    if (lines.length < 2) continue

    const question = lines[0].replace(/^\d+\.\s*|\bQ\d*[:.]\s*/i, '').trim()
    if (question.length < 15) continue

    let answer = ''
    let coaching = ''
    let because = ''

    for (const line of lines.slice(1)) {
      const lower = line.toLowerCase().trim()
      if (
        lower.startsWith('answer') ||
        lower.startsWith('**answer') ||
        lower.startsWith('suggested answer') ||
        lower.startsWith('**suggested')
      ) {
        answer = line.replace(/^\*?\*?(suggested )?answer\*?\*?[:\s]*/i, '').trim()
      } else if (
        lower.startsWith('coaching') ||
        lower.startsWith('**coaching') ||
        lower.startsWith('tip')
      ) {
        coaching = line.replace(/^\*?\*?coaching( tip)?\*?\*?[:\s]*/i, '').trim()
      } else if (lower.startsWith('because') || lower.startsWith('**because')) {
        because = line.replace(/^\*?\*?because\*?\*?[:\s]*/i, '').trim()
      } else if (!answer) {
        answer += ' ' + line.trim()
      }
    }

    qas.push({
      id: crypto.randomUUID(),
      question,
      suggestedAnswer: answer.trim() || 'See detailed answer framework.',
      coachingTip: coaching || 'Be specific, use quantitative examples.',
      because: because || 'Evaluators commonly probe this area.',
    })
  }

  return qas
}
