// filepath: app/(dashboard)/pricing/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { CUIBanner } from '@/components/rbac/CUIBanner'

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'pricing', 'shouldRender')) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <CUIBanner marking="SP-PROPIN" />
      <div>
        <h1 className="text-2xl font-bold text-white">Pricing</h1>
        <p className="mt-1 text-sm text-gray-500">Build and manage government contract pricing models, rate tables, and cost estimates.</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50 py-16">
        <svg className="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-4 text-sm font-medium text-gray-400">Coming Soon</p>
        <p className="mt-1 text-xs text-gray-500">This module is under development.</p>
      </div>
    </div>
  )
}
