// filepath: app/(dashboard)/settings/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SettingsForm } from '@/components/modules/SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, company, avatar_url, phone, preferences')
    .eq('id', user.id)
    .single()

  const { data: notifPrefs } = await supabase
    .from('notification_preferences')
    .select('notification_type, email_enabled, in_app_enabled, push_enabled')
    .eq('user_id', user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your profile and account preferences
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/settings/billing"
          className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-4 hover:border-cyan/40 hover:bg-elevated transition-colors group"
        >
          <span className="text-lg mt-0.5">💳</span>
          <div>
            <p className="text-sm font-medium text-white group-hover:text-cyan transition-colors">
              Billing &amp; Subscription
            </p>
            <p className="text-xs text-slate mt-0.5">Manage your plan, tokens, and payment</p>
          </div>
        </Link>
        <Link
          href="/settings/notifications"
          className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-4 hover:border-cyan/40 hover:bg-elevated transition-colors group"
        >
          <span className="text-lg mt-0.5">🔔</span>
          <div>
            <p className="text-sm font-medium text-white group-hover:text-cyan transition-colors">
              Notifications
            </p>
            <p className="text-xs text-slate mt-0.5">Control email, in-app, and push alerts</p>
          </div>
        </Link>
        <Link
          href="/settings/import"
          className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-4 hover:border-cyan/40 hover:bg-elevated transition-colors group"
        >
          <span className="text-lg mt-0.5">📥</span>
          <div>
            <p className="text-sm font-medium text-white group-hover:text-cyan transition-colors">
              Data Import
            </p>
            <p className="text-xs text-slate mt-0.5">Import opportunities from CSV or Excel</p>
          </div>
        </Link>
      </div>

      <SettingsForm
        profile={{
          id: profile?.id ?? user.id,
          full_name: profile?.full_name ?? '',
          email: profile?.email ?? user.email ?? '',
          company: profile?.company ?? '',
          phone: profile?.phone ?? '',
          avatar_url: profile?.avatar_url ?? '',
          role: profile?.role ?? 'viewer',
        }}
        notificationPrefs={
          (notifPrefs ?? []).map((p) => ({
            notification_type: p.notification_type,
            email_enabled: p.email_enabled ?? true,
            in_app_enabled: p.in_app_enabled ?? true,
            push_enabled: p.push_enabled ?? false,
          }))
        }
      />
    </div>
  )
}
