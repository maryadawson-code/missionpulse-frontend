// filepath: lib/actions/settings.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createLogger } from '@/lib/logging/logger'
import { sanitizePlainText } from '@/lib/security/sanitize'
import { updateNotificationPreferencesSchema } from '@/lib/api/schemas'

const log = createLogger('settings')

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
      full_name: fullName ? sanitizePlainText(fullName.trim()) : null,
      company: company ? sanitizePlainText(company.trim()) : null,
      phone: phone?.trim() || null,
      avatar_url: avatarUrl?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    log.error('Profile update failed', { error: error.message })
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
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Update the current user's password via Supabase Auth.
 */
export async function updatePassword(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const password = formData.get('new_password') as string
  if (!password || password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    log.error('Password update failed', { error: error.message })
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Save notification preferences for the current user.
 */
export async function updateNotificationPreferences(
  preferences: {
    notification_type: string
    email_enabled: boolean
    in_app_enabled: boolean
    push_enabled: boolean
  }[]
): Promise<ActionResult> {
  // Validate inputs
  const parsed = updateNotificationPreferencesSchema.safeParse(preferences)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  for (const pref of preferences) {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: user.id,
          notification_type: pref.notification_type,
          email_enabled: pref.email_enabled,
          in_app_enabled: pref.in_app_enabled,
          push_enabled: pref.push_enabled,
        },
        { onConflict: 'user_id,notification_type' }
      )

    if (error) {
      log.error('Notification prefs update failed', { error: error.message })
      return { success: false, error: error.message }
    }
  }

  revalidatePath('/settings')
  return { success: true }
}
