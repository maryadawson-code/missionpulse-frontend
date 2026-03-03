import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import NewOpportunityForm from './NewOpportunityForm'

export default async function NewOpportunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'pipeline', 'canEdit')) redirect('/dashboard')

  return <NewOpportunityForm />
}
