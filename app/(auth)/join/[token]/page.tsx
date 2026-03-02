import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { JoinForm } from './JoinForm'

export const metadata: Metadata = {
  title: 'Join Workspace — MissionPulse',
}

interface JoinPageProps {
  params: Promise<{ token: string }>
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params
  const supabase = createClient()

  // Look up the invitation
  const { data: invitation } = await supabase
    .from('user_invitations')
    .select('id, company_id, role, status, expires_at')
    .eq('token', token)
    .single()

  if (!invitation) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-600 dark:text-red-400">
          This invite link is invalid or has already been used.
        </div>
        <a href="/signup" className="text-sm text-primary hover:text-primary/80">
          Sign up without an invite
        </a>
      </div>
    )
  }

  // Check expiry
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-600 dark:text-amber-400">
          This invite link has expired. Ask your team admin for a new one.
        </div>
        <a href="/signup" className="text-sm text-primary hover:text-primary/80">
          Sign up without an invite
        </a>
      </div>
    )
  }

  if (invitation.status !== 'pending') {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-600 dark:text-amber-400">
          This invite has already been used.
        </div>
        <a href="/login" className="text-sm text-primary hover:text-primary/80">
          Sign in to your account
        </a>
      </div>
    )
  }

  // Check if user is already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user && invitation.company_id) {
    // Auto-link to the company
    await supabase
      .from('profiles')
      .update({
        company_id: invitation.company_id,
        role: invitation.role,
      })
      .eq('id', user.id)

    await supabase
      .from('user_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    redirect('/dashboard')
  }

  // Get company name for display
  const companyId = invitation.company_id
  const { data: company } = companyId
    ? await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single()
    : { data: null }

  const roleName =
    invitation.role === 'executive'
      ? 'Full Access'
      : invitation.role === 'author'
        ? 'Proposal Writer'
        : invitation.role === 'consultant'
          ? 'Reviewer'
          : invitation.role

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-bold text-foreground">
          Join {company?.name ?? 'Workspace'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You&apos;ve been invited as <span className="font-medium text-foreground">{roleName}</span>
        </p>
      </div>

      <JoinForm token={token} invitationId={invitation.id} companyId={invitation.company_id ?? ''} role={invitation.role ?? 'author'} />
    </div>
  )
}
