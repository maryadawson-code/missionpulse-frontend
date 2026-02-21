'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/notifications')
  return { success: true }
}

export async function markAllAsRead() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) return { success: false, error: error.message }
  revalidatePath('/notifications')
  return { success: true }
}

export async function dismissNotification(notificationId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/notifications')
  return { success: true }
}
