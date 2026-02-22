'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Revokes external partner/subcontractor access when a proposal is submitted.
 * Deletes opportunity_assignments for external roles and logs the revocation.
 */
export async function revokeExternalAccess(opportunityId: string): Promise<{ success: boolean; revokedCount: number; error?: string }> {
  const supabase = await createClient()

  const externalRoles = ['partner', 'subcontractor', 'consultant', 'external_reviewer']

  // Find external assignments
  const { data: externalAssignments, error: fetchError } = await supabase
    .from('opportunity_assignments')
    .select('id, assignee_name, assignee_email, role')
    .eq('opportunity_id', opportunityId)
    .in('role', externalRoles)

  if (fetchError) {
    return { success: false, revokedCount: 0, error: fetchError.message }
  }

  if (!externalAssignments || externalAssignments.length === 0) {
    return { success: true, revokedCount: 0 }
  }

  // Delete external assignments
  const ids = externalAssignments.map((a) => a.id)
  const { error: deleteError } = await supabase
    .from('opportunity_assignments')
    .delete()
    .in('id', ids)

  if (deleteError) {
    return { success: false, revokedCount: 0, error: deleteError.message }
  }

  // Log each revocation
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? ''
  const userEmail = user?.email ?? 'system'

  for (const assignment of externalAssignments) {
    await supabase.from('audit_logs').insert({
      action: 'partner_access_revoked',
      table_name: 'opportunity_assignments',
      record_id: assignment.id,
      user_id: userId,
      user_email: userEmail,
      metadata: {
        opportunity_id: opportunityId,
        assignee_name: assignment.assignee_name,
        assignee_email: assignment.assignee_email,
        role: assignment.role,
        reason: 'proposal_submitted',
      },
    })

    await supabase.from('activity_log').insert({
      action: 'partner_access_revoked',
      user_name: userEmail,
      details: {
        opportunity_id: opportunityId,
        assignee_name: assignment.assignee_name,
        role: assignment.role,
        description: `External access revoked for ${assignment.assignee_name} (${assignment.role}) on proposal submission`,
      },
    })
  }

  return { success: true, revokedCount: externalAssignments.length }
}
