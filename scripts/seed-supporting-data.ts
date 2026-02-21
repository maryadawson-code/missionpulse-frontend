/**
 * Seed Supporting Data
 *
 * Populates all empty supporting tables (compliance_requirements, contract_clauses,
 * tasks, win_themes, discriminators, competitors, key_personnel, playbook_entries,
 * pricing_models, pricing_items, notifications, activity_log) using the EXISTING
 * opportunity IDs and user profile already in the database.
 *
 * Usage:
 *   npx tsx scripts/seed-supporting-data.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Fetch Existing Data ─────────────────────────────────────

interface Opportunity {
  id: string
  title: string
  agency: string
  phase: string | null
  ceiling: number | null
  owner_id: string | null
  company_id: string | null
}

interface Profile {
  id: string
  full_name: string | null
  role: string | null
  company_id: string | null
}

let opportunities: Opportunity[] = []
let user: Profile | null = null

async function fetchExistingData() {
  console.log('Fetching existing opportunities and user profile...')

  const { data: opps, error: oppsErr } = await supabase
    .from('opportunities')
    .select('id, title, agency, phase, ceiling, owner_id, company_id')
    .order('title')

  if (oppsErr || !opps?.length) {
    console.error('No opportunities found:', oppsErr?.message)
    process.exit(1)
  }

  opportunities = opps
  console.log(`  Found ${opportunities.length} opportunities`)
  opportunities.forEach((o) => console.log(`    - ${o.title} (${o.phase})`))

  // Get the owner of the first opportunity as our user
  const ownerId = opportunities.find((o) => o.owner_id)?.owner_id
  if (ownerId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, role, company_id')
      .eq('id', ownerId)
      .single()
    user = profile
  }

  if (!user) {
    // Fall back to any profile
    const { data: anyProfile } = await supabase
      .from('profiles')
      .select('id, full_name, role, company_id')
      .limit(1)
      .single()
    user = anyProfile
  }

  if (user) {
    console.log(`  User: ${user.full_name} (${user.role})`)
  }
}

// ─── Compliance Requirements ─────────────────────────────────

async function seedComplianceRequirements() {
  console.log('\nSeeding compliance_requirements...')

  const templates = [
    // Requirements per opportunity (3-5 per opp)
    [
      { reference: 'L.1.1', requirement: 'The contractor SHALL provide a transition plan within 30 calendar days of award.', section: 'Technical', priority: 'critical', status: 'Addressed' },
      { reference: 'L.1.2', requirement: 'The contractor SHALL maintain FedRAMP High authorization for all cloud services used in contract performance.', section: 'Technical', priority: 'critical', status: 'Verified' },
      { reference: 'L.2.1', requirement: 'The contractor SHALL ensure 99.99% uptime for all production systems during core business hours.', section: 'Technical', priority: 'high', status: 'In Progress' },
      { reference: 'M.1.1', requirement: 'The contractor SHALL submit a Quality Management Plan compliant with ISO 9001:2015 within 60 days of award.', section: 'Management', priority: 'medium', status: 'Not Started' },
      { reference: 'M.2.1', requirement: 'The contractor SHALL provide monthly progress reports per CDRLs A001-A003.', section: 'Management', priority: 'medium', status: 'Addressed' },
    ],
    [
      { reference: 'C.3.1', requirement: 'The contractor MUST implement FHIR R4 APIs for all health data exchange interfaces.', section: 'Technical', priority: 'critical', status: 'In Progress' },
      { reference: 'C.3.2', requirement: 'The contractor SHALL ensure HL7 v2.x backward compatibility for legacy system integration.', section: 'Technical', priority: 'high', status: 'Not Started' },
      { reference: 'C.4.1', requirement: 'The contractor SHALL comply with HIPAA Privacy and Security Rules for all PHI handling.', section: 'Technical', priority: 'critical', status: 'Verified' },
      { reference: 'C.5.1', requirement: 'Key personnel SHALL possess current CISSP or equivalent cybersecurity certification.', section: 'Management', priority: 'high', status: 'Addressed' },
    ],
    [
      { reference: 'PWS.2.1', requirement: 'The contractor SHALL develop ML models with documented accuracy exceeding 95% precision for fraud detection.', section: 'Technical', priority: 'critical', status: 'Not Started' },
      { reference: 'PWS.2.2', requirement: 'The contractor SHALL process a minimum of 10 million claims records per batch within 4-hour SLA.', section: 'Technical', priority: 'high', status: 'Not Started' },
      { reference: 'PWS.3.1', requirement: 'All analytics dashboards SHALL be Section 508 accessible and WCAG 2.1 AA compliant.', section: 'Technical', priority: 'medium', status: 'Not Started' },
    ],
    [
      { reference: 'SOW.4.1', requirement: 'The contractor SHALL conduct broadband availability assessments for all 170+ IHS facilities within 90 days.', section: 'Technical', priority: 'high', status: 'Not Started' },
      { reference: 'SOW.4.2', requirement: 'Telehealth platform SHALL support video consultations at minimum 720p resolution over 5 Mbps connections.', section: 'Technical', priority: 'critical', status: 'Not Started' },
      { reference: 'SOW.5.1', requirement: 'The contractor SHALL develop culturally appropriate training materials for 12 tribal regions.', section: 'Management', priority: 'high', status: 'Not Started' },
    ],
    [
      { reference: 'SOW.1.1', requirement: 'The contractor SHALL provide key personnel within 10 business days of each task order award.', section: 'Management', priority: 'high', status: 'Addressed' },
      { reference: 'SOW.1.2', requirement: 'All Scrum Masters SHALL maintain current SAFe Agilist certification throughout period of performance.', section: 'Management', priority: 'medium', status: 'Verified' },
      { reference: 'SOW.2.1', requirement: 'The contractor SHALL achieve Authority to Operate (ATO) within 120 days of task order start.', section: 'Technical', priority: 'critical', status: 'In Progress' },
      { reference: 'SOW.2.2', requirement: 'All deliverables SHALL pass automated code quality scans with zero critical findings before acceptance.', section: 'Technical', priority: 'high', status: 'Addressed' },
    ],
  ]

  let count = 0
  for (let i = 0; i < opportunities.length && i < templates.length; i++) {
    const opp = opportunities[i]
    for (const req of templates[i]) {
      const { error } = await supabase.from('compliance_requirements').insert({
        id: randomUUID(),
        opportunity_id: opp.id,
        company_id: user?.company_id,
        reference: req.reference,
        requirement: req.requirement,
        section: req.section,
        priority: req.priority,
        status: req.status,
        assigned_to: user?.id,
      })
      if (error) console.error(`  Error: ${error.message}`)
      else count++
    }
  }
  console.log(`  Inserted ${count} compliance requirements`)
}

// ─── Contract Clauses ────────────────────────────────────────

async function seedContractClauses() {
  console.log('\nSeeding contract_clauses...')

  const clausesByOpp = [
    // Opp 0
    [
      { clause_number: 'FAR 52.204-21', clause_title: 'Basic Safeguarding of Covered Contractor Information Systems', clause_type: 'FAR', risk_level: 'high', compliance_status: 'Review Needed', full_text: 'The Contractor shall apply the following basic safeguarding requirements and procedures to protect covered contractor information systems.' },
      { clause_number: 'DFARS 252.204-7012', clause_title: 'Safeguarding Covered Defense Information and Cyber Incident Reporting', clause_type: 'DFARS', risk_level: 'critical', compliance_status: 'Compliant', full_text: 'The Contractor shall implement NIST SP 800-171 security requirements for all covered defense information.' },
      { clause_number: 'FAR 52.227-14', clause_title: 'Rights in Data—General', clause_type: 'FAR', risk_level: 'medium', compliance_status: 'Review Needed', full_text: 'The Government shall have unlimited rights in data first produced in the performance of this contract.' },
    ],
    // Opp 1
    [
      { clause_number: 'FAR 52.224-3', clause_title: 'Privacy Training', clause_type: 'FAR', risk_level: 'medium', compliance_status: 'Compliant', full_text: 'The Contractor shall ensure that each contractor employee with access to PII completes annual privacy training.' },
      { clause_number: 'VAAR 852.239-70', clause_title: 'Security Requirements for Information Technology Resources', clause_type: 'VAAR', risk_level: 'high', compliance_status: 'Review Needed', full_text: 'The contractor shall comply with VA Handbook 6500 Information Security Program requirements.' },
    ],
    // Opp 2
    [
      { clause_number: 'FAR 52.232-40', clause_title: 'Providing Accelerated Payments to Small Business Subcontractors', clause_type: 'FAR', risk_level: 'low', compliance_status: 'Compliant', full_text: 'The contractor shall accelerate payments to small business subcontractors within 15 calendar days.' },
      { clause_number: 'FAR 52.219-14', clause_title: 'Limitations on Subcontracting', clause_type: 'FAR', risk_level: 'high', compliance_status: 'Review Needed', full_text: 'At least 50 percent of the cost of contract performance incurred for personnel shall be expended for employees of the concern.' },
    ],
    // Opp 3
    [
      { clause_number: 'HHSAR 352.224-71', clause_title: 'Confidential Information', clause_type: 'HHSAR', risk_level: 'high', compliance_status: 'Compliant', full_text: 'The contractor shall maintain confidentiality of all patient health information in accordance with HIPAA and IHS policies.' },
    ],
    // Opp 4
    [
      { clause_number: 'FAR 52.212-4', clause_title: 'Contract Terms and Conditions—Commercial Products and Commercial Services', clause_type: 'FAR', risk_level: 'low', compliance_status: 'Compliant', full_text: 'Standard commercial terms apply to commercial services and products procured under this BPA.' },
      { clause_number: 'GSAR 552.238-82', clause_title: 'Special Ordering Procedures for the Acquisition of Order-Level Materials', clause_type: 'GSAR', risk_level: 'medium', compliance_status: 'Review Needed', full_text: 'Order-level materials may be purchased under individual task orders when needed to support the services being performed.' },
    ],
  ]

  let count = 0
  for (let i = 0; i < opportunities.length && i < clausesByOpp.length; i++) {
    const opp = opportunities[i]
    for (const clause of clausesByOpp[i]) {
      const { error } = await supabase.from('contract_clauses').insert({
        id: randomUUID(),
        opportunity_id: opp.id,
        ...clause,
      })
      if (error) console.error(`  Error: ${error.message}`)
      else count++
    }
  }
  console.log(`  Inserted ${count} contract clauses`)
}

// ─── Tasks ───────────────────────────────────────────────────

async function seedTasks() {
  console.log('\nSeeding tasks...')

  const taskTemplates = [
    { task_title: 'Complete Technical Volume Draft', task_description: 'Write first draft of technical approach volume addressing all Section L requirements.', status: 'in_progress', priority: 'critical', task_type: 'writing', estimated_hours: 40, actual_hours: 18, oppIdx: 0 },
    { task_title: 'Finalize Compliance Matrix', task_description: 'Complete compliance matrix with all SHALL/MUST requirements mapped to proposal sections.', status: 'in_progress', priority: 'high', task_type: 'compliance', estimated_hours: 16, actual_hours: 8, oppIdx: 0 },
    { task_title: 'Review Management Volume', task_description: 'Quality review of management approach, staffing plan, and organizational chart.', status: 'pending', priority: 'high', task_type: 'review', estimated_hours: 8, actual_hours: 0, oppIdx: 0 },
    { task_title: 'Gather Past Performance References', task_description: 'Collect past performance questionnaires and verify CPARS ratings for 3 relevant contracts.', status: 'completed', priority: 'high', task_type: 'research', estimated_hours: 12, actual_hours: 10, oppIdx: 1 },
    { task_title: 'FHIR API Integration Analysis', task_description: 'Analyze FHIR R4 API requirements and document integration approach with VistA systems.', status: 'in_progress', priority: 'critical', task_type: 'technical', estimated_hours: 24, actual_hours: 12, oppIdx: 1 },
    { task_title: 'Draft Teaming Agreement', task_description: 'Prepare teaming agreement with subcontractor for cybersecurity support.', status: 'blocked', priority: 'medium', task_type: 'legal', estimated_hours: 8, actual_hours: 2, oppIdx: 2 },
    { task_title: 'Cost Model Development', task_description: 'Develop cost model with LCAT rates, wrap rates, and subcontractor costs.', status: 'pending', priority: 'high', task_type: 'pricing', estimated_hours: 20, actual_hours: 0, oppIdx: 2 },
    { task_title: 'Broadband Assessment Survey', task_description: 'Design survey instrument for IHS facility broadband availability assessment.', status: 'pending', priority: 'medium', task_type: 'research', estimated_hours: 16, actual_hours: 0, oppIdx: 3 },
    { task_title: 'Prepare Gate 3 Decision Brief', task_description: 'Compile bid/no-bid decision brief with pWin analysis, competitive landscape, and resource requirements.', status: 'completed', priority: 'critical', task_type: 'review', estimated_hours: 8, actual_hours: 6, oppIdx: 4 },
    { task_title: 'Labor Category Mapping', task_description: 'Map GSA Schedule labor categories to BPA requirements and verify current rates.', status: 'in_progress', priority: 'high', task_type: 'pricing', estimated_hours: 12, actual_hours: 4, oppIdx: 4 },
    { task_title: 'Security Clearance Verification', task_description: 'Verify all proposed key personnel have required clearance levels for their assigned roles.', status: 'completed', priority: 'critical', task_type: 'administrative', estimated_hours: 4, actual_hours: 3, oppIdx: 0 },
    { task_title: 'Draft Executive Summary', task_description: 'Write executive summary highlighting win themes, discriminators, and value proposition.', status: 'pending', priority: 'high', task_type: 'writing', estimated_hours: 8, actual_hours: 0, oppIdx: 4 },
  ]

  let count = 0
  for (const task of taskTemplates) {
    const opp = opportunities[task.oppIdx] ?? opportunities[0]
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 5)

    const { error } = await supabase.from('tasks').insert({
      id: randomUUID(),
      task_title: task.task_title,
      task_description: task.task_description,
      status: task.status,
      priority: task.priority,
      task_type: task.task_type,
      estimated_hours: task.estimated_hours,
      actual_hours: task.actual_hours,
      opportunity_id: opp.id,
      assigned_to: user?.id,
      assigned_to_name: user?.full_name ?? 'Mary Womack',
      company_id: user?.company_id,
      due_date: dueDate.toISOString(),
      completed_at: task.status === 'completed' ? new Date().toISOString() : null,
    })
    if (error) console.error(`  ${task.task_title}: ${error.message}`)
    else count++
  }
  console.log(`  Inserted ${count} tasks`)
}

// ─── Win Themes ──────────────────────────────────────────────

async function seedWinThemes() {
  console.log('\nSeeding win_themes...')

  const themes = [
    { theme_text: 'Our team brings 15+ years of MHS GENESIS implementation experience, reducing transition risk by 60% compared to new entrants.', theme_type: 'experience', priority: 1, status: 'approved', evaluation_factor: 'Technical Approach', ghost_competitor: 'Leidos', oppIdx: 0 },
    { theme_text: 'Proven DevSecOps pipeline with zero critical vulnerabilities across 3 DoD ATO certifications in the past 24 months.', theme_type: 'capability', priority: 2, status: 'approved', evaluation_factor: 'Cybersecurity', ghost_competitor: null, oppIdx: 0 },
    { theme_text: 'Our FHIR expertise includes successful integration of 12 VistA instances with MHS GENESIS, enabling seamless health data exchange for 2.3M beneficiaries.', theme_type: 'past_performance', priority: 1, status: 'draft', evaluation_factor: 'Technical Approach', ghost_competitor: 'Cerner/Oracle', oppIdx: 1 },
    { theme_text: 'We offer a fixed-price ML model development approach with performance guarantees, eliminating cost overrun risk for the Government.', theme_type: 'pricing', priority: 1, status: 'draft', evaluation_factor: 'Cost/Price', ghost_competitor: null, oppIdx: 2 },
    { theme_text: 'Our culturally competent workforce includes 8 team members from tribal communities with direct IHS facility experience.', theme_type: 'experience', priority: 1, status: 'proposed', evaluation_factor: 'Staffing', ghost_competitor: null, oppIdx: 3 },
    { theme_text: 'GSA Schedule pricing provides 18% savings versus market rates with no task order ceiling limitations.', theme_type: 'pricing', priority: 1, status: 'approved', evaluation_factor: 'Cost/Price', ghost_competitor: 'Booz Allen', oppIdx: 4 },
  ]

  let count = 0
  for (const theme of themes) {
    const opp = opportunities[theme.oppIdx] ?? opportunities[0]
    const { error } = await supabase.from('win_themes').insert({
      id: randomUUID(),
      opportunity_id: opp.id,
      company_id: user?.company_id,
      theme_text: theme.theme_text,
      theme_type: theme.theme_type,
      priority: theme.priority,
      status: theme.status,
      evaluation_factor: theme.evaluation_factor,
      ghost_competitor: theme.ghost_competitor,
      created_by: user?.id,
    })
    if (error) console.error(`  Error: ${error.message}`)
    else count++
  }
  console.log(`  Inserted ${count} win themes`)
}

// ─── Discriminators ──────────────────────────────────────────

async function seedDiscriminators() {
  console.log('\nSeeding discriminators...')

  const discs = [
    { discriminator_text: 'Only vendor with 3 successful MHS GENESIS cloud migrations under current DISA STIG compliance', discriminator_type: 'technical', status: 'validated', vs_competitor: 'Leidos', quantified_value: '60% faster migration timeline', evidence_source: 'Past Performance — DHA HDSP-III Contract', oppIdx: 0 },
    { discriminator_text: 'Proprietary CI/CD pipeline achieves ATO in 45 days vs. industry average of 120 days', discriminator_type: 'process', status: 'proposed', vs_competitor: 'All competitors', quantified_value: '75 days faster ATO', evidence_source: 'Internal metrics — last 3 ATOs', oppIdx: 0 },
    { discriminator_text: 'Demonstrated FHIR R4 interoperability with 12 distinct EHR systems including Epic, Cerner, and VistA', discriminator_type: 'technical', status: 'validated', vs_competitor: 'Cerner/Oracle', quantified_value: '12 verified integrations', evidence_source: 'VA EHRM Contract Performance', oppIdx: 1 },
    { discriminator_text: 'Our ML fraud detection model achieved 97.3% precision on CMS test dataset, exceeding the 95% requirement', discriminator_type: 'technical', status: 'draft', vs_competitor: 'Palantir', quantified_value: '2.3% above threshold', evidence_source: 'CMS Innovation Center Pilot', oppIdx: 2 },
    { discriminator_text: 'Only bidder with Indian Self-Determination Act (ISDA) Title I contracting experience across 6 IHS Areas', discriminator_type: 'experience', status: 'proposed', vs_competitor: 'All competitors', quantified_value: '6 IHS Area contracts', evidence_source: 'CPARS ratings — IHS contracts', oppIdx: 3 },
  ]

  let count = 0
  for (const disc of discs) {
    const opp = opportunities[disc.oppIdx] ?? opportunities[0]
    const { error } = await supabase.from('discriminators').insert({
      id: randomUUID(),
      opportunity_id: opp.id,
      discriminator_text: disc.discriminator_text,
      discriminator_type: disc.discriminator_type,
      status: disc.status,
      vs_competitor: disc.vs_competitor,
      quantified_value: disc.quantified_value,
      evidence_source: disc.evidence_source,
    })
    if (error) console.error(`  Error: ${error.message}`)
    else count++
  }
  console.log(`  Inserted ${count} discriminators`)
}

// ─── Competitors ─────────────────────────────────────────────

async function seedCompetitors() {
  console.log('\nSeeding competitors...')

  const competitors = [
    { name: 'Leidos', threat_level: 'high', pwin_estimate: 35, incumbent: true, strengths: ['Incumbent advantage', 'Large workforce', 'Existing ATO'], weaknesses: ['High overhead rates', 'Slow innovation', 'Staff turnover'], likely_strategy: 'Leverage incumbent knowledge and existing infrastructure to propose minimal transition risk.', counter_strategy: 'Emphasize modernization gaps in current solution and our faster cloud migration approach.', oppIdx: 0 },
    { name: 'Cerner/Oracle Health', threat_level: 'critical', pwin_estimate: 40, incumbent: true, strengths: ['MHS GENESIS platform owner', 'Deep VA relationship', 'Proprietary data formats'], weaknesses: ['Interoperability challenges', 'High license costs', 'Limited FHIR support'], likely_strategy: 'Push proprietary solutions and emphasize platform continuity.', counter_strategy: 'Highlight open standards (FHIR) advantage and vendor lock-in risks of proprietary approach.', oppIdx: 1 },
    { name: 'Palantir', threat_level: 'medium', pwin_estimate: 25, incumbent: false, strengths: ['Advanced analytics platform', 'Government clearances', 'Brand recognition'], weaknesses: ['High cost', 'Complex implementation', 'Limited healthcare domain'], likely_strategy: 'Propose Foundry platform as turnkey solution with rapid deployment.', counter_strategy: 'Demonstrate healthcare-specific ML expertise and lower total cost of ownership.', oppIdx: 2 },
    { name: 'Booz Allen Hamilton', threat_level: 'high', pwin_estimate: 30, incumbent: false, strengths: ['Large BPA portfolio', 'Strong GSA presence', 'Deep bench'], weaknesses: ['Premium pricing', 'Generalist approach', 'Subcontractor-heavy'], likely_strategy: 'Compete on breadth of capabilities and GSA Schedule pricing.', counter_strategy: 'Differentiate on specialized GovCon expertise and lower rates through efficient operations.', oppIdx: 4 },
    { name: 'SAIC', threat_level: 'medium', pwin_estimate: 20, incumbent: false, strengths: ['IT modernization experience', 'DoD relationships'], weaknesses: ['Less healthcare focus', 'Recent leadership changes'], likely_strategy: 'Emphasize IT modernization track record and agile development capabilities.', counter_strategy: 'Highlight our healthcare-specific past performance and domain expertise.', oppIdx: 0 },
  ]

  let count = 0
  for (const comp of competitors) {
    const opp = opportunities[comp.oppIdx] ?? opportunities[0]
    const { error } = await supabase.from('competitors').insert({
      id: randomUUID(),
      opportunity_id: opp.id,
      name: comp.name,
      threat_level: comp.threat_level,
      pwin_estimate: comp.pwin_estimate,
      incumbent: comp.incumbent,
      strengths: comp.strengths,
      weaknesses: comp.weaknesses,
      likely_strategy: comp.likely_strategy,
      counter_strategy: comp.counter_strategy,
    })
    if (error) console.error(`  ${comp.name}: ${error.message}`)
    else count++
  }
  console.log(`  Inserted ${count} competitors`)
}

// ─── Key Personnel ───────────────────────────────────────────

async function seedKeyPersonnel() {
  console.log('\nSeeding key_personnel...')

  const personnel = [
    { first_name: 'James', last_name: 'Mitchell', title: 'Program Manager', clearance_level: 'TS/SCI', clearance_status: 'active', availability_status: 'available', labor_category: 'Program Manager III', years_experience: 18, current_project: null, employee_type: 'FTE', skills: ['PMP', 'Agile', 'DoD Programs'], certifications: ['PMP', 'SAFe Agilist', 'ITIL v4'] },
    { first_name: 'Sarah', last_name: 'Chen', title: 'Lead Systems Engineer', clearance_level: 'Secret', clearance_status: 'active', availability_status: 'available', labor_category: 'Systems Engineer IV', years_experience: 14, current_project: null, employee_type: 'FTE', skills: ['AWS GovCloud', 'Kubernetes', 'FedRAMP'], certifications: ['AWS Solutions Architect Pro', 'CISSP', 'CEH'] },
    { first_name: 'Marcus', last_name: 'Thompson', title: 'Cybersecurity Lead', clearance_level: 'TS/SCI', clearance_status: 'active', availability_status: 'partial', labor_category: 'Cybersecurity Engineer III', years_experience: 12, current_project: 'DHA HDSP Maintenance', employee_type: 'FTE', skills: ['NIST 800-171', 'STIG Compliance', 'Zero Trust'], certifications: ['CISSP', 'CISM', 'CompTIA CASP+'] },
    { first_name: 'Elena', last_name: 'Rodriguez', title: 'Data Scientist', clearance_level: 'Secret', clearance_status: 'active', availability_status: 'available', labor_category: 'Data Scientist II', years_experience: 8, current_project: null, employee_type: 'FTE', skills: ['Python', 'TensorFlow', 'Healthcare Analytics'], certifications: ['AWS ML Specialty', 'Google Cloud ML'] },
    { first_name: 'David', last_name: 'Kim', title: 'FHIR Integration Architect', clearance_level: 'Public Trust', clearance_status: 'active', availability_status: 'available', labor_category: 'Solution Architect III', years_experience: 10, current_project: null, employee_type: 'FTE', skills: ['FHIR R4', 'HL7 v2', 'Health IT'], certifications: ['HL7 FHIR Proficiency', 'AWS Developer'] },
    { first_name: 'Amanda', last_name: 'Foster', title: 'Proposal Manager', clearance_level: 'Confidential', clearance_status: 'active', availability_status: 'unavailable', labor_category: 'Proposal Manager II', years_experience: 9, current_project: 'GSA BPA Response', employee_type: 'FTE', skills: ['Shipley Process', 'Federal Proposals', 'Technical Writing'], certifications: ['APMP Practitioner', 'PMP'] },
    { first_name: 'Robert', last_name: 'Washington', title: 'Cloud Infrastructure Engineer', clearance_level: 'Secret', clearance_status: 'active', availability_status: 'available', labor_category: 'Cloud Engineer III', years_experience: 11, current_project: null, employee_type: 'FTE', skills: ['AWS', 'Azure', 'DevSecOps', 'Terraform'], certifications: ['AWS DevOps Pro', 'Azure Solutions Architect', 'CKA'] },
    { first_name: 'Lisa', last_name: 'Begay', title: 'Tribal Health Program Specialist', clearance_level: 'Public Trust', clearance_status: 'active', availability_status: 'available', labor_category: 'Subject Matter Expert II', years_experience: 15, current_project: null, employee_type: 'FTE', skills: ['IHS Programs', 'Tribal Consultation', 'Telehealth'], certifications: ['CHC', 'PMP'] },
  ]

  let count = 0
  for (const person of personnel) {
    const { error } = await supabase.from('key_personnel').insert({
      id: randomUUID(),
      company_id: user?.company_id,
      ...person,
    })
    if (error) console.error(`  ${person.first_name} ${person.last_name}: ${error.message}`)
    else count++
  }
  console.log(`  Inserted ${count} key personnel`)
}

// ─── Pricing Models & Items ──────────────────────────────────

async function seedPricing() {
  console.log('\nSeeding pricing_models and pricing_items...')

  const models = [
    { name: 'DHA Health IT — Cost Plus Fixed Fee', contract_type: 'CPFF', status: 'draft', version: '1.0', total_price: 42500000, total_direct_labor: 28000000, base_period_months: 12, oppIdx: 0 },
    { name: 'VA EHR — Time & Materials', contract_type: 'T&M', status: 'draft', version: '1.0', total_price: 8500000, total_direct_labor: 6200000, base_period_months: 12, oppIdx: 1 },
    { name: 'GSA BPA — Fixed Price per Task Order', contract_type: 'FFP', status: 'active', version: '2.1', total_price: 15000000, total_direct_labor: 10500000, base_period_months: 60, oppIdx: 4 },
  ]

  const items = [
    { description: 'Program Manager III', clin: '0001AA', labor_category: 'Program Manager III', unit: 'hour', quantity: 2080, unit_price: 185, proposed_rate: 185, gsa_rate: 195, oppIdx: 0 },
    { description: 'Systems Engineer IV', clin: '0001AB', labor_category: 'Systems Engineer IV', unit: 'hour', quantity: 2080, unit_price: 165, proposed_rate: 165, gsa_rate: 175, oppIdx: 0 },
    { description: 'Cybersecurity Engineer III', clin: '0001AC', labor_category: 'Cybersecurity Engineer III', unit: 'hour', quantity: 2080, unit_price: 175, proposed_rate: 175, gsa_rate: 185, oppIdx: 0 },
    { description: 'Cloud Engineer III', clin: '0001AD', labor_category: 'Cloud Engineer III', unit: 'hour', quantity: 1040, unit_price: 155, proposed_rate: 155, gsa_rate: 165, oppIdx: 0 },
    { description: 'FHIR Integration Architect', clin: '0001AA', labor_category: 'Solution Architect III', unit: 'hour', quantity: 1500, unit_price: 170, proposed_rate: 170, gsa_rate: 180, oppIdx: 1 },
    { description: 'Data Scientist II', clin: '0001AB', labor_category: 'Data Scientist II', unit: 'hour', quantity: 1200, unit_price: 145, proposed_rate: 145, gsa_rate: 155, oppIdx: 1 },
    { description: 'Senior Consultant', clin: '0001AA', labor_category: 'IT Consultant III', unit: 'hour', quantity: 4160, unit_price: 160, proposed_rate: 155, gsa_rate: 168, oppIdx: 4 },
    { description: 'DevSecOps Engineer', clin: '0001AB', labor_category: 'Cloud Engineer II', unit: 'hour', quantity: 4160, unit_price: 140, proposed_rate: 135, gsa_rate: 148, oppIdx: 4 },
  ]

  let modelCount = 0
  for (const model of models) {
    const opp = opportunities[model.oppIdx] ?? opportunities[0]
    const { error } = await supabase.from('pricing_models').insert({
      id: randomUUID(),
      opportunity_id: opp.id,
      company_id: user?.company_id,
      name: model.name,
      contract_type: model.contract_type,
      status: model.status,
      version: model.version,
      total_price: model.total_price,
      total_direct_labor: model.total_direct_labor,
      base_period_months: model.base_period_months,
    })
    if (error) console.error(`  Model ${model.name}: ${error.message}`)
    else modelCount++
  }

  let itemCount = 0
  for (const item of items) {
    const opp = opportunities[item.oppIdx] ?? opportunities[0]
    const extended = (item.quantity ?? 0) * (item.proposed_rate ?? item.unit_price ?? 0)
    const { error } = await supabase.from('pricing_items').insert({
      id: randomUUID(),
      opportunity_id: opp.id,
      company_id: user?.company_id,
      description: item.description,
      clin: item.clin,
      labor_category: item.labor_category,
      unit: item.unit,
      quantity: item.quantity,
      unit_price: item.unit_price,
      proposed_rate: item.proposed_rate,
      gsa_rate: item.gsa_rate,
      extended_price: extended,
    })
    if (error) console.error(`  Item ${item.description}: ${error.message}`)
    else itemCount++
  }
  console.log(`  Inserted ${modelCount} pricing models, ${itemCount} pricing items`)
}

// ─── Playbook Entries ────────────────────────────────────────

async function seedPlaybookEntries() {
  console.log('\nSeeding playbook_entries...')

  const entries = [
    { title: 'Cloud Migration Approach — DoD/DHA', category: 'Technical Approach', user_prompt: 'Generate technical approach for DoD cloud migration', assistant_response: 'Our cloud migration methodology leverages a phased approach: Discovery, Assessment, Planning, Migration, and Optimization (DAPMO). We begin with automated workload discovery using our proprietary CloudReady assessment tool, which analyzes 200+ compatibility factors against FedRAMP High and DISA STIG requirements simultaneously.', quality_rating: 'excellent', effectiveness_score: 9, use_count: 7, keywords: { tags: ['cloud', 'migration', 'DoD', 'FedRAMP'] } },
    { title: 'Past Performance — VA EHRM Support', category: 'Past Performance', user_prompt: 'Write past performance narrative for VA EHR support contract', assistant_response: 'Under VA Contract No. 36C10X20D0042, our team delivered electronic health record modernization support services from 2022-2025. We successfully integrated FHIR R4 APIs across 12 VistA instances, enabling bidirectional health data exchange for 2.3 million veteran beneficiaries. Key achievements: 99.97% system uptime (exceeding 99.9% SLA), 45-day ATO achievement (vs. 120-day average), and zero critical security findings across 3 annual assessments.', quality_rating: 'excellent', effectiveness_score: 10, use_count: 12, keywords: { tags: ['past performance', 'VA', 'EHR', 'FHIR'] } },
    { title: 'Cybersecurity Approach — NIST 800-171', category: 'Technical Approach', user_prompt: 'Describe cybersecurity approach for NIST 800-171 compliance', assistant_response: 'Our cybersecurity framework implements all 110 NIST SP 800-171 Rev 2 security requirements through an integrated DevSecOps pipeline. We maintain continuous ATO readiness through automated STIG compliance scanning, real-time vulnerability management, and zero-trust architecture. Our approach has achieved ATO in an average of 45 days across our last 5 federal engagements.', quality_rating: 'good', effectiveness_score: 8, use_count: 5, keywords: { tags: ['cybersecurity', 'NIST', 'compliance', 'DevSecOps'] } },
    { title: 'Agile Development Methodology', category: 'Management Approach', user_prompt: 'Describe agile software development approach for federal contracts', assistant_response: 'We implement SAFe 6.0 (Scaled Agile Framework) tailored for federal acquisition environments. Our approach integrates continuous delivery with Authority to Operate (ATO) requirements through our DevSecOps pipeline. Sprint cadence: 2-week iterations with quarterly PI Planning. Each sprint delivers tested, deployable increments with full NIST 800-53 control inheritance documentation.', quality_rating: 'good', effectiveness_score: 7, use_count: 9, keywords: { tags: ['agile', 'SAFe', 'development', 'methodology'] } },
    { title: 'Healthcare Data Analytics Capabilities', category: 'Capabilities', user_prompt: 'Describe healthcare data analytics and ML capabilities', assistant_response: 'Our Healthcare Analytics Center of Excellence operates a certified analytics platform processing 50M+ claims monthly across Medicare, Medicaid, and commercial datasets. Core capabilities: predictive modeling for fraud detection (97.3% precision), population health analytics, quality measure calculation (eCQMs), and natural language processing for clinical documentation. All models are developed using explainable AI techniques with full audit trails for regulatory compliance.', quality_rating: 'excellent', effectiveness_score: 9, use_count: 3, keywords: { tags: ['analytics', 'healthcare', 'ML', 'fraud detection'] } },
  ]

  let count = 0
  for (const entry of entries) {
    const { error } = await supabase.from('playbook_entries').insert({
      id: randomUUID(),
      title: entry.title,
      category: entry.category,
      user_prompt: entry.user_prompt,
      assistant_response: entry.assistant_response,
      quality_rating: entry.quality_rating,
      effectiveness_score: entry.effectiveness_score,
      use_count: entry.use_count,
      keywords: entry.keywords,
      created_by: user?.id,
    })
    if (error) console.error(`  ${entry.title}: ${error.message}`)
    else count++
  }
  console.log(`  Inserted ${count} playbook entries`)
}

// ─── Notifications ───────────────────────────────────────────

async function seedNotifications() {
  console.log('\nSeeding notifications...')

  const notifications = [
    { title: 'Deadline Approaching', message: 'GSA BPA response is due in 38 days. Compliance matrix is 45% complete.', notification_type: 'deadline_warning', priority: 'high', link_url: '/pipeline', link_text: 'View Pipeline' },
    { title: 'Gate 3 Decision Required', message: 'CMS Quality Measure Analytics Platform requires Go/No-Go decision. Current pWin: 35%.', notification_type: 'gate_approval', priority: 'critical', link_url: '/pipeline', link_text: 'Review Opportunity' },
    { title: 'New Team Assignment', message: 'You have been assigned as Capture Manager for DHA Health IT Modernization IDIQ.', notification_type: 'assignment', priority: 'medium', link_url: '/pipeline', link_text: 'View Assignment' },
    { title: 'Compliance Gap Detected', message: '4 requirements in DHA opportunity have status "Not Started" with deadline in 22 days.', notification_type: 'compliance_alert', priority: 'high', link_url: '/compliance', link_text: 'View Iron Dome' },
    { title: 'pWin Update', message: 'VA EHR Interoperability Recompete pWin increased from 38% to 45% based on competitive analysis.', notification_type: 'pwin_change', priority: 'medium', link_url: '/pipeline', link_text: 'View Details' },
    { title: 'Welcome to MissionPulse', message: 'Your account is set up. Start by exploring your pipeline and creating your first opportunity.', notification_type: 'system', priority: 'low', link_url: '/dashboard', link_text: 'Go to Dashboard' },
  ]

  let count = 0
  for (const notif of notifications) {
    const { error } = await supabase.from('notifications').insert({
      id: randomUUID(),
      user_id: user?.id,
      company_id: user?.company_id,
      title: notif.title,
      message: notif.message,
      notification_type: notif.notification_type,
      priority: notif.priority,
      link_url: notif.link_url,
      link_text: notif.link_text,
      is_read: false,
      is_dismissed: false,
    })
    if (error) console.error(`  ${notif.title}: ${error.message}`)
    else count++
  }
  console.log(`  Inserted ${count} notifications`)
}

// ─── Activity Log ────────────────────────────────────────────

async function seedActivityLog() {
  console.log('\nSeeding activity_log...')

  const activities = [
    { action: 'created_opportunity', user_name: user?.full_name ?? 'Mary Womack', user_role: user?.role ?? 'CEO', details: { entity_type: 'opportunity', description: 'Created DHA Health IT Modernization IDIQ' } },
    { action: 'updated_pwin', user_name: user?.full_name ?? 'Mary Womack', user_role: user?.role ?? 'CEO', details: { entity_type: 'opportunity', description: 'Updated pWin from 55% to 62%' } },
    { action: 'completed_task', user_name: user?.full_name ?? 'Mary Womack', user_role: user?.role ?? 'CEO', details: { entity_type: 'task', description: 'Completed: Gather Past Performance References' } },
    { action: 'created_opportunity', user_name: user?.full_name ?? 'Mary Womack', user_role: user?.role ?? 'CEO', details: { entity_type: 'opportunity', description: 'Created VA EHR Interoperability Recompete' } },
    { action: 'added_team_member', user_name: user?.full_name ?? 'Mary Womack', user_role: user?.role ?? 'CEO', details: { entity_type: 'team', description: 'Added Sarah Chen as Lead Systems Engineer' } },
    { action: 'updated_compliance', user_name: user?.full_name ?? 'Mary Womack', user_role: user?.role ?? 'CEO', details: { entity_type: 'compliance', description: 'Verified requirement L.1.2 — FedRAMP High authorization' } },
    { action: 'created_opportunity', user_name: user?.full_name ?? 'Mary Womack', user_role: user?.role ?? 'CEO', details: { entity_type: 'opportunity', description: 'Created CMS Quality Measure Analytics Platform' } },
    { action: 'gate_decision', user_name: user?.full_name ?? 'Mary Womack', user_role: user?.role ?? 'CEO', details: { entity_type: 'gate', description: 'Approved Gate 3 Go decision for GSA IT BPA' } },
  ]

  let count = 0
  for (let i = 0; i < activities.length; i++) {
    const act = activities[i]
    const ts = new Date()
    ts.setHours(ts.getHours() - (i * 6 + Math.floor(Math.random() * 12)))

    const { error } = await supabase.from('activity_log').insert({
      id: randomUUID(),
      action: act.action,
      user_name: act.user_name,
      user_role: act.user_role,
      details: act.details,
      timestamp: ts.toISOString(),
    })
    if (error) console.error(`  ${act.action}: ${error.message}`)
    else count++
  }
  console.log(`  Inserted ${count} activity log entries`)
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║   MissionPulse — Seed Supporting Data        ║')
  console.log('╚══════════════════════════════════════════════╝\n')

  await fetchExistingData()

  await seedComplianceRequirements()
  await seedContractClauses()
  await seedTasks()
  await seedWinThemes()
  await seedDiscriminators()
  await seedCompetitors()
  await seedKeyPersonnel()
  await seedPricing()
  await seedPlaybookEntries()
  await seedNotifications()
  await seedActivityLog()

  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║   Seeding complete!                          ║')
  console.log('╠══════════════════════════════════════════════╣')
  console.log('║  Compliance Requirements: ~20                ║')
  console.log('║  Contract Clauses:        ~11                ║')
  console.log('║  Tasks:                   12                 ║')
  console.log('║  Win Themes:              6                  ║')
  console.log('║  Discriminators:          5                  ║')
  console.log('║  Competitors:             5                  ║')
  console.log('║  Key Personnel:           8                  ║')
  console.log('║  Pricing Models:          3                  ║')
  console.log('║  Pricing Items:           8                  ║')
  console.log('║  Playbook Entries:        5                  ║')
  console.log('║  Notifications:           6                  ║')
  console.log('║  Activity Log:            8                  ║')
  console.log('╠══════════════════════════════════════════════╣')
  console.log('║  Refresh your browser to see the data!       ║')
  console.log('╚══════════════════════════════════════════════╝')
}

main().catch(console.error)
