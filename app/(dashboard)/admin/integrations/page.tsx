import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import Link from 'next/link'

const INTEGRATIONS = [
  { href: '/integrations/sam-gov', label: 'SAM.gov', desc: 'Federal opportunity search & import', color: '#1a5276' },
  { href: '/integrations/hubspot', label: 'HubSpot CRM', desc: 'Bi-directional opportunity & contact sync', color: '#ff7a59' },
  { href: '/integrations/govwin', label: 'GovWin IQ', desc: 'Opportunity intelligence & competitive data', color: '#2e86c1' },
  { href: '/integrations/m365', label: 'Microsoft 365', desc: 'Teams, SharePoint, and Outlook integration', color: '#5b5fc7' },
  { href: '/integrations/salesforce', label: 'Salesforce', desc: 'CRM opportunity & account sync', color: '#00a1e0' },
  { href: '/integrations/slack', label: 'Slack', desc: 'Channel notifications & proposal alerts', color: '#4a154b' },
  { href: '/integrations/docusign', label: 'DocuSign', desc: 'Electronic signatures & document workflow', color: '#ff4438' },
  { href: '/integrations/google', label: 'Google Workspace', desc: 'Drive, Docs, and Calendar integration', color: '#4285f4' },
  { href: '/integrations/usaspending', label: 'USAspending', desc: 'Federal award data & spending analytics', color: '#112e51' },
  { href: '/integrations/bloomberg-gov', label: 'Bloomberg Government', desc: 'Market analytics & competitive intelligence', color: '#1e3a5f' },
  { href: '/admin/integrations/hubspot', label: 'HubSpot Admin', desc: 'Field mappings, sync logs, and configuration', color: '#ff7a59' },
  { href: '/settings/import', label: 'Data Import', desc: 'CSV/Excel import settings', color: '#6b7280' },
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
          Configure and monitor external service integrations. {INTEGRATIONS.length} services available.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-5 hover:border-[#00E5FA]/40 transition-colors"
          >
            <div
              className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: item.color }}
            >
              {item.label.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white group-hover:text-[#00E5FA] transition-colors">
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
