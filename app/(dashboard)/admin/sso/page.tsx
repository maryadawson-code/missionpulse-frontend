// filepath: app/(dashboard)/admin/sso/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { SSOConfigPanel } from '@/components/features/admin/SSOConfigPanel'

export default async function SSOPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'admin', 'canEdit')) redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Single Sign-On (SSO)</h1>
        <p className="text-sm text-muted-foreground">
          Configure SAML 2.0 identity provider for your organization.
          Enterprise plan required.
        </p>
      </div>
      <SSOConfigPanel companyId={profile?.company_id ?? ''} />
    </div>
  )
}
