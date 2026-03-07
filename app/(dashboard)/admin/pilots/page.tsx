// filepath: app/(dashboard)/admin/pilots/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listPilots } from '@/lib/billing/pilots'
import { PilotAdminTable } from '@/components/features/admin/PilotAdminTable'

export default async function PilotsAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'executive') redirect('/dashboard')
  const pilots = await listPilots()
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pilot Management</h1>
        <p className="text-gray-400 mt-1">Active pilots, engagement scores, and conversion pipeline</p>
      </div>
      <PilotAdminTable pilots={pilots} />
    </div>
  )
}
