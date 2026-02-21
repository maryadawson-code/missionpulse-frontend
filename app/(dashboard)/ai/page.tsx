// filepath: app/(dashboard)/ai/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTokens(count: number | null): string {
  if (!count) return '—'
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return String(count)
}

export default async function AIPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

  // Fetch chat history
  const { data: chats, error: chatsError } = await supabase
    .from('chat_history')
    .select('id, title, agent_name, message_count, token_count, is_starred, is_archived, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(50)

  // Fetch recent AI interactions for usage stats
  const { data: interactions, error: interactionsError } = await supabase
    .from('ai_interactions')
    .select('id, agent_type, tokens_input, tokens_output, user_rating, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const chatList = chats ?? []
  const interactionList = interactions ?? []
  const totalTokens = interactionList.reduce((sum, i) => sum + (i.tokens_input ?? 0) + (i.tokens_output ?? 0), 0)
  const ratedInteractions = interactionList.filter((i) => i.user_rating != null)
  const avgRating = ratedInteractions.length > 0
    ? (ratedInteractions.reduce((sum, i) => sum + (i.user_rating ?? 0), 0) / ratedInteractions.length).toFixed(1)
    : '—'

  // Agent type breakdown
  const agentMap = new Map<string, number>()
  for (const i of interactionList) {
    agentMap.set(i.agent_type, (agentMap.get(i.agent_type) ?? 0) + 1)
  }

  const error = chatsError || interactionsError

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
        <p className="mt-1 text-sm text-gray-500">
          AI-powered chat for drafting proposal sections, analyzing requirements, and generating content.
        </p>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Conversations</p>
          <p className="mt-2 text-2xl font-bold text-white">{chatList.length}</p>
          <p className="mt-1 text-xs text-gray-500">chat sessions</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Interactions</p>
          <p className="mt-2 text-2xl font-bold text-white">{interactionList.length}</p>
          <p className="mt-1 text-xs text-gray-500">recent queries</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Tokens Used</p>
          <p className="mt-2 text-2xl font-bold text-[#00E5FA]">{formatTokens(totalTokens)}</p>
          <p className="mt-1 text-xs text-gray-500">input + output</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Avg Rating</p>
          <p className="mt-2 text-2xl font-bold text-amber-400">{avgRating}</p>
          <p className="mt-1 text-xs text-gray-500">{ratedInteractions.length} rated</p>
        </div>
      </div>

      {/* Agent Usage Breakdown */}
      {agentMap.size > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Agent Usage</h2>
          <div className="space-y-3">
            {Array.from(agentMap.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([agent, count]) => (
                <div key={agent} className="flex items-center gap-3">
                  <span className="w-36 text-xs text-gray-400 truncate">{agent.replace(/_/g, ' ')}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-800">
                    <div
                      className="h-2 rounded-full bg-[#00E5FA]"
                      style={{ width: `${Math.max(4, (count / interactionList.length) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-mono text-gray-400">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          Failed to load AI data: {error.message}
        </div>
      )}

      {/* Chat History */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Chat History</h2>
          <p className="text-xs text-gray-500 mt-1">Recent AI-assisted conversations and drafting sessions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Title</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Agent</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Messages</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Tokens</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Flags</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {chatList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    No chat sessions yet. Start a conversation with the AI assistant to see history here.
                  </td>
                </tr>
              ) : (
                chatList.map((chat) => (
                  <tr key={chat.id} className="transition-colors hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm text-gray-200 max-w-xs truncate">
                      {chat.title ?? 'Untitled conversation'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {chat.agent_name.replace(/_/g, ' ')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-400">
                      {chat.message_count ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-400">
                      {formatTokens(chat.token_count)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      <span className="flex gap-1">
                        {chat.is_starred && <span title="Starred" className="text-amber-400">&#9733;</span>}
                        {chat.is_archived && <span title="Archived" className="text-gray-500">&#128451;</span>}
                        {!chat.is_starred && !chat.is_archived && '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {formatDate(chat.updated_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Showing {chatList.length} conversation{chatList.length !== 1 ? 's' : ''} and {interactionList.length} recent interaction{interactionList.length !== 1 ? 's' : ''}.
      </p>
    </div>
  )
}
