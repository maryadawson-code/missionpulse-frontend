import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole, hasPermission } from '@/lib/rbac/config'
import Link from 'next/link'
import { UpgradeNudge } from '@/components/ui/UpgradeNudge'

interface IntegrationItem {
  href: string
  label: string
  desc: string
  icon: string
  tier: 'built_in' | 'one_click' | 'enterprise'
  status?: 'active'
}

const INTEGRATIONS: IntegrationItem[] = [
  // Built-in — always available
  { href: '/integrations/sam-gov', label: 'SAM.gov', desc: 'Federal opportunity search (no API key needed)', icon: '🏛️', tier: 'built_in', status: 'active' },
  { href: '/ai-chat', label: 'AI Assistant', desc: 'Built-in proposal AI powered by AskSage', icon: '🤖', tier: 'built_in', status: 'active' },
  { href: '/settings/import', label: 'Data Import', desc: 'CSV/Excel import', icon: '📥', tier: 'built_in', status: 'active' },

  // One-click — OAuth-based
  { href: '/integrations/slack', label: 'Slack', desc: 'Notifications and team updates', icon: '💬', tier: 'one_click', status: 'active' },
  { href: '/integrations/google', label: 'Google Workspace', desc: 'Drive, Docs, and Calendar sync', icon: '📧', tier: 'one_click', status: 'active' },

  // Enterprise — requires enterprise plan
  { href: '/admin/integrations/hubspot', label: 'HubSpot / Salesforce', desc: 'CRM pipeline sync and field mappings', icon: '🔗', tier: 'enterprise' },
  { href: '#', label: 'GovWin', desc: 'Opportunity intelligence feed', icon: '📊', tier: 'enterprise' },
  { href: '#', label: 'DocuSign', desc: 'Proposal signature workflows', icon: '✍️', tier: 'enterprise' },
  { href: '#', label: 'Microsoft 365', desc: 'Teams, SharePoint, and Outlook', icon: '🟦', tier: 'enterprise' },
]

export default async function AdminIntegrationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const role = resolveRole(profile?.role)
  if (!hasPermission(role, 'admin', 'canView')) return null

  // Get subscription tier
  let subscriptionTier = 'starter'
  if (profile?.company_id) {
    const { data: company } = await supabase
      .from('companies')
      .select('subscription_tier')
      .eq('id', profile.company_id)
      .single()
    subscriptionTier = company?.subscription_tier ?? 'starter'
  }

  const builtIn = INTEGRATIONS.filter((i) => i.tier === 'built_in')
  const oneClick = INTEGRATIONS.filter((i) => i.tier === 'one_click')
  const enterprise = INTEGRATIONS.filter((i) => i.tier === 'enterprise')
  const isEnterprise = subscriptionTier === 'enterprise'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your favorite tools. Built-in integrations work out of the box.
        </p>
      </div>

      {/* Built-in */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Built-in
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {builtIn.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card/50 p-5 hover:border-primary/40 transition-colors"
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.label}
                  </h3>
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                    Active
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* One-click OAuth integrations */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          One-Click
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {oneClick.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card/50 p-5 hover:border-primary/40 transition-colors"
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.label}
                  </h3>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                    Available
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Enterprise */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Enterprise
        </h2>
        {!isEnterprise && (
          <UpgradeNudge
            feature="Advanced integrations"
            targetPlan="Enterprise"
            className="mb-3"
          />
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {enterprise.map((item) => (
            <div
              key={item.label}
              className={`flex items-start gap-3 rounded-xl border border-border bg-card/50 p-5 ${
                isEnterprise ? 'hover:border-primary/40' : 'opacity-60'
              } transition-colors`}
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {item.label}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
