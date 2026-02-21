import { createClient } from '@/lib/supabase/server'

/**
 * Log a notification for a user. Called from Server Actions.
 * Non-blocking — catches errors silently.
 */
export async function logNotification(params: {
  userId: string
  title: string
  message: string
  notificationType: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  linkUrl?: string
  linkText?: string
  opportunityId?: string
}) {
  try {
    const supabase = await createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', params.userId)
      .single()

    await supabase.from('notifications').insert({
      id: crypto.randomUUID(),
      user_id: params.userId,
      company_id: profile?.company_id ?? null,
      title: params.title,
      message: params.message,
      notification_type: params.notificationType,
      priority: params.priority ?? 'normal',
      link_url: params.linkUrl ?? null,
      link_text: params.linkText ?? null,
      opportunity_id: params.opportunityId ?? null,
      is_read: false,
      is_dismissed: false,
    })
  } catch {
    // Non-blocking — notification failure should not break the workflow
  }
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
}

/**
 * Dismiss a notification.
 */
export async function dismissNotification(notificationId: string) {
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
    .eq('id', notificationId)
}
