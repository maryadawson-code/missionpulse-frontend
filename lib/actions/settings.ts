// filepath: lib/actions/settings.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface ActionResult {
  success: boolean
  error?: string
}

/**
 * Update the current user's profile.
 * Writes to profiles table + activity_log.
 */
export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const fullName = formData.get('full_name') as string | null
  const company = formData.get('company') as string | null
  const phone = formData.get('phone') as string | null
  const avatarUrl = formData.get('avatar_url') as string | null

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName?.trim() || null,
      company: company?.trim() || null,
      phone: phone?.trim() || null,
      avatar_url: avatarUrl?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('[settings:profile]', error.message)
    return { success: false, error: error.message }
  }

  // Activity log
  await supabase.from('activity_log').insert({
    action: 'update_profile',
    user_name: fullName ?? user.email ?? 'Unknown',
    user_role: 'self',
    details: { entity_type: 'profile', entity_id: user.id },
  })

  revalidatePath('/settings')
  revalidatePath('/')
  return { success: true }
}

/**
 * Update the current user's password via Supabase Auth.
 */
export async function updatePassword(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const password = formData.get('password') as string
  if (!password || password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error('[settings:password]', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}
