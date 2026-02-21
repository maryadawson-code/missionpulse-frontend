// filepath: app/(dashboard)/blackhat/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { CUIBanner } from '@/components/rbac/CUIBanner'

export default async function BlackhatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'blackhat', 'shouldRender')) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <CUIBanner marking="OPSEC" />
      <div>
        <h1 className="text-2xl font-bold text-white">Black Hat Review</h1>
        <p className="mt-1 text-sm text-gray-500">Conduct competitive analysis and black hat reviews to anticipate competitor strategies.</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50 py-16">
        <svg className="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="mt-4 text-sm font-medium text-gray-400">Coming Soon</p>
        <p className="mt-1 text-xs text-gray-500">This module is under development.</p>
      </div>
    </div>
  )
}
