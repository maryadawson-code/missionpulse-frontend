// filepath: app/(dashboard)/admin/api-docs/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

const API_ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/health',
    description: 'System health check — database, auth, and AI gateway status',
    auth: 'None (public)',
    params: 'None',
  },
  {
    method: 'GET',
    path: '/api/metrics',
    description: 'Aggregated performance, query, and cache metrics',
    auth: 'Session (admin role)',
    params: 'None',
  },
  {
    method: 'POST',
    path: '/api/docgen/docx',
    description: 'Generate DOCX documents (tech volume, key personnel, FAR risk memo)',
    auth: 'Session (proposals.canView)',
    params: 'type, opportunityId',
  },
  {
    method: 'POST',
    path: '/api/docgen/xlsx',
    description: 'Generate XLSX workbooks (compliance matrix, cost model, red team scorecard)',
    auth: 'Session (proposals.canView)',
    params: 'type, opportunityId',
  },
  {
    method: 'POST',
    path: '/api/docgen/pptx',
    description: 'Generate PPTX decks (orals presentation, gate decision brief)',
    auth: 'Session (proposals.canView)',
    params: 'type, opportunityId',
  },
  {
    method: 'POST',
    path: '/api/admin/sso',
    description: 'Upsert SAML SSO configuration for the organization',
    auth: 'Session (admin.canEdit)',
    params: 'companyId, entityId, ssoUrl, certificate',
  },
  {
    method: 'POST',
    path: '/api/admin/roles',
    description: 'Create a custom RBAC role with module permissions',
    auth: 'Session (admin.canEdit)',
    params: 'companyId, name, description, permissions',
  },
  {
    method: 'POST',
    path: '/api/admin/workspaces',
    description: 'Create a new workspace under the parent company',
    auth: 'Session (admin.canEdit)',
    params: 'parentCompanyId, name, domain',
  },
  {
    method: 'POST',
    path: '/api/admin/templates',
    description: 'Update brand settings (color, logo, header/footer text)',
    auth: 'Session (admin.canEdit)',
    params: 'companyId, primaryColor, headerText, footerText, logoUrl',
  },
  {
    method: 'POST',
    path: '/api/admin/audit-retention',
    description: 'Update audit log retention period (90 days to 7 years)',
    auth: 'Session (admin.canEdit)',
    params: 'companyId, retentionDays',
  },
  {
    method: 'POST',
    path: '/api/newsletter',
    description: 'Subscribe an email to the newsletter list',
    auth: 'None (public)',
    params: 'email',
  },
  {
    method: 'POST',
    path: '/api/webhooks/stripe',
    description: 'Stripe webhook receiver for subscription events',
    auth: 'Stripe signature verification',
    params: 'Stripe event payload',
  },
  {
    method: 'GET',
    path: '/api/section-versions',
    description: 'List version history for a proposal section',
    auth: 'Session',
    params: 'sectionId',
  },
]

const methodColors: Record<string, string> = {
  GET: '#10B981',
  POST: '#3B82F6',
  PATCH: '#F59E0B',
  DELETE: '#EF4444',
}

export default async function APIDocsPage() {
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
  if (!hasPermission(role, 'admin', 'canView')) redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API Reference</h1>
        <p className="text-sm text-muted-foreground">
          MissionPulse internal API routes. All session-authenticated endpoints require an active
          Supabase auth session. Admin endpoints enforce RBAC via role permissions.
        </p>
      </div>

      {/* Auth section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-3">Authentication</h3>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Most endpoints use Supabase session cookies for authentication.
            Public endpoints (health, newsletter) require no auth.
            Admin endpoints require <code className="bg-muted px-1 rounded">admin.canEdit</code> permission.
          </p>
          <div className="bg-muted rounded-md p-3 font-mono text-xs">
            Cookie: sb-access-token=...; sb-refresh-token=...
          </div>
        </div>
      </div>

      {/* Rate limiting */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-3">Rate Limits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Standard</p>
            <p className="font-medium">100 req/min</p>
          </div>
          <div>
            <p className="text-muted-foreground">DocGen</p>
            <p className="font-medium">10 req/min</p>
          </div>
          <div>
            <p className="text-muted-foreground">Webhooks</p>
            <p className="font-medium">No limit (signature-verified)</p>
          </div>
        </div>
      </div>

      {/* Endpoints table */}
      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Endpoints ({API_ENDPOINTS.length})</h3>
        </div>
        <div className="divide-y">
          {API_ENDPOINTS.map((ep, i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded font-mono"
                  style={{
                    backgroundColor: `${methodColors[ep.method]}20`,
                    color: methodColors[ep.method],
                  }}
                >
                  {ep.method}
                </span>
                <code className="text-sm font-mono">{ep.path}</code>
              </div>
              <p className="text-sm text-muted-foreground">{ep.description}</p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Auth: <code className="bg-muted px-1 rounded">{ep.auth}</code></span>
                <span>Params: <code className="bg-muted px-1 rounded">{ep.params}</code></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Response format */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-3">Response Format</h3>
        <div className="bg-muted rounded-md p-4 font-mono text-xs whitespace-pre">
{`// Success
{ "success": true, "id": "uuid" }

// Error
{ "error": "Description of what went wrong" }

// DocGen routes return binary file downloads
// Content-Disposition: attachment; filename="..."`}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        All admin mutation endpoints write to both activity_log (user-visible) and
        audit_logs (immutable compliance trail). RBAC is enforced per-endpoint
        matching the authenticated user&apos;s role permissions.
      </p>
    </div>
  )
}
