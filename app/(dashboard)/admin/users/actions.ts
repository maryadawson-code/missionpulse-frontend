'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

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
