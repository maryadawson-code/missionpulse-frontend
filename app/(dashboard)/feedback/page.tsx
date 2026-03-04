import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FeedbackClient } from './FeedbackClient'

export default async function FeedbackPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: suggestions } = await supabase
    .from('feature_suggestions')
    .select('id, title, description, category, status, votes, submitted_by, created_at')
    .order('votes', { ascending: false })
    .limit(100)

  // Check which ones user has voted for
  const { data: userVotes } = await supabase
    .from('feature_votes')
    .select('suggestion_id')
    .eq('user_id', user.id)

  const votedIds = new Set((userVotes ?? []).map((v) => v.suggestion_id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feature Suggestions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit ideas, upvote suggestions, and help shape the MissionPulse
          roadmap.
        </p>
      </div>

      <FeedbackClient
        suggestions={(suggestions ?? []).map((s) => ({
          ...s,
          hasVoted: votedIds.has(s.id),
        }))}
      />
    </div>
  )
}
