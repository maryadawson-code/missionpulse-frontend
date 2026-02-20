import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import type { Profile } from '@/lib/supabase/types'

export default async function HomePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-[#00E5FA]">Mission</span>Pulse
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Mission. Technology. Transformation.
          </p>
        </div>

        {/* Auth Status Card */}
        <div className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-400">
              Authenticated — Sprint 0 Complete
            </span>
          </div>

          {profile && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Name</span>
                <span className="text-white">{profile.full_name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email</span>
                <span className="text-white">{profile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role</span>
                <span className="text-[#00E5FA] font-medium">{profile.role ?? 'Partner'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Company ID</span>
                <span className="text-white font-mono text-xs">
                  {profile.company_id?.slice(0, 8) ?? 'None'}
                </span>
              </div>
            </div>
          )}

          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-lg border border-[#1E293B] px-4 py-2 text-sm text-slate-400 transition hover:border-red-500/50 hover:text-red-400"
            >
              Sign Out
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500">
          Sprint 1 → Pipeline Board + War Room
        </p>
      </div>
    </div>
  )
}
