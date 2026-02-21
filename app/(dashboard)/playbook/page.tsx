import { redirect } from 'next/navigation'
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
    redirect('/')
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

      <PlaybookBrowser entries={entries ?? []} />
    </div>
  )
}
