import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import { ChatPanel } from '@/components/features/ai-chat/ChatPanel'

export default async function AIChatPage() {
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
  if (!hasPermission(role, 'ai_chat', 'shouldRender')) {
    redirect('/')
  }

  // Load most recent session for this user
  const { data: sessions } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)

  const latestSessionId = sessions?.[0]?.id ?? null

  // Load messages for the session
  let existingMessages: { id: string; role: string; content: string }[] = []
  if (latestSessionId) {
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('id, role, content')
      .eq('session_id', latestSessionId)
      .order('created_at', { ascending: true })
      .limit(50)

    existingMessages = messages ?? []
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ask questions about your pipeline, compliance, strategy, or general
          GovCon topics.
        </p>
      </div>

      <ChatPanel
        existingMessages={existingMessages}
        existingSessionId={latestSessionId}
      />
    </div>
  )
}
