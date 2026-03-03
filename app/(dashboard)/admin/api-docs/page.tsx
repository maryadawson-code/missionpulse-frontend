// filepath: app/(dashboard)/admin/api-docs/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

const API_ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/opportunities',
    description: 'List opportunities with filtering, sorting, and pagination',
    auth: 'Bearer token',
    params: 'page, per_page, status, phase, search',
  },
  {
    method: 'GET',
    path: '/api/v1/opportunities/:id',
    description: 'Get opportunity detail with related entities',
    auth: 'Bearer token',
    params: 'include (sections, compliance, pricing)',
  },
  {
    method: 'POST',
    path: '/api/v1/opportunities',
    description: 'Create a new opportunity',
    auth: 'Bearer token',
    params: 'title, agency, naics_code, due_date, ...',
  },
  {
    method: 'PATCH',
    path: '/api/v1/opportunities/:id',
    description: 'Update opportunity fields',
    auth: 'Bearer token',
    params: 'Any writable field',
  },
  {
    method: 'GET',
    path: '/api/v1/proposals/:id/sections',
    description: 'List proposal sections with content',
    auth: 'Bearer token',
    params: 'include_content, status',
  },
  {
    method: 'POST',
    path: '/api/v1/ai/query',
    description: 'Execute an AI query against the pipeline',
    auth: 'Bearer token',
    params: 'prompt, agent_type, opportunity_id, classification',
  },
  {
    method: 'GET',
    path: '/api/v1/compliance/:opportunity_id',
    description: 'Get compliance requirements for an opportunity',
    auth: 'Bearer token',
    params: 'status, priority',
  },
  {
    method: 'GET',
    path: '/api/v1/analytics/pipeline',
    description: 'Pipeline analytics — win rate, value, phase distribution',
    auth: 'Bearer token',
    params: 'period (7d, 30d, 90d, 1y)',
  },
  {
    method: 'POST',
    path: '/api/v1/docgen',
    description: 'Generate a document (DOCX, XLSX, PPTX)',
    auth: 'Bearer token',
    params: 'type, opportunity_id, format',
  },
  {
    method: 'GET',
    path: '/api/v1/token-usage',
    description: 'Get current token balance and usage',
    auth: 'Bearer token',
    params: 'period_start, period_end',
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
        <h1 className="text-2xl font-bold">REST API Documentation</h1>
        <p className="text-sm text-muted-foreground">
          MissionPulse REST API v1 — Enterprise plan required. All endpoints require Bearer token authentication.
        </p>
      </div>

      {/* Auth section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-3">Authentication</h3>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            All API requests require a Bearer token in the Authorization header.
            Generate API keys in Settings &rarr; API Keys.
          </p>
          <div className="bg-muted rounded-md p-3 font-mono text-xs">
            Authorization: Bearer mp_live_xxxxxxxxxxxx
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
            <p className="text-muted-foreground">AI Endpoints</p>
            <p className="font-medium">20 req/min</p>
          </div>
          <div>
            <p className="text-muted-foreground">DocGen</p>
            <p className="font-medium">10 req/min</p>
          </div>
        </div>
      </div>

      {/* Endpoints table */}
      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Endpoints</h3>
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
              <p className="text-xs text-muted-foreground">
                Parameters: <code className="bg-muted px-1 rounded">{ep.params}</code>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Response format */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-3">Response Format</h3>
        <div className="bg-muted rounded-md p-4 font-mono text-xs whitespace-pre">
{`{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 142,
    "request_id": "req_xxxx"
  }
}`}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Full OpenAPI 3.0 specification available at /api/v1/openapi.json.
        All responses follow JSON:API conventions. RBAC is enforced per-endpoint
        matching the authenticated user&apos;s role permissions.
      </p>
    </div>
  )
}
