/**
 * Company Voice Fingerprint — Anti-Homogenization Engine
 *
 * Analyzes uploaded past proposals to extract writing patterns:
 * - Vocabulary frequency (domain-specific terminology)
 * - Sentence structure patterns (average length, complexity)
 * - Tone markers (formality level, active/passive ratio)
 * - Domain terminology (GovCon-specific terms, acronyms)
 *
 * The voice profile is applied to all Writer Agent output to prevent
 * generic "AI-sounding" text (Lohfeld's "regression to average").
 *
 * Profile stored in companies.features.voice_profile (JSONB).
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { aiRequest } from '@/lib/ai/pipeline'

// ─── Types ───────────────────────────────────────────────────

export interface VoiceProfile {
  id: string
  companyId: string
  createdAt: string
  updatedAt: string
  sourceDocCount: number
  vocabulary: VocabularyProfile
  structure: StructureProfile
  tone: ToneProfile
  terminology: string[]
  samplePhrases: string[]
  promptModifier: string
}

export interface VocabularyProfile {
  avgWordLength: number
  uniqueWordRatio: number
  topTerms: Array<{ term: string; frequency: number }>
  avoidedTerms: string[]
  preferredTransitions: string[]
}

export interface StructureProfile {
  avgSentenceLength: number
  avgParagraphLength: number
  activeVoiceRatio: number
  listUsageFrequency: number
  headingStyle: 'numbered' | 'descriptive' | 'mixed'
}

export interface ToneProfile {
  formalityScore: number // 0-100
  technicalDepth: number // 0-100
  assertiveness: number // 0-100
  evidenceDensity: number // 0-100
  persuasionStyle: 'data-driven' | 'narrative' | 'hybrid'
}

// ─── Voice Profile Generation ───────────────────────────────

/**
 * Generate a voice fingerprint from uploaded documents.
 * Requires at least 3 documents for meaningful pattern extraction.
 */
export async function generateVoiceProfile(
  documentTexts: string[]
): Promise<{ profile: VoiceProfile | null; error?: string }> {
  if (documentTexts.length < 3) {
    return { profile: null, error: 'At least 3 documents required for voice profiling' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { profile: null, error: 'Not authenticated' }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profileData?.company_id) return { profile: null, error: 'No company' }

  // RBAC: only executive/operations can create voice profiles
  const allowedRoles = ['executive', 'operations', 'admin', 'CEO', 'COO']
  if (!allowedRoles.includes(profileData.role ?? '')) {
    return { profile: null, error: 'Insufficient permissions' }
  }

  try {
    // Step 1: Statistical analysis
    const stats = analyzeDocumentStats(documentTexts)

    // Step 2: AI-powered style extraction
    const combinedSample = documentTexts
      .map((t) => t.slice(0, 2000))
      .join('\n\n---DOCUMENT BREAK---\n\n')

    const aiResult = await aiRequest({
      taskType: 'writer',
      prompt: `Analyze the following proposal writing samples and extract the company's unique writing voice.

Identify:
1. **Vocabulary patterns**: Frequently used domain terms, preferred phrases, transition words
2. **Tone**: Formality level (0-100), technical depth (0-100), assertiveness (0-100)
3. **Persuasion style**: data-driven, narrative, or hybrid
4. **Sample phrases**: 5-10 characteristic phrases from the documents
5. **Terms to avoid**: Generic AI-sounding phrases the company never uses
6. **A prompt modifier**: A 2-3 sentence instruction for an AI writer to match this voice

Documents:
${combinedSample}

Respond in JSON format with keys: topTerms, preferredTransitions, formalityScore, technicalDepth, assertiveness, persuasionStyle, samplePhrases, avoidedTerms, promptModifier`,
      opportunityId: 'system',
      systemPrompt: 'You are a writing style analyst. Extract precise, actionable voice characteristics. Return valid JSON only.',
    })

    // Step 3: Parse AI response
    let aiProfile: Record<string, unknown> = {}
    try {
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiProfile = JSON.parse(jsonMatch[0])
      }
    } catch {
      // Use defaults if AI parsing fails
    }

    // Step 4: Build complete profile
    const voiceProfile: VoiceProfile = {
      id: crypto.randomUUID(),
      companyId: profileData.company_id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceDocCount: documentTexts.length,
      vocabulary: {
        avgWordLength: stats.avgWordLength,
        uniqueWordRatio: stats.uniqueWordRatio,
        topTerms: (aiProfile.topTerms as Array<{ term: string; frequency: number }>) ?? [],
        avoidedTerms: (aiProfile.avoidedTerms as string[]) ?? [],
        preferredTransitions: (aiProfile.preferredTransitions as string[]) ?? [],
      },
      structure: {
        avgSentenceLength: stats.avgSentenceLength,
        avgParagraphLength: stats.avgParagraphLength,
        activeVoiceRatio: stats.activeVoiceRatio,
        listUsageFrequency: stats.listUsageFrequency,
        headingStyle: stats.headingStyle,
      },
      tone: {
        formalityScore: (aiProfile.formalityScore as number) ?? 75,
        technicalDepth: (aiProfile.technicalDepth as number) ?? 70,
        assertiveness: (aiProfile.assertiveness as number) ?? 65,
        evidenceDensity: stats.evidenceDensity,
        persuasionStyle: (aiProfile.persuasionStyle as ToneProfile['persuasionStyle']) ?? 'hybrid',
      },
      terminology: (aiProfile.topTerms as Array<{ term: string }>)?.map((t) => t.term) ?? [],
      samplePhrases: (aiProfile.samplePhrases as string[]) ?? [],
      promptModifier: (aiProfile.promptModifier as string) ?? '',
    }

    // Step 5: Store in companies.features
    const { data: company } = await supabase
      .from('companies')
      .select('features')
      .eq('id', profileData.company_id)
      .single()

    const existingFeatures = (company?.features as Record<string, unknown>) ?? {}

    await supabase
      .from('companies')
      .update({
        features: JSON.parse(JSON.stringify({
          ...existingFeatures,
          voice_profile: voiceProfile,
        })),
      })
      .eq('id', profileData.company_id)

    return { profile: voiceProfile }
  } catch (err) {
    return {
      profile: null,
      error: err instanceof Error ? err.message : 'Profile generation failed',
    }
  }
}

/**
 * Get the current voice profile for the user's company.
 */
export async function getVoiceProfile(): Promise<VoiceProfile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return null

  const { data: company } = await supabase
    .from('companies')
    .select('features')
    .eq('id', profile.company_id)
    .single()

  const features = company?.features as Record<string, unknown> | null
  return (features?.voice_profile as VoiceProfile) ?? null
}

/**
 * Update the voice profile prompt modifier (editable by exec/ops).
 */
export async function updateVoiceProfileModifier(
  modifier: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { success: false, error: 'No company' }

  const allowedRoles = ['executive', 'operations', 'admin', 'CEO', 'COO']
  if (!allowedRoles.includes(profile.role ?? '')) {
    return { success: false, error: 'Insufficient permissions' }
  }

  const { data: company } = await supabase
    .from('companies')
    .select('features')
    .eq('id', profile.company_id)
    .single()

  const features = (company?.features as Record<string, unknown>) ?? {}
  const voiceProfile = (features.voice_profile as Record<string, unknown>) ?? {}

  await supabase
    .from('companies')
    .update({
      features: JSON.parse(JSON.stringify({
        ...features,
        voice_profile: {
          ...voiceProfile,
          promptModifier: modifier,
          updatedAt: new Date().toISOString(),
        },
      })),
    })
    .eq('id', profile.company_id)

  return { success: true }
}

// ─── Statistical Analysis ───────────────────────────────────

function analyzeDocumentStats(documents: string[]): {
  avgWordLength: number
  uniqueWordRatio: number
  avgSentenceLength: number
  avgParagraphLength: number
  activeVoiceRatio: number
  listUsageFrequency: number
  headingStyle: 'numbered' | 'descriptive' | 'mixed'
  evidenceDensity: number
} {
  const allText = documents.join('\n\n')
  const words = allText.split(/\s+/).filter((w) => w.length > 0)
  const sentences = allText.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const paragraphs = allText.split(/\n\n+/).filter((p) => p.trim().length > 0)

  // Unique word ratio
  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z]/g, '')))
  const uniqueWordRatio = uniqueWords.size / Math.max(words.length, 1)

  // Average word length
  const avgWordLength =
    words.reduce((sum, w) => sum + w.length, 0) / Math.max(words.length, 1)

  // Sentence & paragraph length
  const avgSentenceLength =
    sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) /
    Math.max(sentences.length, 1)
  const avgParagraphLength =
    paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0) /
    Math.max(paragraphs.length, 1)

  // Active voice heuristic (sentences starting with noun/pronoun vs passive "was/were/been")
  const passiveIndicators = /\b(was|were|been|being|is|are)\s+(being\s+)?\w+ed\b/gi
  const passiveCount = (allText.match(passiveIndicators) || []).length
  const activeVoiceRatio = 1 - passiveCount / Math.max(sentences.length, 1)

  // List usage
  const listLines = allText.split('\n').filter((l) => /^\s*[-•●\d]+[.)]\s/.test(l))
  const listUsageFrequency = listLines.length / Math.max(paragraphs.length, 1)

  // Heading style detection
  const numberedHeadings = (allText.match(/^\d+\.\d*\s/gm) || []).length
  const descriptiveHeadings = (allText.match(/^[A-Z][A-Z\s]{5,}$/gm) || []).length
  const headingStyle: 'numbered' | 'descriptive' | 'mixed' =
    numberedHeadings > descriptiveHeadings * 2
      ? 'numbered'
      : descriptiveHeadings > numberedHeadings * 2
        ? 'descriptive'
        : 'mixed'

  // Evidence density (numbers, percentages, dates)
  const evidencePatterns = /\b\d+[%$,.]?\d*\b|\b\d{4}\b/g
  const evidenceCount = (allText.match(evidencePatterns) || []).length
  const evidenceDensity = Math.min(
    (evidenceCount / Math.max(sentences.length, 1)) * 100,
    100
  )

  return {
    avgWordLength,
    uniqueWordRatio,
    avgSentenceLength,
    avgParagraphLength,
    activeVoiceRatio: Math.max(0, Math.min(1, activeVoiceRatio)),
    listUsageFrequency,
    headingStyle,
    evidenceDensity,
  }
}
