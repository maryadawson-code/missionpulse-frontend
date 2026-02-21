/**
 * Temporary API route to seed supporting data (v2 — fixed constraints).
 * Hit GET /api/seed while logged in to populate empty tables.
 * DELETE THIS FILE after seeding.
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, company_id')
    .eq('id', user.id)
    .single()

  const userId = user.id
  const userName = profile?.full_name ?? user.email ?? 'User'
  const companyId = profile?.company_id

  // If no company_id, create one
  let effectiveCompanyId = companyId
  if (!effectiveCompanyId) {
    const newCompanyId = randomUUID()
    const { error: compErr } = await supabase.from('companies').insert({
      id: newCompanyId,
      name: 'Mission Meets Tech',
      subscription_tier: 'professional',
      max_users: 25,
      max_opportunities: 100,
      is_active: true,
    })
    if (!compErr) {
      effectiveCompanyId = newCompanyId
      // Update profile with company_id
      await supabase.from('profiles').update({ company_id: newCompanyId }).eq('id', userId)
    }
  }

  const { data: opps } = await supabase
    .from('opportunities')
    .select('id, title, agency, phase, ceiling, owner_id')
    .order('title')

  if (!opps?.length) return NextResponse.json({ error: 'No opportunities found' }, { status: 404 })

  // Update opps to have company_id if missing
  if (effectiveCompanyId) {
    for (const opp of opps) {
      await supabase.from('opportunities').update({ company_id: effectiveCompanyId }).eq('id', opp.id)
    }
  }

  const results: Record<string, number> = {}
  const errors: string[] = []

  // ─── Compliance Requirements (section must be L/M/C/Other) ──
  const compReqs = [
    { reference: 'L.1.1', requirement: 'The contractor SHALL provide a transition plan within 30 calendar days of award.', section: 'L', priority: 'critical', status: 'Addressed', oppIdx: 0 },
    { reference: 'L.1.2', requirement: 'The contractor SHALL maintain FedRAMP High authorization for all cloud services.', section: 'L', priority: 'critical', status: 'Verified', oppIdx: 0 },
    { reference: 'L.2.1', requirement: 'The contractor SHALL ensure 99.99% uptime for all production systems.', section: 'L', priority: 'high', status: 'In Progress', oppIdx: 0 },
    { reference: 'M.1.1', requirement: 'The contractor SHALL submit a Quality Management Plan per ISO 9001:2015.', section: 'M', priority: 'medium', status: 'Not Started', oppIdx: 0 },
    { reference: 'M.2.1', requirement: 'The contractor SHALL provide monthly progress reports per CDRLs.', section: 'M', priority: 'medium', status: 'Addressed', oppIdx: 0 },
    { reference: 'C.3.1', requirement: 'The contractor MUST implement FHIR R4 APIs for all health data exchange.', section: 'C', priority: 'critical', status: 'In Progress', oppIdx: 1 },
    { reference: 'C.3.2', requirement: 'The contractor SHALL ensure HL7 v2.x backward compatibility.', section: 'C', priority: 'high', status: 'Not Started', oppIdx: 1 },
    { reference: 'C.4.1', requirement: 'The contractor SHALL comply with HIPAA Privacy and Security Rules.', section: 'C', priority: 'critical', status: 'Verified', oppIdx: 1 },
    { reference: 'C.5.1', requirement: 'Key personnel SHALL possess current CISSP or equivalent certification.', section: 'M', priority: 'high', status: 'Addressed', oppIdx: 1 },
    { reference: 'L.4.1', requirement: 'ML models SHALL achieve >95% precision for fraud detection.', section: 'L', priority: 'critical', status: 'Not Started', oppIdx: 2 },
    { reference: 'L.4.2', requirement: 'Process minimum 10M claims records per batch within 4-hour SLA.', section: 'L', priority: 'high', status: 'Not Started', oppIdx: 2 },
    { reference: 'C.6.1', requirement: 'All dashboards SHALL be Section 508 accessible and WCAG 2.1 AA.', section: 'C', priority: 'medium', status: 'Not Started', oppIdx: 2 },
    { reference: 'L.5.1', requirement: 'Conduct broadband assessments for all 170+ IHS facilities within 90 days.', section: 'L', priority: 'high', status: 'Not Started', oppIdx: 3 },
    { reference: 'L.5.2', requirement: 'Telehealth SHALL support 720p video over 5 Mbps connections.', section: 'L', priority: 'critical', status: 'Not Started', oppIdx: 3 },
    { reference: 'M.3.1', requirement: 'Develop culturally appropriate training materials for 12 tribal regions.', section: 'M', priority: 'high', status: 'Not Started', oppIdx: 3 },
    { reference: 'M.4.1', requirement: 'Provide key personnel within 10 business days of task order award.', section: 'M', priority: 'high', status: 'Addressed', oppIdx: 4 },
    { reference: 'M.4.2', requirement: 'All Scrum Masters SHALL maintain SAFe Agilist certification.', section: 'M', priority: 'medium', status: 'Verified', oppIdx: 4 },
    { reference: 'L.6.1', requirement: 'Achieve Authority to Operate (ATO) within 120 days of task order start.', section: 'L', priority: 'critical', status: 'In Progress', oppIdx: 4 },
    { reference: 'L.6.2', requirement: 'All deliverables SHALL pass automated code quality scans.', section: 'L', priority: 'high', status: 'Addressed', oppIdx: 4 },
  ]

  let compCount = 0
  for (const req of compReqs) {
    const opp = opps[req.oppIdx % opps.length]
    const { error } = await supabase.from('compliance_requirements').insert({
      id: randomUUID(), opportunity_id: opp.id, company_id: effectiveCompanyId,
      reference: req.reference, requirement: req.requirement,
      section: req.section, priority: req.priority, status: req.status,
      assigned_to: userId,
    })
    if (error) errors.push(`compliance: ${error.message}`)
    else compCount++
  }
  results['compliance_requirements'] = compCount

  // ─── Win Themes (use safe values) ────────────────────────
  // First check what values work by trying a single insert
  const themeData = [
    { theme_text: '15+ years MHS GENESIS implementation experience, reducing transition risk by 60%.', priority: 1, evaluation_factor: 'Technical Approach', ghost_competitor: 'Leidos', oppIdx: 0 },
    { theme_text: 'Proven DevSecOps pipeline with zero critical vulnerabilities across 3 DoD ATOs.', priority: 2, evaluation_factor: 'Cybersecurity', ghost_competitor: null, oppIdx: 0 },
    { theme_text: 'FHIR expertise includes 12 VistA integrations for 2.3M beneficiaries.', priority: 1, evaluation_factor: 'Technical Approach', ghost_competitor: 'Cerner/Oracle', oppIdx: 1 },
    { theme_text: 'Fixed-price ML development with performance guarantees eliminates cost overrun risk.', priority: 1, evaluation_factor: 'Cost/Price', ghost_competitor: null, oppIdx: 2 },
    { theme_text: 'Culturally competent workforce includes 8 tribal community team members.', priority: 1, evaluation_factor: 'Staffing', ghost_competitor: null, oppIdx: 3 },
    { theme_text: 'GSA Schedule pricing provides 18% savings vs market rates.', priority: 1, evaluation_factor: 'Cost/Price', ghost_competitor: 'Booz Allen', oppIdx: 4 },
  ]

  let themeCount = 0
  for (const th of themeData) {
    const opp = opps[th.oppIdx % opps.length]
    // Try without theme_type and status to avoid check constraint issues
    const { error } = await supabase.from('win_themes').insert({
      id: randomUUID(), opportunity_id: opp.id, company_id: effectiveCompanyId,
      theme_text: th.theme_text, priority: th.priority,
      evaluation_factor: th.evaluation_factor, ghost_competitor: th.ghost_competitor,
      created_by: userId,
    })
    if (error) errors.push(`theme: ${error.message}`)
    else themeCount++
  }
  results['win_themes'] = themeCount

  // ─── Discriminators ──────────────────────────────────────
  const discs = [
    { discriminator_text: 'Only vendor with 3 successful MHS GENESIS cloud migrations under current DISA STIG compliance.', vs_competitor: 'Leidos', quantified_value: '60% faster migration', evidence_source: 'Past Performance—DHA HDSP-III', oppIdx: 0 },
    { discriminator_text: 'Proprietary CI/CD pipeline achieves ATO in 45 days vs industry average of 120 days.', vs_competitor: 'All competitors', quantified_value: '75 days faster ATO', evidence_source: 'Internal metrics', oppIdx: 0 },
    { discriminator_text: 'Demonstrated FHIR R4 interoperability with 12 distinct EHR systems.', vs_competitor: 'Cerner/Oracle', quantified_value: '12 verified integrations', evidence_source: 'VA EHRM Contract', oppIdx: 1 },
    { discriminator_text: 'ML fraud detection model achieved 97.3% precision, exceeding 95% requirement.', vs_competitor: 'Palantir', quantified_value: '2.3% above threshold', evidence_source: 'CMS Innovation Pilot', oppIdx: 2 },
    { discriminator_text: 'Only bidder with ISDA Title I contracting experience across 6 IHS Areas.', vs_competitor: 'All competitors', quantified_value: '6 IHS Area contracts', evidence_source: 'CPARS ratings', oppIdx: 3 },
  ]

  let discCount = 0
  for (const d of discs) {
    const opp = opps[d.oppIdx % opps.length]
    // Skip optional type/status fields to avoid constraints
    const { error } = await supabase.from('discriminators').insert({
      id: randomUUID(), opportunity_id: opp.id,
      discriminator_text: d.discriminator_text,
      vs_competitor: d.vs_competitor,
      quantified_value: d.quantified_value, evidence_source: d.evidence_source,
    })
    if (error) errors.push(`disc: ${error.message}`)
    else discCount++
  }
  results['discriminators'] = discCount

  // ─── Key Personnel ───────────────────────────────────────
  const personnel = [
    { first_name: 'James', last_name: 'Mitchell', title: 'Program Manager', clearance_level: 'TS/SCI', clearance_status: 'active', availability_status: 'available', labor_category: 'Program Manager III', years_experience: 18, employee_type: 'FTE', skills: ['PMP', 'Agile', 'DoD Programs'], certifications: ['PMP', 'SAFe Agilist'] },
    { first_name: 'Sarah', last_name: 'Chen', title: 'Lead Systems Engineer', clearance_level: 'Secret', clearance_status: 'active', availability_status: 'available', labor_category: 'Systems Engineer IV', years_experience: 14, employee_type: 'FTE', skills: ['AWS GovCloud', 'Kubernetes'], certifications: ['AWS Solutions Architect Pro', 'CISSP'] },
    { first_name: 'Marcus', last_name: 'Thompson', title: 'Cybersecurity Lead', clearance_level: 'TS/SCI', clearance_status: 'active', availability_status: 'partial', labor_category: 'Cybersecurity Engineer III', years_experience: 12, current_project: 'DHA HDSP Maintenance', employee_type: 'FTE', skills: ['NIST 800-171', 'Zero Trust'], certifications: ['CISSP', 'CISM'] },
    { first_name: 'Elena', last_name: 'Rodriguez', title: 'Data Scientist', clearance_level: 'Secret', clearance_status: 'active', availability_status: 'available', labor_category: 'Data Scientist II', years_experience: 8, employee_type: 'FTE', skills: ['Python', 'TensorFlow'], certifications: ['AWS ML Specialty'] },
    { first_name: 'David', last_name: 'Kim', title: 'FHIR Architect', clearance_level: 'Public Trust', clearance_status: 'active', availability_status: 'available', labor_category: 'Solution Architect III', years_experience: 10, employee_type: 'FTE', skills: ['FHIR R4', 'HL7 v2'], certifications: ['HL7 FHIR Proficiency'] },
    { first_name: 'Amanda', last_name: 'Foster', title: 'Proposal Manager', clearance_level: 'Confidential', clearance_status: 'active', availability_status: 'unavailable', labor_category: 'Proposal Manager II', years_experience: 9, current_project: 'GSA BPA Response', employee_type: 'FTE', skills: ['Shipley Process'], certifications: ['APMP Practitioner'] },
    { first_name: 'Robert', last_name: 'Washington', title: 'Cloud Engineer', clearance_level: 'Secret', clearance_status: 'active', availability_status: 'available', labor_category: 'Cloud Engineer III', years_experience: 11, employee_type: 'FTE', skills: ['AWS', 'Terraform'], certifications: ['AWS DevOps Pro'] },
    { first_name: 'Lisa', last_name: 'Begay', title: 'Tribal Health Specialist', clearance_level: 'Public Trust', clearance_status: 'active', availability_status: 'available', labor_category: 'Subject Matter Expert II', years_experience: 15, employee_type: 'FTE', skills: ['IHS Programs', 'Telehealth'], certifications: ['CHC', 'PMP'] },
  ]

  let persCount = 0
  for (const p of personnel) {
    const { error } = await supabase.from('key_personnel').insert({
      id: randomUUID(), company_id: effectiveCompanyId, ...p,
    })
    if (error) errors.push(`personnel: ${error.message}`)
    else persCount++
  }
  results['key_personnel'] = persCount

  // ─── Pricing Models ──────────────────────────────────────
  const pricingModels = [
    { name: 'DHA Health IT — CPFF', contract_type: 'CPFF', status: 'draft', version: '1.0', total_price: 42500000, total_direct_labor: 28000000, base_period_months: 12, oppIdx: 0 },
    { name: 'VA EHR — T&M', contract_type: 'T&M', status: 'draft', version: '1.0', total_price: 8500000, total_direct_labor: 6200000, base_period_months: 12, oppIdx: 1 },
    { name: 'GSA BPA — FFP', contract_type: 'FFP', status: 'active', version: '2.1', total_price: 15000000, total_direct_labor: 10500000, base_period_months: 60, oppIdx: 4 },
  ]

  let pmCount = 0
  for (const pm of pricingModels) {
    const opp = opps[pm.oppIdx % opps.length]
    const { error } = await supabase.from('pricing_models').insert({
      id: randomUUID(), opportunity_id: opp.id, company_id: effectiveCompanyId,
      name: pm.name, contract_type: pm.contract_type, status: pm.status,
      version: pm.version, total_price: pm.total_price,
      total_direct_labor: pm.total_direct_labor, base_period_months: pm.base_period_months,
    })
    if (error) errors.push(`pricing_model: ${error.message}`)
    else pmCount++
  }
  results['pricing_models'] = pmCount

  // ─── Activity Log ────────────────────────────────────────
  const activities = [
    { action: 'created_opportunity', details: { description: 'Created DHA Health IT Modernization IDIQ' } },
    { action: 'updated_opportunity', details: { description: 'Updated pWin from 55% to 62%' } },
    { action: 'completed_task', details: { description: 'Completed: Gather Past Performance References' } },
    { action: 'created_opportunity', details: { description: 'Created VA EHR Interoperability Recompete' } },
    { action: 'updated_opportunity', details: { description: 'Added Sarah Chen as Lead Systems Engineer' } },
    { action: 'updated_opportunity', details: { description: 'Verified requirement L.1.2 — FedRAMP High' } },
    { action: 'updated_opportunity', details: { description: 'Approved Gate 3 Go decision for GSA IT BPA' } },
    { action: 'created_opportunity', details: { description: 'Created CMS Quality Measure Analytics Platform' } },
  ]

  let actCount = 0
  for (let i = 0; i < activities.length; i++) {
    const a = activities[i]
    const ts = new Date()
    ts.setHours(ts.getHours() - (i * 6 + Math.floor(Math.random() * 12)))
    const { error } = await supabase.from('activity_log').insert({
      id: randomUUID(), action: a.action,
      user_name: userName, user_role: profile?.role ?? 'CEO',
      details: a.details, timestamp: ts.toISOString(),
    })
    if (error) errors.push(`activity: ${error.message}`)
    else actCount++
  }
  results['activity_log'] = actCount

  const uniqueErrors = Array.from(new Set(errors))

  return NextResponse.json({
    success: true,
    user: { name: userName, company_id: effectiveCompanyId },
    opportunities: opps.length,
    inserted: results,
    errors: uniqueErrors.length > 0 ? uniqueErrors : undefined,
    note: 'Refresh browser to see data. Delete /api/seed after use.',
  })
}
