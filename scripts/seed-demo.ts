/**
 * Demo Environment Seed Script
 *
 * Creates a demo company with 5 realistic GovCon opportunities at different
 * Shipley phases, sample compliance requirements, contract clauses, and
 * team assignments.
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── IDs ───────────────────────────────────────────────────
const DEMO_COMPANY_ID = randomUUID()
const DEMO_USER_ID = randomUUID()

const OPP_IDS = {
  dha: randomUUID(),
  va: randomUUID(),
  cms: randomUUID(),
  ihs: randomUUID(),
  bpa: randomUUID(),
}

// ─── Demo Data ─────────────────────────────────────────────

const DEMO_OPPORTUNITIES = [
  {
    id: OPP_IDS.dha,
    title: 'DHA Health IT Modernization IDIQ',
    agency: 'Defense Health Agency',
    description:
      'Enterprise health IT modernization across MHS GENESIS platform. Electronic health records management, interoperability, cybersecurity, and cloud migration for 9.6M beneficiaries.',
    naics_code: '541512',
    set_aside: 'Unrestricted',
    solicitation_number: 'HT0014-26-R-0042',
    due_date: '2026-05-15T17:00:00Z',
    status: 'active',
    phase: 'solution_development',
    pwin: 62,
    ceiling: 450000000,
  },
  {
    id: OPP_IDS.va,
    title: 'VA EHR Interoperability Recompete',
    agency: 'Department of Veterans Affairs',
    description:
      'Recompete for electronic health record interoperability services between VA VistA and DoD MHS GENESIS systems. Health data exchange, FHIR API development, and compliance with ONC standards.',
    naics_code: '541511',
    set_aside: null,
    solicitation_number: 'VA-ITC-26-0187',
    due_date: '2026-04-28T14:00:00Z',
    status: 'active',
    phase: 'rfp_analysis',
    pwin: 45,
    ceiling: 85000000,
  },
  {
    id: OPP_IDS.cms,
    title: 'CMS Quality Measure Analytics Platform',
    agency: 'Centers for Medicare & Medicaid Services',
    description:
      'New start for building an advanced analytics platform to calculate and report quality measures across Medicare, Medicaid, and CHIP programs. Machine learning for fraud detection and predictive modeling.',
    naics_code: '541512',
    set_aside: 'WOSB',
    solicitation_number: 'CMS-OAGM-26-0093',
    due_date: '2026-06-20T16:00:00Z',
    status: 'active',
    phase: 'capture',
    pwin: 35,
    ceiling: 120000000,
  },
  {
    id: OPP_IDS.ihs,
    title: 'IHS Telehealth Expansion – Indian Country',
    agency: 'Indian Health Service',
    description:
      'Expand telehealth capabilities across 170+ IHS, tribal, and urban Indian health programs. Broadband assessment, equipment provisioning, clinician training, and cultural competency program development.',
    naics_code: '541519',
    set_aside: 'IEE',
    solicitation_number: 'IHS-RFP-26-0034',
    due_date: '2026-07-10T17:00:00Z',
    status: 'active',
    phase: 'pre_rfp',
    pwin: 28,
    ceiling: 42000000,
  },
  {
    id: OPP_IDS.bpa,
    title: 'GSA IT Professional Services BPA',
    agency: 'General Services Administration',
    description:
      'Blanket Purchase Agreement for IT professional services including agile development, DevSecOps, cloud engineering, cybersecurity, and data analytics. Multiple award BPA with 5-year ordering period.',
    naics_code: '541512',
    set_aside: 'SBA',
    solicitation_number: 'GSA-FAS-26-BPA-0012',
    due_date: '2026-03-31T12:00:00Z',
    status: 'active',
    phase: 'proposal_writing',
    pwin: 55,
    ceiling: 980000000,
  },
]

const COMPLIANCE_REQUIREMENTS = [
  // DHA
  { opportunity_id: OPP_IDS.dha, reference: 'L.1.1', requirement_text: 'The contractor SHALL provide a cloud migration plan within 30 days of award.', section: 'Technical', priority: 'critical', status: 'addressed' },
  { opportunity_id: OPP_IDS.dha, reference: 'L.1.2', requirement_text: 'The contractor SHALL maintain FedRAMP High authorization for all cloud services.', section: 'Technical', priority: 'critical', status: 'verified' },
  { opportunity_id: OPP_IDS.dha, reference: 'L.2.1', requirement_text: 'The contractor SHALL ensure 99.99% uptime for all production systems.', section: 'Technical', priority: 'high', status: 'in_progress' },
  { opportunity_id: OPP_IDS.dha, reference: 'M.1.1', requirement_text: 'The contractor SHALL provide a quality management plan per ISO 9001.', section: 'Management', priority: 'medium', status: 'not_started' },
  // VA
  { opportunity_id: OPP_IDS.va, reference: 'C.3.1', requirement_text: 'The contractor MUST implement FHIR R4 APIs for all data exchange.', section: 'Technical', priority: 'critical', status: 'in_progress' },
  { opportunity_id: OPP_IDS.va, reference: 'C.3.2', requirement_text: 'The contractor SHALL ensure HL7 v2 backward compatibility.', section: 'Technical', priority: 'high', status: 'not_started' },
  // CMS
  { opportunity_id: OPP_IDS.cms, reference: 'PWS.2.1', requirement_text: 'The contractor SHALL develop ML models for Medicare fraud detection with >95% precision.', section: 'Technical', priority: 'critical', status: 'not_started' },
  // BPA
  { opportunity_id: OPP_IDS.bpa, reference: 'SOW.1.1', requirement_text: 'The contractor SHALL provide key personnel within 10 business days of task order award.', section: 'Management', priority: 'high', status: 'addressed' },
  { opportunity_id: OPP_IDS.bpa, reference: 'SOW.1.2', requirement_text: 'The contractor SHALL maintain SAFe Agile certification for all Scrum Masters.', section: 'Management', priority: 'medium', status: 'verified' },
]

const CONTRACT_CLAUSES = [
  { opportunity_id: OPP_IDS.dha, clause_number: 'FAR 52.204-21', clause_title: 'Basic Safeguarding of Covered Contractor Information Systems', risk_level: 'high', compliance_status: 'review_needed' },
  { opportunity_id: OPP_IDS.dha, clause_number: 'DFARS 252.204-7012', clause_title: 'Safeguarding Covered Defense Information and Cyber Incident Reporting', risk_level: 'critical', compliance_status: 'compliant' },
  { opportunity_id: OPP_IDS.va, clause_number: 'FAR 52.224-3', clause_title: 'Privacy Training', risk_level: 'medium', compliance_status: 'compliant' },
  { opportunity_id: OPP_IDS.bpa, clause_number: 'FAR 52.212-4', clause_title: 'Contract Terms and Conditions—Commercial Products', risk_level: 'low', compliance_status: 'compliant' },
]

// ─── Seed Functions ────────────────────────────────────────

async function seedCompany() {
  console.log('Creating demo company...')
  const { error } = await supabase.from('companies').upsert({
    id: DEMO_COMPANY_ID,
    name: 'MissionPulse Demo Corp',
    subscription_tier: 'professional',
    max_users: 10,
    max_opportunities: 50,
    is_active: true,
  })
  if (error) console.error('  Company error:', error.message)
  else console.log('  Done')
}

async function seedUser() {
  console.log('Creating demo user profile...')
  // Note: The auth user should be created separately via Supabase dashboard
  // or supabase.auth.admin.createUser. This seeds the profile.
  const { error } = await supabase.from('profiles').upsert({
    id: DEMO_USER_ID,
    email: 'demo@missionpulse.io',
    full_name: 'Alex Demo',
    role: 'executive',
    company_id: DEMO_COMPANY_ID,
    company: 'MissionPulse Demo Corp',
    status: 'active',
  })
  if (error) console.error('  Profile error:', error.message)
  else console.log('  Done')
}

async function seedOpportunities() {
  console.log('Creating 5 demo opportunities...')
  for (const opp of DEMO_OPPORTUNITIES) {
    const { error } = await supabase.from('opportunities').upsert({
      ...opp,
      owner_id: DEMO_USER_ID,
      company_id: DEMO_COMPANY_ID,
    })
    if (error) console.error(`  ${opp.title}: ${error.message}`)
    else console.log(`  ✓ ${opp.title} (${opp.phase})`)
  }
}

async function seedCompliance() {
  console.log('Creating compliance requirements...')
  for (const req of COMPLIANCE_REQUIREMENTS) {
    const { error } = await supabase.from('compliance_requirements').insert({
      id: randomUUID(),
      ...req,
    })
    if (error) console.error(`  ${req.reference}: ${error.message}`)
  }
  console.log(`  ✓ ${COMPLIANCE_REQUIREMENTS.length} requirements created`)
}

async function seedClauses() {
  console.log('Creating contract clauses...')
  for (const clause of CONTRACT_CLAUSES) {
    const { error } = await supabase.from('contract_clauses').insert({
      id: randomUUID(),
      ...clause,
    })
    if (error) console.error(`  ${clause.clause_number}: ${error.message}`)
  }
  console.log(`  ✓ ${CONTRACT_CLAUSES.length} clauses created`)
}

async function seedTeamAssignments() {
  console.log('Creating team assignments...')
  const roles = ['capture_manager', 'proposal_manager', 'volume_lead', 'pricing_manager']
  const oppIds = [OPP_IDS.dha, OPP_IDS.va, OPP_IDS.bpa]

  for (const oppId of oppIds) {
    for (const role of roles) {
      const { error } = await supabase.from('opportunity_assignments').insert({
        id: randomUUID(),
        opportunity_id: oppId,
        user_id: DEMO_USER_ID,
        role,
      })
      if (error && !error.message.includes('duplicate')) {
        console.error(`  Assignment error: ${error.message}`)
      }
    }
  }
  console.log('  ✓ Team assignments created')
}

// ─── Main ──────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║   MissionPulse Demo Environment Seed     ║')
  console.log('╚══════════════════════════════════════════╝\n')

  await seedCompany()
  await seedUser()
  await seedOpportunities()
  await seedCompliance()
  await seedClauses()
  await seedTeamAssignments()

  console.log('\n✓ Demo environment seeded successfully!')
  console.log('\nDemo credentials:')
  console.log('  Email: demo@missionpulse.io')
  console.log('  (Create auth user in Supabase dashboard with this email)')
  console.log(`  Company ID: ${DEMO_COMPANY_ID}`)
  console.log(`  User ID: ${DEMO_USER_ID}`)
}

main().catch(console.error)
