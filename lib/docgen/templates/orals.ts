/**
 * Orals Prep deck template — maps raw opportunity + AI data
 * to the OralsData structure for PPTX generation.
 */

import type { OralsData, OralsSlide, OralsQA } from '../pptx-engine'

interface OralsSourceData {
  opportunityTitle: string
  agency: string
  presentationDate?: string
  sections: Array<{
    title: string
    keyPoints: string[]
    notes?: string
  }>
  questions: Array<{
    question: string
    answer: string
    difficulty: 'easy' | 'medium' | 'hard'
  }>
}

/**
 * Build OralsData from raw opportunity and AI-generated content.
 */
export function buildOralsData(source: OralsSourceData): OralsData {
  const slides: OralsSlide[] = source.sections.map((section) => ({
    title: section.title,
    bullets: section.keyPoints,
    speakerNotes: section.notes,
  }))

  const qaItems: OralsQA[] = source.questions.map((q) => ({
    question: q.question,
    suggestedAnswer: q.answer,
    difficulty: q.difficulty,
  }))

  return {
    opportunityTitle: source.opportunityTitle,
    agency: source.agency,
    presentationDate: source.presentationDate,
    slides,
    qaItems,
  }
}
