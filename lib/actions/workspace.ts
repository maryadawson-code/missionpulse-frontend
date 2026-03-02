'use server'

/**
 * Workspace Provisioning — Auto-creates company + sample data for new users.
 * Idempotent: no-op if company already exists.
 * Uses the user's own auth token (no service role key needed).
 * © 2026 Mission Meets Tech
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Types ──────────────────────────────────────────────────

interface ProvisionResult {
  success: boolean
  companyId?: string
  error?: string
}

// ─── Workspace Provisioning ─────────────────────────────────

/**
 * Auto-provision a workspace for a new user:
 * 1. Create a company row
 * 2. Link the profile to the company
 * 3. Set role to 'executive'
 * 4. Seed sample opportunity + activity
 * 5. Log to audit_logs
 *
 * Idempotent: if the user already has a company_id, returns immediately.
 */
export async function provisionWorkspace(): Promise<ProvisionResult> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Check if user already has a company
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return { success: false, error: 'Profile not found' }
  if (profile.company_id) return { success: true, companyId: profile.company_id }

  // Create company
  const workspaceName = profile.full_name
    ? `${profile.full_name}'s Workspace`
    : `${profile.email.split('@')[0]}'s Workspace`

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: workspaceName,
      subscription_tier: 'starter',
      max_users: 5,
      is_active: true,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (companyError || !company) {
    return { success: false, error: companyError?.message ?? 'Failed to create company' }
  }

  // Update profile with company_id and executive role
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      company_id: company.id,
      role: 'executive',
    })
    .eq('id', user.id)

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  // Seed sample data
  await seedSampleData(supabase, company.id, user.id, profile.full_name ?? profile.email)

  // Audit log
  await supabase.from('audit_logs').insert({
    action: 'workspace_provisioned',
    user_id: user.id,
    metadata: {
      company_id: company.id,
      company_name: workspaceName,
      user_name: profile.full_name ?? profile.email,
    },
    user_role: 'executive',
  })

  revalidatePath('/', 'layout')
  return { success: true, companyId: company.id }
}

// ─── Sample Data Seeding ────────────────────────────────────

/**
 * Seeds a sample opportunity with activity log entries
 * so the dashboard isn't empty on first login.
 */
async function seedSampleData(
  supabase: ReturnType<typeof createClient>,
  companyId: string,
  userId: string,
  userName: string
) {
  try {
    // Check if sample data already exists
    const { count } = await supabase
      .from('opportunities')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)

    if ((count ?? 0) > 0) return // Already has data

    // Insert sample opportunity
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 45) // 45 days from now

    const { data: opp } = await supabase
      .from('opportunities')
      .insert({
        title: 'Sample: USAF IT Modernization',
        description:
          'Cloud migration and IT modernization for Air Force base operations. This is a sample opportunity to help you explore MissionPulse. Feel free to edit or delete it.',
        phase: 'Pursuit/Capture',
        status: 'active',
        agency: 'US Air Force',
        sub_agency: 'AFLCMC',
        ceiling: 2500000,
        pwin: 35,
        due_date: dueDate.toISOString().split('T')[0],
        naics_code: '541512',
        set_aside: 'Small Business',
        contract_vehicle: 'Full & Open',
        company_id: companyId,
        owner_id: userId,
        priority: 'high',
        solicitation_number: 'FA8771-26-R-0001',
        tags: ['sample', 'IT', 'cloud'],
      })
      .select('id')
      .single()

    if (!opp) return

    // Insert sample activity log entries
    const now = new Date()
    const activities = [
      {
        action: 'opportunity_created',
        details: {
          resource_type: 'opportunity',
          resource_id: opp.id,
          title: 'Sample: USAF IT Modernization',
          user_id: userId,
        },
        user_name: userName,
        user_role: 'executive',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        action: 'opportunity_updated',
        details: {
          resource_type: 'opportunity',
          resource_id: opp.id,
          title: 'Sample: USAF IT Modernization',
          changes: { pwin: { from: null, to: 35 } },
          user_id: userId,
        },
        user_name: userName,
        user_role: 'executive',
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      },
      {
        action: 'compliance_review',
        details: {
          resource_type: 'opportunity',
          resource_id: opp.id,
          title: 'Initial compliance assessment started',
          user_id: userId,
        },
        user_name: userName,
        user_role: 'executive',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 min ago
      },
    ]

    await supabase.from('activity_log').insert(activities)
  } catch {
    // Sample data seeding is non-critical — don't fail provisioning
  }
}

// ─── Team Helpers ───────────────────────────────────────────

/**
 * Get the number of team members in a company.
 */
export async function getTeamSize(companyId: string): Promise<number> {
  const supabase = createClient()
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
  return count ?? 0
}

/**
 * Generate a shareable invite link for a company.
 * Creates a user_invitations row with a unique token.
 */
export async function generateInviteLink(
  companyId: string,
  role: string = 'author'
): Promise<{ success: boolean; link?: string; error?: string }> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Generate a random token
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 day expiry

  const { error } = await supabase.from('user_invitations').insert({
    company_id: companyId,
    invited_by: user.id,
    role,
    token,
    expires_at: expiresAt.toISOString(),
    status: 'pending',
    email: '', // Will be filled when invite is accepted
    full_name: '', // Will be filled when invite is accepted
  })

  if (error) return { success: false, error: error.message }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.missionpulse.ai'
  return { success: true, link: `${baseUrl}/join/${token}` }
}
