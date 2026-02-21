// filepath: app/(dashboard)/settings/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your profile and account preferences
        </p>
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
      />
    </div>
  )
}
