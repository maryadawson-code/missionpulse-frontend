// filepath: lib/actions/admin.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('admin')

interface ActionResult {
  success: boolean
  error?: string
}

/**
 * Update a user's role. Admin-only action.
 * Double-checks RBAC at server level (defense in depth).
 */
export async function updateUserRole(
  targetUserId: string,
  newRole: string
): Promise<ActionResult> {
  const supabase = await createClient()

  // Verify caller is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Verify caller has admin permission
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const callerRole = resolveRole(callerProfile?.role)
  if (!hasPermission(callerRole, 'admin', 'canEdit')) {
    return { success: false, error: 'Insufficient permissions' }
  }

  // Update the target user's role
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', targetUserId)

  if (error) {
    log.error('Role update failed', { error: error.message })
    return { success: false, error: error.message }
  }

  // Audit log — role changes are sensitive
  await supabase.from('audit_logs').insert({
    action: 'UPDATE_ROLE',
    entity_type: 'profile',
    entity_id: targetUserId,
    user_id: user.id,
    details: { new_role: newRole, changed_by: callerProfile?.full_name },
  })

  await supabase.from('activity_log').insert({
    action: 'update_user_role',
    user_name: callerProfile?.full_name ?? user.email ?? 'Unknown',
    user_role: callerProfile?.role ?? 'unknown',
    details: { entity_type: 'profile', entity_id: targetUserId, new_role: newRole },
  })

  revalidatePath('/admin')
  return { success: true }
}
