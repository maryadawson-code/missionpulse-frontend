import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission, getAllowedAgents } from '@/lib/rbac/config'

export const metadata: Metadata = {
  title: 'AI Chat — MissionPulse',
}
import { ChatPanel } from '@/components/features/ai-chat/ChatPanel'
import { TokenBudgetBanner } from '@/components/features/ai/TokenBudgetBanner'

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
    return null
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

  // Fetch opportunities for context picker
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, title, agency')
    .order('updated_at', { ascending: false })
    .limit(50)

  // Resolve allowed agents for this role
  const allowedAgents = getAllowedAgents(role)

  // Token usage for budget banner
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: tokenUsage } = await supabase
    .from('token_usage')
    .select('input_tokens, output_tokens')
    .eq('user_id', user.id)
    .gte('created_at', monthStart.toISOString())

  const totalTokens = (tokenUsage ?? []).reduce(
    (sum, t) => sum + (t.input_tokens ?? 0) + (t.output_tokens ?? 0),
    0
  )
  const monthlyLimit = 500_000
  const usagePercent = Math.round((totalTokens / monthlyLimit) * 100)
  const threshold =
    usagePercent >= 100
      ? 'hard_block'
      : usagePercent >= 90
        ? 'soft_block'
        : usagePercent >= 75
          ? 'urgent'
          : usagePercent >= 50
            ? 'warning'
            : usagePercent >= 25
              ? 'info'
              : 'normal'

  const budgetMessage =
    threshold === 'normal'
      ? null
      : threshold === 'info'
        ? `You've used ${usagePercent}% of your monthly AI token allocation.`
        : threshold === 'warning'
          ? `Token usage at ${usagePercent}%. Consider upgrading for additional capacity.`
          : `Token budget at ${usagePercent}%. AI features may be limited.`

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ask questions about your pipeline, compliance, strategy, or general
          GovCon topics.
        </p>
      </div>

      <TokenBudgetBanner
        threshold={threshold}
        message={budgetMessage}
        upgradeCta={usagePercent >= 75}
        usagePercent={usagePercent}
        gracePeriod={false}
      />

      <ChatPanel
        existingMessages={existingMessages}
        existingSessionId={latestSessionId}
        opportunities={(opportunities ?? []).map((o) => ({
          id: o.id,
          title: o.title,
          agency: o.agency,
        }))}
        allowedAgents={allowedAgents}
      />
    </div>
  )
}
