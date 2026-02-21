'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

interface ActionResult {
  success: boolean
  error?: string
}

export async function updateCompanySettings(data: {
  name: string
  domain: string | null
  primary_color: string | null
}): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const callerRole = resolveRole(profile?.role)
  if (!hasPermission(callerRole, 'admin', 'canEdit')) {
    return { success: false, error: 'Insufficient permissions' }
  }

  if (!profile?.company_id) {
    return { success: false, error: 'No company associated with your account' }
  }

  const { error } = await supabase
    .from('companies')
    .update({
      name: data.name,
      domain: data.domain,
      primary_color: data.primary_color,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.company_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/settings')
  return { success: true }
}
