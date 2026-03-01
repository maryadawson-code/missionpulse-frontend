'use client'

import { useState } from 'react'
import {
  Upload,
  Fingerprint,
  Sliders,
  BookOpen,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types ───────────────────────────────────────────────────

interface ToneData {
  formalityScore: number
  technicalDepth: number
  assertiveness: number
  evidenceDensity: number
  persuasionStyle: string
}

interface StructureData {
  avgSentenceLength: number
  activeVoiceRatio: number
  headingStyle: string
}

interface VoiceProfileData {
  sourceDocCount: number
  createdAt: string
  updatedAt: string
  promptModifier: string
  tone: ToneData | null
  structure: StructureData | null
  terminology: string[]
  samplePhrases: string[]
}

interface VoiceProfileManagerProps {
  existingProfile: VoiceProfileData | null
  canEdit: boolean
}

// ─── Component ───────────────────────────────────────────────

export function VoiceProfileManager({
  existingProfile,
  canEdit,
}: VoiceProfileManagerProps) {
  const [generating, setGenerating] = useState(false)
  const [modifier, setModifier] = useState(existingProfile?.promptModifier ?? '')

  function handleGenerate() {
    setGenerating(true)
    // In production: calls generateVoiceProfile() with uploaded document texts
    setTimeout(() => setGenerating(false), 3000)
  }

  function toneBar(label: string, value: number) {
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">{label}</span>
          <span className="text-[10px] font-medium text-foreground">{value}/100</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full bg-primary"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!existingProfile && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Generate Voice Profile
          </h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
            Upload at least 3 past proposals (PDF or DOCX) to analyze your company&apos;s
            writing style. The AI will extract vocabulary, tone, and structural patterns.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={generating || !canEdit}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Fingerprint className="h-4 w-4" />
            )}
            {generating ? 'Analyzing...' : 'Upload & Analyze'}
          </Button>
          {!canEdit && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Executive or Operations role required to create voice profiles.
            </p>
          )}
        </div>
      )}

      {/* Profile Dashboard */}
      {existingProfile && (
        <>
          {/* Status Bar */}
          <div className="rounded-xl border border-border bg-card/50 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10">
                  <Fingerprint className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Voice Profile Active</h3>
                  <p className="text-xs text-muted-foreground">
                    Based on {existingProfile.sourceDocCount} documents — Last updated{' '}
                    {new Date(existingProfile.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Regenerate
                </Button>
              )}
            </div>
          </div>

          {/* Tone Metrics */}
          {existingProfile.tone && (
            <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Tone Profile</h3>
                <span className="ml-auto text-[10px] text-muted-foreground rounded bg-muted px-2 py-0.5">
                  {existingProfile.tone.persuasionStyle}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {toneBar('Formality', existingProfile.tone.formalityScore)}
                {toneBar('Technical Depth', existingProfile.tone.technicalDepth)}
                {toneBar('Assertiveness', existingProfile.tone.assertiveness)}
                {toneBar('Evidence Density', existingProfile.tone.evidenceDensity)}
              </div>
            </div>
          )}

          {/* Structure */}
          {existingProfile.structure && (
            <div className="rounded-xl border border-border bg-card/50 p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Writing Structure</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground">Avg Sentence Length</p>
                  <p className="text-lg font-bold text-foreground">
                    {Math.round(existingProfile.structure.avgSentenceLength)} words
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Active Voice Ratio</p>
                  <p className="text-lg font-bold text-foreground">
                    {Math.round(existingProfile.structure.activeVoiceRatio * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Heading Style</p>
                  <p className="text-lg font-bold text-foreground capitalize">
                    {existingProfile.structure.headingStyle}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Terminology & Phrases */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {existingProfile.terminology.length > 0 && (
              <div className="rounded-xl border border-border bg-card/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-semibold text-foreground">Domain Terminology</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {existingProfile.terminology.slice(0, 15).map((term, i) => (
                    <span
                      key={i}
                      className="rounded bg-muted px-2 py-0.5 text-[10px] text-foreground"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {existingProfile.samplePhrases.length > 0 && (
              <div className="rounded-xl border border-border bg-card/50 p-5">
                <h3 className="text-xs font-semibold text-foreground mb-3">
                  Characteristic Phrases
                </h3>
                <div className="space-y-2">
                  {existingProfile.samplePhrases.slice(0, 5).map((phrase, i) => (
                    <p
                      key={i}
                      className="text-[10px] text-muted-foreground italic border-l-2 border-primary/30 pl-2"
                    >
                      &ldquo;{phrase}&rdquo;
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom Prompt Modifier */}
          {canEdit && (
            <div className="rounded-xl border border-border bg-card/50 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Custom Voice Instructions</h3>
              <p className="text-xs text-muted-foreground">
                Add custom instructions for the AI writer. These override the auto-detected voice profile.
              </p>
              <textarea
                value={modifier}
                onChange={(e) => setModifier(e.target.value)}
                rows={3}
                placeholder="e.g., Always use 'we' instead of 'the team'. Reference past performance within first 2 sentences..."
                className="w-full rounded-lg border border-border bg-card/80 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <Button variant="outline" size="sm">
                Save Instructions
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
