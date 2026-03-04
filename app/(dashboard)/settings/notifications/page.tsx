import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { NotificationPreferences } from '@/components/features/settings/NotificationPreferences'
import { saveNotificationPreferences } from './actions'

export default async function NotificationSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('notification_type, email_enabled, in_app_enabled, push_enabled')
    .eq('user_id', user.id)

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Settings', href: '/settings' },
        { label: 'Notifications' },
      ]} />

      <div>
        <h1 className="text-2xl font-bold text-foreground">Notification Preferences</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control which notifications you receive and through which channels.
        </p>
      </div>

      <NotificationPreferences
        preferences={(prefs ?? []).map((p) => ({
          notification_type: p.notification_type,
          email_enabled: p.email_enabled ?? true,
          in_app_enabled: p.in_app_enabled ?? true,
          push_enabled: p.push_enabled ?? false,
        }))}
        onSave={saveNotificationPreferences}
      />
    </div>
  )
}
