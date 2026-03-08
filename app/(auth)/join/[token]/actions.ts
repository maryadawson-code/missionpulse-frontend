'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function joinWorkspace(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const invitationId = formData.get('invitation_id') as string

  // Verify invitation exists and extract trusted company_id + role from DB
  const { data: invitation, error: invError } = await supabase
    .from('user_invitations')
    .select('id, company_id, role, status')
    .eq('id', invitationId)
    .single()

  if (invError || !invitation) {
    return { error: 'Invalid invitation' }
  }

  if (invitation.status !== 'pending') {
    return { error: 'This invitation has already been used' }
  }

  const companyId = invitation.company_id
  const role = invitation.role

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        company_id: companyId,
        role,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // If email confirmation required, store invite context for post-confirm
  if (!data.session) {
    // Mark the invitation with the email so post-confirm can link
    await supabase
      .from('user_invitations')
      .update({ email, full_name: fullName })
      .eq('id', invitationId)

    return { confirmEmail: true }
  }

  // Session exists — link immediately
  if (data.user) {
    await supabase
      .from('profiles')
      .update({
        company_id: companyId,
        role,
      })
      .eq('id', data.user.id)

    await supabase
      .from('user_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId)

    await supabase.from('audit_logs').insert({
      action: 'user_joined_workspace',
      user_id: data.user.id,
      metadata: {
        company_id: companyId,
        role,
        invitation_id: invitationId,
        user_name: fullName,
      },
      user_role: role,
    })
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
