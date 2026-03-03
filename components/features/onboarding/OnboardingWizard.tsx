'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  saveCompanyProfile,
  saveFirstOpportunity,
  saveDocumentReference,
  saveTeamInvites,
  saveAIFirstUse,
  skipOnboardingStep,
} from '@/lib/onboarding/actions'
import type { CompanyProfileData, FirstOpportunityData, TeamInviteData } from '@/lib/onboarding/actions'

// ─── Types ──────────────────────────────────────────────────

interface OnboardingWizardProps {
  userId: string
  companyId: string
  companyName: string
  initialStep: number
  roles: string[]
}

const STEP_LABELS = [
  'Company Profile',
  'First Opportunity',
  'Past Performance',
  'Invite Team',
  'Try AI',
]

const CERTIFICATIONS = [
  { id: 'sdvosb', label: 'SDVOSB' },
  { id: 'wosb', label: 'WOSB' },
  { id: 'hubzone', label: 'HUBZone' },
  { id: '8a', label: '8(a)' },
  { id: '8a_exited', label: 'Recently exited 8(a)' },
  { id: 'none', label: 'None' },
]

const SHIPLEY_PHASES = [
  'Pre-RFP',
  'RFP Released',
  'Proposal Development',
  'Red Team',
  'Final Review',
  'Submitted',
  'Under Evaluation',
  'Award Pending',
]

// ─── Component ──────────────────────────────────────────────

export function OnboardingWizard({
  userId,
  companyId,
  companyName,
  initialStep,
  roles,
}: OnboardingWizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(initialStep)
  const [error, setError] = useState<string | null>(null)

  // Step 1 state
  const [companyData, setCompanyData] = useState<CompanyProfileData>({
    companyName: companyName,
    cageCode: '',
    uei: '',
    naicsCodes: '',
    certifications: [],
  })

  // Step 2 state
  const [oppData, setOppData] = useState<FirstOpportunityData>({
    title: '',
    agency: '',
    ceiling: null,
    phase: 'Pre-RFP',
    submissionDate: '',
  })

  // Step 3 state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploaded'>('idle')

  // Step 4 state
  const [invites, setInvites] = useState<TeamInviteData[]>([
    { email: '', role: 'author' },
    { email: '', role: 'author' },
    { email: '', role: 'author' },
  ])

  // Step 5 state
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState<string | null>(null)

  function goNext() {
    setError(null)
    setStep((s) => Math.min(5, s + 1))
  }

  function goBack() {
    setError(null)
    setStep((s) => Math.max(1, s - 1))
  }

  function handleSkip() {
    startTransition(async () => {
      await skipOnboardingStep(userId, step)
      if (step === 5) {
        await saveAIFirstUse(userId)
        router.push('/dashboard')
      } else {
        goNext()
      }
    })
  }

  // Step 1 handler
  function submitCompanyProfile() {
    startTransition(async () => {
      const result = await saveCompanyProfile(userId, companyId, companyData)
      if (result.success) goNext()
      else setError(result.error ?? 'Failed to save company profile')
    })
  }

  // Step 2 handler
  function submitOpportunity() {
    if (!oppData.title.trim()) {
      setError('Opportunity title is required')
      return
    }
    startTransition(async () => {
      const result = await saveFirstOpportunity(userId, companyId, oppData)
      if (result.success) goNext()
      else setError(result.error ?? 'Failed to create opportunity')
    })
  }

  // Step 3 handler
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFile(file)
  }

  function submitDocument() {
    if (!uploadedFile) {
      goNext()
      return
    }
    startTransition(async () => {
      const result = await saveDocumentReference(
        userId,
        companyId,
        uploadedFile.name,
        uploadedFile.type || 'application/pdf',
        uploadedFile.size
      )
      if (result.success) {
        setUploadStatus('uploaded')
        goNext()
      } else {
        setError(result.error ?? 'Failed to save document')
      }
    })
  }

  // Step 4 handler
  function submitInvites() {
    startTransition(async () => {
      const result = await saveTeamInvites(userId, companyId, invites)
      if (result.success) goNext()
      else setError(result.error ?? 'Failed to send invitations')
    })
  }

  // Step 5 handler
  function submitAI() {
    startTransition(async () => {
      // Generate a response based on context from earlier steps
      const contextPrompt = aiPrompt.trim() || buildDefaultPrompt()
      // Simulate AI response in onboarding (actual AI would need backend call)
      setAiResponse(
        `Based on your profile for ${companyData.companyName}, here are initial recommendations for your federal capture strategy:\n\n` +
        `1. **Pipeline Focus**: ${oppData.title ? `Start with "${oppData.title}"` : 'Create your first opportunity'} and track it through Shipley phases.\n\n` +
        `2. **Compliance**: Upload your RFP to auto-extract SHALL/MUST requirements into a compliance matrix.\n\n` +
        `3. **Team Collaboration**: ${invites.filter(i => i.email).length > 0 ? `Your ${invites.filter(i => i.email).length} invited team member(s) can start collaborating immediately.` : 'Invite team members to accelerate proposal development.'}\n\n` +
        `4. **Win Probability**: MissionPulse AI will calculate pWin based on your past performance, competition landscape, and compliance readiness.\n\n` +
        `AI GENERATED — REQUIRES HUMAN REVIEW`
      )
      setAiPrompt(contextPrompt)
      await saveAIFirstUse(userId)
    })
  }

  function buildDefaultPrompt(): string {
    const parts: string[] = [
      `Our company ${companyData.companyName} is pursuing federal contracts.`,
    ]
    if (companyData.certifications.length > 0 && !companyData.certifications.includes('none')) {
      parts.push(`We have these certifications: ${companyData.certifications.join(', ')}.`)
    }
    if (oppData.title) {
      parts.push(`We're working on "${oppData.title}"${oppData.agency ? ` with ${oppData.agency}` : ''}.`)
    }
    parts.push('What should our capture strategy focus on?')
    return parts.join(' ')
  }

  function finishOnboarding() {
    router.push('/dashboard')
  }

  const show8aHelper = companyData.certifications.includes('8a_exited')

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1
            const isActive = stepNum === step
            const isComplete = stepNum < step
            return (
              <div key={label} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isComplete
                      ? 'bg-emerald-500 text-white'
                      : isActive
                        ? 'bg-[#00E5FA] text-[#00050F]'
                        : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {isComplete ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`text-[10px] ${
                    isActive ? 'text-[#00E5FA] font-medium' : 'text-gray-500'
                  }`}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>
        <div className="h-1 rounded-full bg-gray-800">
          <div
            className="h-1 rounded-full bg-[#00E5FA] transition-all duration-500"
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        {/* ─── Step 1: Company Profile ─── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Company Profile</h2>
              <p className="text-sm text-gray-400 mt-1">Tell us about your company so we can customize your experience.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyData.companyName}
                  onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">CAGE Code (optional)</label>
                  <input
                    type="text"
                    value={companyData.cageCode}
                    onChange={(e) => setCompanyData({ ...companyData, cageCode: e.target.value })}
                    placeholder="e.g., 1ABC2"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">UEI (optional)</label>
                  <input
                    type="text"
                    value={companyData.uei}
                    onChange={(e) => setCompanyData({ ...companyData, uei: e.target.value })}
                    placeholder="e.g., ABC123DEF456"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">NAICS Codes (comma-separated)</label>
                <input
                  type="text"
                  value={companyData.naicsCodes}
                  onChange={(e) => setCompanyData({ ...companyData, naicsCodes: e.target.value })}
                  placeholder="e.g., 541512, 541519, 541611"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">Certifications</label>
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATIONS.map((cert) => {
                    const selected = companyData.certifications.includes(cert.id)
                    return (
                      <button
                        key={cert.id}
                        onClick={() => {
                          if (cert.id === 'none') {
                            setCompanyData({ ...companyData, certifications: ['none'] })
                          } else {
                            const without = companyData.certifications.filter((c) => c !== 'none')
                            setCompanyData({
                              ...companyData,
                              certifications: selected
                                ? without.filter((c) => c !== cert.id)
                                : [...without, cert.id],
                            })
                          }
                        }}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          selected
                            ? 'border-[#00E5FA]/50 bg-[#00E5FA]/10 text-[#00E5FA]'
                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {cert.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {show8aHelper && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
                  <strong>8(a) Transition Toolkit:</strong> MissionPulse includes features specifically
                  designed for firms recently exiting the 8(a) program — competitive bid coaching,
                  teaming partner matching, and past performance narrative optimization.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Step 2: First Opportunity ─── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Create Your First Opportunity</h2>
              <p className="text-sm text-gray-400 mt-1">Add a pursuit you&apos;re currently tracking or bidding on.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Opportunity Title *</label>
                <input
                  type="text"
                  value={oppData.title}
                  onChange={(e) => setOppData({ ...oppData, title: e.target.value })}
                  placeholder="e.g., DoD Cloud Migration Support"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Agency</label>
                  <input
                    type="text"
                    value={oppData.agency}
                    onChange={(e) => setOppData({ ...oppData, agency: e.target.value })}
                    placeholder="e.g., Department of Defense"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ceiling ($)</label>
                  <input
                    type="number"
                    value={oppData.ceiling ?? ''}
                    onChange={(e) =>
                      setOppData({
                        ...oppData,
                        ceiling: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="e.g., 5000000"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Shipley Phase</label>
                  <select
                    value={oppData.phase}
                    onChange={(e) => setOppData({ ...oppData, phase: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
                  >
                    {SHIPLEY_PHASES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Submission Deadline</label>
                  <input
                    type="date"
                    value={oppData.submissionDate}
                    onChange={(e) => setOppData({ ...oppData, submissionDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 3: Upload Past Performance ─── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Upload Past Performance</h2>
              <p className="text-sm text-gray-400 mt-1">Upload a past performance PDF so AI can reference it in proposals.</p>
            </div>

            <div
              className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                uploadedFile || uploadStatus === 'uploaded'
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
              }`}
            >
              {uploadedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-emerald-300">{uploadedFile.name}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {(uploadedFile.size / 1024).toFixed(0)} KB
                  </p>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-gray-500 hover:text-gray-300"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <svg className="mx-auto h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <label className="cursor-pointer text-sm font-medium text-[#00E5FA] hover:underline">
                      Choose a file
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-sm text-gray-400"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOC, or DOCX up to 25MB</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Step 4: Invite Team ─── */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Invite Your Team</h2>
              <p className="text-sm text-gray-400 mt-1">Add up to 3 team members to start collaborating.</p>
            </div>

            <div className="space-y-3">
              {invites.map((inv, i) => (
                <div key={i} className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <input
                      type="email"
                      value={inv.email}
                      onChange={(e) => {
                        const updated = [...invites]
                        updated[i] = { ...inv, email: e.target.value }
                        setInvites(updated)
                      }}
                      placeholder={`Team member ${i + 1} email`}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <select
                      value={inv.role}
                      onChange={(e) => {
                        const updated = [...invites]
                        updated[i] = { ...inv, role: e.target.value }
                        setInvites(updated)
                      }}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Step 5: AI First Use ─── */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Try AI Now</h2>
              <p className="text-sm text-gray-400 mt-1">
                Ask your first question. We&apos;ve pre-populated a prompt based on your data.
              </p>
            </div>

            <div>
              <textarea
                value={aiPrompt || buildDefaultPrompt()}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 resize-none"
              />
            </div>

            {!aiResponse && (
              <button
                onClick={submitAI}
                disabled={isPending}
                className="w-full rounded-lg bg-[#00E5FA] px-4 py-2.5 text-sm font-medium text-[#00050F] transition-colors hover:bg-[#00E5FA]/90 disabled:opacity-50"
              >
                {isPending ? 'Generating...' : 'Try AI Now'}
              </button>
            )}

            {aiResponse && (
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-sm text-gray-300">
                    {aiResponse}
                  </div>
                </div>
                <button
                  onClick={finishOnboarding}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {step > 1 ? (
          <button
            onClick={goBack}
            disabled={isPending}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={handleSkip}
          disabled={isPending}
          className="text-xs text-gray-500 hover:text-gray-300 disabled:opacity-50"
        >
          Skip this step
        </button>

        {step < 5 && (
          <button
            onClick={() => {
              if (step === 1) submitCompanyProfile()
              else if (step === 2) submitOpportunity()
              else if (step === 3) submitDocument()
              else if (step === 4) submitInvites()
            }}
            disabled={isPending}
            className="rounded-lg bg-[#00E5FA] px-4 py-2 text-sm font-medium text-[#00050F] transition-colors hover:bg-[#00E5FA]/90 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Continue'}
          </button>
        )}
      </div>
    </div>
  )
}
