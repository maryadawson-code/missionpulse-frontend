'use server'

import { createClient } from '@/lib/supabase/server'

interface NotificationPref {
  notification_type: string
  email_enabled: boolean
  in_app_enabled: boolean
  push_enabled: boolean
}

export async function saveNotificationPreferences(
  prefs: NotificationPref[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  for (const pref of prefs) {
    await supabase
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
  }

  return { success: true }
}
