'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { tryCompleteOnboardingStep } from '@/lib/billing/onboarding-hooks'

interface ActionResult {
  success: boolean
  error?: string
}

export async function inviteUser(data: {
  email: string
  fullName: string
  role: string
}): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const callerRole = resolveRole(callerProfile?.role)
  if (!hasPermission(callerRole, 'admin', 'canEdit')) {
    return { success: false, error: 'Insufficient permissions' }
  }

  const { error } = await supabase.from('user_invitations').insert({
    id: crypto.randomUUID(),
    email: data.email,
    full_name: data.fullName,
    role: data.role,
    status: 'pending',
    invited_by: user.id,
    company_id: callerProfile?.company_id ?? null,
    expires_at: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
  })

  if (error) return { success: false, error: error.message }

  await supabase.from('activity_log').insert({
    action: 'invite_user',
    user_name: user.email ?? 'Admin',
    user_role: callerProfile?.role ?? 'admin',
    details: {
      invited_email: data.email,
      invited_role: data.role,
    },
  })

  // Pilot onboarding hook
  tryCompleteOnboardingStep('invite_team')

  revalidatePath('/admin/users')
  return { success: true }
}

export async function deactivateUser(
  targetUserId: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const callerRole = resolveRole(callerProfile?.role)
  if (!hasPermission(callerRole, 'admin', 'canEdit')) {
    return { success: false, error: 'Insufficient permissions' }
  }

  // Prevent self-deactivation
  if (targetUserId === user.id) {
    return { success: false, error: 'Cannot deactivate yourself' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('id', targetUserId)

  if (error) return { success: false, error: error.message }

  await supabase.from('audit_logs').insert({
    action: 'DEACTIVATE_USER',
    user_id: user.id,
    metadata: {
      target_user_id: targetUserId,
      changed_by: callerProfile?.full_name,
    },
  })

  revalidatePath('/admin/users')
  return { success: true }
}

// ─── Bulk Invite Types ────────────────────────────────────────

const ASSIGNABLE_ROLES = [
  'executive', 'operations', 'capture_manager', 'proposal_manager',
  'volume_lead', 'pricing_manager', 'contracts', 'hr_staffing',
  'author', 'partner', 'subcontractor', 'consultant',
] as const

interface BulkRecord {
  index: number
  email: string
  fullName: string
  role: string
  status: 'valid' | 'error' | 'duplicate'
  issues: string[]
}

interface BulkValidationResult {
  valid: boolean
  records: BulkRecord[]
  summary: { total: number; valid: number; errors: number; duplicates: number }
}

interface BulkCommitResult {
  success: boolean
  invited: number
  error?: string
}

// ─── Bulk Invite: Validate ────────────────────────────────────

export async function validateBulkInvite(
  rows: { email: string; full_name: string; role: string }[]
): Promise<BulkValidationResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { valid: false, records: [], summary: { total: 0, valid: 0, errors: 0, duplicates: 0 } }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const callerRole = resolveRole(callerProfile?.role)
  if (!hasPermission(callerRole, 'admin', 'canEdit')) {
    return { valid: false, records: [], summary: { total: 0, valid: 0, errors: 0, duplicates: 0 } }
  }

  // Fetch existing emails for duplicate detection
  const { data: existingProfiles } = await supabase
    .from('profiles')
    .select('email')
  const existingEmails = new Set(
    (existingProfiles ?? []).map((p) => p.email?.toLowerCase()).filter(Boolean)
  )

  const { data: pendingInvites } = await supabase
    .from('user_invitations')
    .select('email')
    .eq('status', 'pending')
  const pendingEmails = new Set(
    (pendingInvites ?? []).map((i) => i.email?.toLowerCase()).filter(Boolean)
  )

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const seenEmails = new Set<string>()
  const records: BulkRecord[] = []
  let validCount = 0
  let errorCount = 0
  let duplicateCount = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const issues: string[] = []
    let status: BulkRecord['status'] = 'valid'
    const emailLower = row.email?.trim().toLowerCase() ?? ''

    // Validate email
    if (!emailLower) {
      issues.push('Email is required')
      status = 'error'
    } else if (!emailRegex.test(emailLower)) {
      issues.push('Invalid email format')
      status = 'error'
    }

    // Validate name
    if (!row.full_name?.trim()) {
      issues.push('Full name is required')
      status = 'error'
    }

    // Validate role
    const roleLower = row.role?.trim().toLowerCase() ?? ''
    if (!roleLower) {
      issues.push('Role is required')
      status = 'error'
    } else if (!ASSIGNABLE_ROLES.includes(roleLower as typeof ASSIGNABLE_ROLES[number])) {
      issues.push(`Invalid role: ${row.role}`)
      status = 'error'
    }

    // Check duplicates (only if no other errors on email)
    if (status !== 'error' && emailLower) {
      if (seenEmails.has(emailLower)) {
        issues.push('Duplicate within file')
        status = 'duplicate'
      } else if (existingEmails.has(emailLower)) {
        issues.push('User already exists')
        status = 'duplicate'
      } else if (pendingEmails.has(emailLower)) {
        issues.push('Invitation already pending')
        status = 'duplicate'
      }
    }

    if (emailLower) seenEmails.add(emailLower)

    if (status === 'valid') validCount++
    else if (status === 'duplicate') duplicateCount++
    else errorCount++

    records.push({
      index: i,
      email: row.email?.trim() ?? '',
      fullName: row.full_name?.trim() ?? '',
      role: roleLower,
      status,
      issues,
    })
  }

  return {
    valid: validCount > 0,
    records,
    summary: { total: rows.length, valid: validCount, errors: errorCount, duplicates: duplicateCount },
  }
}

// ─── Bulk Invite: Commit ──────────────────────────────────────

export async function commitBulkInvite(
  rows: { email: string; full_name: string; role: string }[]
): Promise<BulkCommitResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, invited: 0, error: 'Not authenticated' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, company_id, full_name')
    .eq('id', user.id)
    .single()

  const callerRole = resolveRole(callerProfile?.role)
  if (!hasPermission(callerRole, 'admin', 'canEdit')) {
    return { success: false, invited: 0, error: 'Insufficient permissions' }
  }

  // Re-validate server-side (defense in depth)
  const validation = await validateBulkInvite(rows)
  const validRecords = validation.records.filter((r) => r.status === 'valid')

  if (validRecords.length === 0) {
    return { success: false, invited: 0, error: 'No valid records to import' }
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const invitations = validRecords.map((r) => ({
    id: crypto.randomUUID(),
    email: r.email,
    full_name: r.fullName,
    role: r.role,
    status: 'pending' as const,
    invited_by: user.id,
    company_id: callerProfile?.company_id ?? null,
    expires_at: expiresAt,
  }))

  const { error } = await supabase.from('user_invitations').insert(invitations)

  if (error) return { success: false, invited: 0, error: error.message }

  // Audit trail
  await supabase.from('audit_logs').insert({
    action: 'BULK_INVITE_USERS',
    user_id: user.id,
    metadata: {
      count: validRecords.length,
      emails: validRecords.map((r) => r.email),
      changed_by: callerProfile?.full_name,
    },
  })

  await supabase.from('activity_log').insert({
    action: 'bulk_invite_users',
    user_name: user.email ?? 'Admin',
    user_role: callerProfile?.role ?? 'admin',
    details: {
      count: validRecords.length,
      emails: validRecords.map((r) => r.email),
    },
  })

  tryCompleteOnboardingStep('invite_team')
  revalidatePath('/admin/users')

  return { success: true, invited: validRecords.length }
}

// ─── User Lifecycle ───────────────────────────────────────────

export async function reactivateUser(
  targetUserId: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const callerRole = resolveRole(callerProfile?.role)
  if (!hasPermission(callerRole, 'admin', 'canEdit')) {
    return { success: false, error: 'Insufficient permissions' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', targetUserId)

  if (error) return { success: false, error: error.message }

  await supabase.from('audit_logs').insert({
    action: 'REACTIVATE_USER',
    user_id: user.id,
    metadata: {
      target_user_id: targetUserId,
      changed_by: callerProfile?.full_name,
    },
  })

  revalidatePath('/admin/users')
  return { success: true }
}
