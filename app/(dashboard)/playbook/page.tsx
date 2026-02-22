import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { PlaybookBrowser } from '@/components/features/playbook/PlaybookBrowser'

export default async function PlaybookPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  // Playbook maps to 'documents' RBAC module per roadmap
  if (!hasPermission(role, 'documents', 'shouldRender')) {
    return null
  }

  const { data: entries } = await supabase
    .from('playbook_entries')
    .select(
      'id, title, category, user_prompt, keywords, quality_rating, effectiveness_score, use_count, created_at'
    )
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Playbook</h1>
        <p className="mt-1 text-sm text-gray-500">
          Golden content library — past performance narratives, boilerplate
          sections, capability statements, and win themes.
        </p>
      </div>

      {/* Voice Profile action card */}
      <Link
        href="/playbook/voice-profile"
        className="flex items-center gap-4 rounded-lg border border-cyan/20 bg-cyan/5 px-5 py-4 hover:border-cyan/40 hover:bg-cyan/10 transition-colors group"
      >
        <span className="text-2xl">🎙</span>
        <div>
          <p className="text-sm font-semibold text-white group-hover:text-cyan transition-colors">
            Voice Profile &amp; AI Training
          </p>
          <p className="text-xs text-slate mt-0.5">
            Train AI with your company&apos;s writing style and voice
          </p>
        </div>
      </Link>

      <PlaybookBrowser entries={entries ?? []} />
    </div>
  )
}
