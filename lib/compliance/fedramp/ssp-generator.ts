/**
 * FedRAMP SSP Generator — System Security Plan
 * Sprint 36 (T-36.1) — Phase L v2.0
 *
 * Generates FedRAMP-aligned System Security Plan documentation
 * based on NIST 800-53 Rev 5 control families. Outputs structured
 * JSON that can be rendered into OSCAL or PDF.
 *
 * © 2026 Mission Meets Tech
 */

// ─── Types ──────────────────────────────────────────────────────

export type ControlStatus = 'implemented' | 'partial' | 'planned' | 'inherited' | 'not_applicable'

export interface SecurityControl {
  controlId: string
  family: string
  title: string
  status: ControlStatus
  implementation: string
  responsibleRole: string
  evidence: string[]
}

export interface SSPDocument {
  systemName: string
  systemId: string
  impactLevel: 'Low' | 'Moderate' | 'High'
  generatedAt: string
  controlFamilies: ControlFamilySummary[]
  controls: SecurityControl[]
  overallCompliance: number
}

interface ControlFamilySummary {
  id: string
  name: string
  totalControls: number
  implemented: number
  partial: number
  planned: number
  inherited: number
}

// ─── NIST 800-53 Control Families ───────────────────────────────

const CONTROL_FAMILIES = [
  { id: 'AC', name: 'Access Control', baseCount: 25 },
  { id: 'AU', name: 'Audit & Accountability', baseCount: 16 },
  { id: 'AT', name: 'Awareness & Training', baseCount: 5 },
  { id: 'CM', name: 'Configuration Management', baseCount: 11 },
  { id: 'IA', name: 'Identification & Authentication', baseCount: 11 },
  { id: 'IR', name: 'Incident Response', baseCount: 10 },
  { id: 'MA', name: 'Maintenance', baseCount: 6 },
  { id: 'MP', name: 'Media Protection', baseCount: 8 },
  { id: 'PE', name: 'Physical & Environmental', baseCount: 20 },
  { id: 'PL', name: 'Planning', baseCount: 9 },
  { id: 'RA', name: 'Risk Assessment', baseCount: 6 },
  { id: 'SA', name: 'System & Services Acquisition', baseCount: 22 },
  { id: 'SC', name: 'System & Communications Protection', baseCount: 44 },
  { id: 'SI', name: 'System & Information Integrity', baseCount: 16 },
] as const

// ─── Platform Controls (what MissionPulse implements) ────────────

const PLATFORM_CONTROLS: SecurityControl[] = [
  {
    controlId: 'AC-2',
    family: 'AC',
    title: 'Account Management',
    status: 'implemented',
    implementation: 'User accounts managed via Supabase Auth with role-based access. 12 predefined roles with per-module permissions. Custom roles support for enterprise tier.',
    responsibleRole: 'System Administrator',
    evidence: ['lib/rbac/config.ts', 'lib/rbac/custom-roles.ts'],
  },
  {
    controlId: 'AC-3',
    family: 'AC',
    title: 'Access Enforcement',
    status: 'implemented',
    implementation: 'Row-Level Security (RLS) policies on all Supabase tables. Server-side RBAC checks via resolveRole() and hasPermission() on every route.',
    responsibleRole: 'System Administrator',
    evidence: ['middleware.ts', 'lib/rbac/config.ts'],
  },
  {
    controlId: 'AC-7',
    family: 'AC',
    title: 'Unsuccessful Login Attempts',
    status: 'implemented',
    implementation: 'Supabase Auth handles login attempt limiting. Rate limiting applied at middleware layer.',
    responsibleRole: 'System Administrator',
    evidence: ['middleware.ts'],
  },
  {
    controlId: 'AU-2',
    family: 'AU',
    title: 'Audit Events',
    status: 'implemented',
    implementation: 'Comprehensive audit logging via audit_logs table. All CRUD operations, auth events, and AI interactions are logged with user, timestamp, and action details.',
    responsibleRole: 'Security Officer',
    evidence: ['lib/audit/retention.ts'],
  },
  {
    controlId: 'AU-6',
    family: 'AU',
    title: 'Audit Review & Reporting',
    status: 'implemented',
    implementation: 'Admin audit dashboard with filtering, export, and retention policies (1-7 year configurable). Automated purge via Edge Function.',
    responsibleRole: 'Security Officer',
    evidence: ['app/(dashboard)/admin/audit-retention/page.tsx', 'supabase/functions/audit-retention/index.ts'],
  },
  {
    controlId: 'IA-2',
    family: 'IA',
    title: 'Identification & Authentication',
    status: 'implemented',
    implementation: 'Multi-factor authentication via Supabase Auth. SAML 2.0 SSO for enterprise customers. SSO-only mode enforcement.',
    responsibleRole: 'System Administrator',
    evidence: ['lib/auth/saml.ts'],
  },
  {
    controlId: 'SC-8',
    family: 'SC',
    title: 'Transmission Confidentiality',
    status: 'implemented',
    implementation: 'All traffic encrypted via TLS 1.3. API keys stored as SHA-256 hashes. SAML credentials stored encrypted.',
    responsibleRole: 'System Administrator',
    evidence: ['lib/api/keys.ts'],
  },
  {
    controlId: 'SC-28',
    family: 'SC',
    title: 'Protection of Information at Rest',
    status: 'implemented',
    implementation: 'Supabase PostgreSQL with AES-256 encryption at rest. CUI classification engine prevents sensitive data leakage.',
    responsibleRole: 'System Administrator',
    evidence: ['lib/ai/types.ts'],
  },
  {
    controlId: 'SI-4',
    family: 'SI',
    title: 'System Monitoring',
    status: 'implemented',
    implementation: 'Customer health scoring, system health dashboard, and AI usage monitoring. Proactive anomaly detection via CSM module.',
    responsibleRole: 'Security Officer',
    evidence: ['lib/csm/health.ts', 'app/(dashboard)/admin/system-health/page.tsx'],
  },
  {
    controlId: 'PE-1',
    family: 'PE',
    title: 'Physical & Environmental Policy',
    status: 'inherited',
    implementation: 'Inherited from cloud service provider (AWS/Supabase). Physical security managed by CSP per FedRAMP authorization.',
    responsibleRole: 'Cloud Service Provider',
    evidence: [],
  },
]

// ─── Public API ─────────────────────────────────────────────────

/**
 * Generate a System Security Plan document.
 */
export function generateSSP(
  systemName: string,
  systemId: string,
  impactLevel: SSPDocument['impactLevel'] = 'Moderate'
): SSPDocument {
  const controlFamilies: ControlFamilySummary[] = CONTROL_FAMILIES.map(family => {
    const familyControls = PLATFORM_CONTROLS.filter(c => c.family === family.id)
    return {
      id: family.id,
      name: family.name,
      totalControls: family.baseCount,
      implemented: familyControls.filter(c => c.status === 'implemented').length,
      partial: familyControls.filter(c => c.status === 'partial').length,
      planned: familyControls.filter(c => c.status === 'planned').length,
      inherited: familyControls.filter(c => c.status === 'inherited').length,
    }
  })

  const totalImplemented = controlFamilies.reduce((sum, f) =>
    sum + f.implemented + f.inherited, 0
  )
  const totalControls = controlFamilies.reduce((sum, f) => sum + f.totalControls, 0)
  const overallCompliance = Math.round((totalImplemented / totalControls) * 100)

  return {
    systemName,
    systemId,
    impactLevel,
    generatedAt: new Date().toISOString(),
    controlFamilies,
    controls: PLATFORM_CONTROLS,
    overallCompliance,
  }
}

/**
 * Get compliance summary for dashboard display.
 */
export function getComplianceSummary(): {
  totalFamilies: number
  implementedFamilies: number
  controls: number
  implemented: number
  percentage: number
} {
  const implementedFamilies = CONTROL_FAMILIES.filter(family =>
    PLATFORM_CONTROLS.some(c => c.family === family.id && c.status === 'implemented')
  ).length

  const totalControls = CONTROL_FAMILIES.reduce((sum, f) => sum + f.baseCount, 0)
  const implemented = PLATFORM_CONTROLS.filter(
    c => c.status === 'implemented' || c.status === 'inherited'
  ).length

  return {
    totalFamilies: CONTROL_FAMILIES.length,
    implementedFamilies,
    controls: totalControls,
    implemented,
    percentage: Math.round((implemented / totalControls) * 100),
  }
}

/**
 * Export SSP as OSCAL-compatible JSON.
 */
export function exportSSPAsOSCAL(ssp: SSPDocument): Record<string, unknown> {
  return {
    'system-security-plan': {
      uuid: crypto.randomUUID(),
      metadata: {
        title: `${ssp.systemName} System Security Plan`,
        'last-modified': ssp.generatedAt,
        version: '1.0',
        'oscal-version': '1.1.2',
      },
      'system-characteristics': {
        'system-id': ssp.systemId,
        'system-name': ssp.systemName,
        'security-sensitivity-level': ssp.impactLevel.toLowerCase(),
        'security-impact-level': {
          'security-objective-confidentiality': ssp.impactLevel.toLowerCase(),
          'security-objective-integrity': ssp.impactLevel.toLowerCase(),
          'security-objective-availability': ssp.impactLevel.toLowerCase(),
        },
      },
      'control-implementation': {
        description: `Security control implementations for ${ssp.systemName}`,
        'implemented-requirements': ssp.controls.map(ctrl => ({
          'control-id': ctrl.controlId.toLowerCase(),
          uuid: crypto.randomUUID(),
          description: ctrl.implementation,
          'implementation-status': { state: ctrl.status },
          'responsible-roles': [{ 'role-id': ctrl.responsibleRole.toLowerCase().replace(/\s+/g, '-') }],
        })),
      },
    },
  }
}
