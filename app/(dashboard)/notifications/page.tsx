import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationCenter } from '@/components/features/notifications/NotificationCenter'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select(
      'id, title, message, notification_type, priority, is_read, is_dismissed, link_url, link_text, created_at'
    )
    .eq('user_id', user.id)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your notification center — gate approvals, deadline warnings, team
          assignments, and more.
        </p>
      </div>

      <NotificationCenter notifications={notifications ?? []} />
    </div>
  )
}
