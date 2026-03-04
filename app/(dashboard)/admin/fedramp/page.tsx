// filepath: app/(dashboard)/admin/fedramp/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveRole, hasPermission } from '@/lib/rbac/config'

const FEDRAMP_CONTROLS = [
  { id: 'AC', name: 'Access Control', status: 'implemented', count: 25 },
  { id: 'AU', name: 'Audit & Accountability', status: 'implemented', count: 16 },
  { id: 'AT', name: 'Awareness & Training', status: 'partial', count: 5 },
  { id: 'CM', name: 'Configuration Management', status: 'implemented', count: 11 },
  { id: 'IA', name: 'Identification & Authentication', status: 'implemented', count: 11 },
  { id: 'IR', name: 'Incident Response', status: 'planned', count: 10 },
  { id: 'MA', name: 'Maintenance', status: 'planned', count: 6 },
  { id: 'MP', name: 'Media Protection', status: 'partial', count: 8 },
  { id: 'PE', name: 'Physical & Environmental', status: 'inherited', count: 20 },
  { id: 'PL', name: 'Planning', status: 'implemented', count: 9 },
  { id: 'RA', name: 'Risk Assessment', status: 'partial', count: 6 },
  { id: 'SA', name: 'System & Services Acquisition', status: 'partial', count: 22 },
  { id: 'SC', name: 'System & Communications Protection', status: 'implemented', count: 44 },
  { id: 'SI', name: 'System & Information Integrity', status: 'implemented', count: 16 },
]

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  implemented: { bg: '#10B98120', text: '#10B981', label: 'Implemented' },
  partial: { bg: '#F59E0B20', text: '#F59E0B', label: 'Partial' },
  planned: { bg: '#3B82F620', text: '#3B82F6', label: 'Planned' },
  inherited: { bg: '#8B5CF620', text: '#8B5CF6', label: 'Inherited (CSP)' },
}

export default async function FedRAMPPage() {
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

  const implemented = FEDRAMP_CONTROLS.filter((c) => c.status === 'implemented').length
  const total = FEDRAMP_CONTROLS.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">FedRAMP 20x Compliance</h1>
        <p className="text-sm text-muted-foreground">
          NIST 800-53 Rev 5 control implementation status — FedRAMP Moderate baseline
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-5">
          <p className="text-xs text-muted-foreground">Control Families</p>
          <p className="text-3xl font-bold">{total}</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-xs text-muted-foreground">Implemented</p>
          <p className="text-3xl font-bold text-green-500">{implemented}</p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-xs text-muted-foreground">Coverage</p>
          <p className="text-3xl font-bold">
            {Math.round((implemented / total) * 100)}%
          </p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-xs text-muted-foreground">Authorization</p>
          <p className="text-sm font-bold text-cyan-400">In Progress</p>
        </div>
      </div>

      {/* Platform security features */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-3">Platform Security Measures</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          {[
            'ATO-ready Supabase (SOC 2 Type II)',
            'Row-Level Security on all tables',
            'Immutable audit logs (DB triggers)',
            'CUI classification & portion marking',
            'AskSage FedRAMP IL5 for AI',
            'HTTPS/TLS 1.3 everywhere',
            'Session timeout per role (15-60 min)',
            'IP-based rate limiting',
            'RBAC: 12 roles × 15 modules',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Control family table */}
      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-semibold">NIST 800-53 Control Families</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">ID</th>
                <th className="text-left p-3 font-medium">Family</th>
                <th className="text-center p-3 font-medium">Controls</th>
                <th className="text-center p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {FEDRAMP_CONTROLS.map((ctrl) => {
                const st = statusColors[ctrl.status]
                return (
                  <tr key={ctrl.id} className="border-b last:border-0">
                    <td className="p-3 font-mono">{ctrl.id}</td>
                    <td className="p-3">{ctrl.name}</td>
                    <td className="p-3 text-center">{ctrl.count}</td>
                    <td className="p-3 text-center">
                      <span
                        className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: st.bg, color: st.text }}
                      >
                        {st.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        FedRAMP 20x authorization in progress. All CUI-classified AI requests route exclusively through
        AskSage (FedRAMP IL5). Physical and environmental controls inherited from Supabase CSP.
        Contact compliance@missionpulse.ai for the full SSP.
      </p>
    </div>
  )
}
