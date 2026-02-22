import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import Link from 'next/link'

const INTEGRATIONS = [
  { href: '/admin/integrations/hubspot', label: 'HubSpot', desc: 'CRM field mappings & sync', icon: '🔗' },
  { href: '/integrations', label: 'All Integrations', desc: 'View all connected services', icon: '⚙️' },
  { href: '/settings/import', label: 'Data Import', desc: 'CSV/Excel import settings', icon: '📥' },
]

export default async function AdminIntegrationsPage() {
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
  if (!hasPermission(role, 'admin', 'canView')) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Integration Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure and monitor external service integrations.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-5 hover:border-cyan/40 transition-colors"
          >
            <span className="text-2xl">{item.icon}</span>
            <div>
              <h3 className="text-sm font-semibold text-white group-hover:text-cyan transition-colors">
                {item.label}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
