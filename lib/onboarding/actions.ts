/**
 * Onboarding Wizard — Server Actions for each step.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { saveOnboardingProgress, completeOnboarding } from './progress'
import type { Json } from '@/lib/supabase/database.types'

// ─── Step 1: Save Company Profile ───────────────────────────

export interface CompanyProfileData {
  companyName: string
  cageCode: string
  uei: string
  naicsCodes: string
  certifications: string[]
}

export async function saveCompanyProfile(
  userId: string,
  companyId: string,
  data: CompanyProfileData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // Update company name if changed
  const updateFields: Record<string, unknown> = {}
  if (data.companyName.trim()) {
    updateFields.name = data.companyName.trim()
  }

  if (Object.keys(updateFields).length > 0) {
    await supabase
      .from('companies')
      .update(updateFields)
      .eq('id', companyId)
  }

  // Store extended profile in company_onboarding
  const profileJson: Record<string, unknown> = {
    cage_code: data.cageCode || null,
    uei: data.uei || null,
    naics_codes: data.naicsCodes.split(',').map((s) => s.trim()).filter(Boolean),
    certifications: data.certifications,
  }

  await supabase.from('company_onboarding').upsert(
    {
      company_id: companyId,
      company_profile: profileJson as Json,
      current_step: 1,
    },
    { onConflict: 'company_id' }
  )

  await saveOnboardingProgress(userId, 1)
  return { success: true }
}

// ─── Step 2: Create First Opportunity ───────────────────────

export interface FirstOpportunityData {
  title: string
  agency: string
  ceiling: number | null
  phase: string
  submissionDate: string
}

export async function saveFirstOpportunity(
  userId: string,
  companyId: string,
  data: FirstOpportunityData
): Promise<{ success: boolean; opportunityId?: string; error?: string }> {
  const supabase = createClient()

  const { data: opp, error } = await supabase
    .from('opportunities')
    .insert({
      title: data.title,
      agency: data.agency || null,
      ceiling: data.ceiling ?? null,
      phase: data.phase || 'Pre-RFP',
      submission_date: data.submissionDate || null,
      owner_id: userId,
      company_id: companyId,
      status: 'active',
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  await saveOnboardingProgress(userId, 2)
  return { success: true, opportunityId: opp?.id }
}

// ─── Step 3: Upload Past Performance ────────────────────────

export async function saveDocumentReference(
  userId: string,
  companyId: string,
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase.from('company_documents').insert({
    company_id: companyId,
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize,
    category: 'past_performance',
    status: 'uploaded',
    uploaded_by: userId,
  })

  if (error) return { success: false, error: error.message }

  await saveOnboardingProgress(userId, 3)
  return { success: true }
}

// ─── Step 4: Invite Team ────────────────────────────────────

export interface TeamInviteData {
  email: string
  role: string
}

export async function saveTeamInvites(
  userId: string,
  companyId: string,
  invites: TeamInviteData[]
): Promise<{ success: boolean; sentCount: number; error?: string }> {
  const supabase = createClient()

  const validInvites = invites.filter((i) => i.email.trim())
  if (validInvites.length === 0) {
    await saveOnboardingProgress(userId, 4)
    return { success: true, sentCount: 0 }
  }

  const rows = validInvites.map((inv) => ({
    company_id: companyId,
    email: inv.email.trim().toLowerCase(),
    role: inv.role || 'author',
    invited_by: userId,
    status: 'pending',
  }))

  const { error } = await supabase.from('team_invitations').insert(rows)

  if (error) return { success: false, sentCount: 0, error: error.message }

  await saveOnboardingProgress(userId, 4)
  return { success: true, sentCount: validInvites.length }
}

// ─── Step 5: AI First Use ───────────────────────────────────

export async function saveAIFirstUse(
  userId: string
): Promise<{ success: boolean }> {
  await saveOnboardingProgress(userId, 5)
  await completeOnboarding(userId)
  return { success: true }
}

// ─── Skip Step ──────────────────────────────────────────────

export async function skipOnboardingStep(
  userId: string,
  step: number
): Promise<{ success: boolean }> {
  await saveOnboardingProgress(userId, step, true)
  return { success: true }
}
