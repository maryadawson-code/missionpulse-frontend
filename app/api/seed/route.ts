/**
 * Temporary API route to seed supporting data.
 * Hit GET /api/seed while logged in as CEO/admin to populate all empty tables.
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
  const userRole = profile?.role ?? 'CEO'
  const companyId = profile?.company_id

  // Fetch existing opportunities
  const { data: opps } = await supabase
    .from('opportunities')
    .select('id, title, agency, phase, ceiling, owner_id')
    .order('title')

  if (!opps?.length) return NextResponse.json({ error: 'No opportunities found' }, { status: 404 })

  const results: Record<string, number> = {}
  let errors: string[] = []

  // ─── Compliance Requirements ─────────────────────────────
  const compReqs = [
    { reference: 'L.1.1', requirement: 'The contractor SHALL provide a transition plan within 30 calendar days of award.', section: 'Technical', priority: 'critical', status: 'Addressed', oppIdx: 0 },
    { reference: 'L.1.2', requirement: 'The contractor SHALL maintain FedRAMP High authorization for all cloud services.', section: 'Technical', priority: 'critical', status: 'Verified', oppIdx: 0 },
    { reference: 'L.2.1', requirement: 'The contractor SHALL ensure 99.99% uptime for all production systems.', section: 'Technical', priority: 'high', status: 'In Progress', oppIdx: 0 },
    { reference: 'M.1.1', requirement: 'The contractor SHALL submit a Quality Management Plan per ISO 9001:2015.', section: 'Management', priority: 'medium', status: 'Not Started', oppIdx: 0 },
    { reference: 'M.2.1', requirement: 'The contractor SHALL provide monthly progress reports per CDRLs.', section: 'Management', priority: 'medium', status: 'Addressed', oppIdx: 0 },
    { reference: 'C.3.1', requirement: 'The contractor MUST implement FHIR R4 APIs for all health data exchange.', section: 'Technical', priority: 'critical', status: 'In Progress', oppIdx: 1 },
    { reference: 'C.3.2', requirement: 'The contractor SHALL ensure HL7 v2.x backward compatibility.', section: 'Technical', priority: 'high', status: 'Not Started', oppIdx: 1 },
    { reference: 'C.4.1', requirement: 'The contractor SHALL comply with HIPAA Privacy and Security Rules.', section: 'Technical', priority: 'critical', status: 'Verified', oppIdx: 1 },
    { reference: 'C.5.1', requirement: 'Key personnel SHALL possess current CISSP or equivalent certification.', section: 'Management', priority: 'high', status: 'Addressed', oppIdx: 1 },
    { reference: 'PWS.2.1', requirement: 'ML models SHALL achieve >95% precision for fraud detection.', section: 'Technical', priority: 'critical', status: 'Not Started', oppIdx: 2 },
    { reference: 'PWS.2.2', requirement: 'Process minimum 10M claims records per batch within 4-hour SLA.', section: 'Technical', priority: 'high', status: 'Not Started', oppIdx: 2 },
    { reference: 'PWS.3.1', requirement: 'All dashboards SHALL be Section 508 accessible and WCAG 2.1 AA.', section: 'Technical', priority: 'medium', status: 'Not Started', oppIdx: 2 },
    { reference: 'SOW.4.1', requirement: 'Conduct broadband assessments for all 170+ IHS facilities within 90 days.', section: 'Technical', priority: 'high', status: 'Not Started', oppIdx: 3 },
    { reference: 'SOW.4.2', requirement: 'Telehealth SHALL support 720p video over 5 Mbps connections.', section: 'Technical', priority: 'critical', status: 'Not Started', oppIdx: 3 },
    { reference: 'SOW.5.1', requirement: 'Develop culturally appropriate training materials for 12 tribal regions.', section: 'Management', priority: 'high', status: 'Not Started', oppIdx: 3 },
    { reference: 'SOW.1.1', requirement: 'Provide key personnel within 10 business days of task order award.', section: 'Management', priority: 'high', status: 'Addressed', oppIdx: 4 },
    { reference: 'SOW.1.2', requirement: 'All Scrum Masters SHALL maintain SAFe Agilist certification.', section: 'Management', priority: 'medium', status: 'Verified', oppIdx: 4 },
    { reference: 'SOW.2.1', requirement: 'Achieve Authority to Operate (ATO) within 120 days of task order start.', section: 'Technical', priority: 'critical', status: 'In Progress', oppIdx: 4 },
    { reference: 'SOW.2.2', requirement: 'All deliverables SHALL pass automated code quality scans.', section: 'Technical', priority: 'high', status: 'Addressed', oppIdx: 4 },
  ]

  let compCount = 0
  for (const req of compReqs) {
    const opp = opps[req.oppIdx % opps.length]
    const { error } = await supabase.from('compliance_requirements').insert({
      id: randomUUID(), opportunity_id: opp.id, company_id: companyId,
      reference: req.reference, requirement: req.requirement,
      section: req.section, priority: req.priority, status: req.status,
      assigned_to: userId,
    })
    if (error) errors.push(`compliance: ${error.message}`)
    else compCount++
  }
  results['compliance_requirements'] = compCount

  // ─── Contract Clauses ────────────────────────────────────
  const clauses = [
    { clause_number: 'FAR 52.204-21', clause_title: 'Basic Safeguarding of Covered Contractor Information Systems', clause_type: 'FAR', risk_level: 'high', compliance_status: 'Review Needed', oppIdx: 0 },
    { clause_number: 'DFARS 252.204-7012', clause_title: 'Safeguarding CDI and Cyber Incident Reporting', clause_type: 'DFARS', risk_level: 'critical', compliance_status: 'Compliant', oppIdx: 0 },
    { clause_number: 'FAR 52.227-14', clause_title: 'Rights in Data—General', clause_type: 'FAR', risk_level: 'medium', compliance_status: 'Review Needed', oppIdx: 0 },
    { clause_number: 'FAR 52.224-3', clause_title: 'Privacy Training', clause_type: 'FAR', risk_level: 'medium', compliance_status: 'Compliant', oppIdx: 1 },
    { clause_number: 'VAAR 852.239-70', clause_title: 'Security Requirements for IT Resources', clause_type: 'VAAR', risk_level: 'high', compliance_status: 'Review Needed', oppIdx: 1 },
    { clause_number: 'FAR 52.232-40', clause_title: 'Accelerated Payments to Small Business Subcontractors', clause_type: 'FAR', risk_level: 'low', compliance_status: 'Compliant', oppIdx: 2 },
    { clause_number: 'FAR 52.219-14', clause_title: 'Limitations on Subcontracting', clause_type: 'FAR', risk_level: 'high', compliance_status: 'Review Needed', oppIdx: 2 },
    { clause_number: 'HHSAR 352.224-71', clause_title: 'Confidential Information', clause_type: 'HHSAR', risk_level: 'high', compliance_status: 'Compliant', oppIdx: 3 },
    { clause_number: 'FAR 52.212-4', clause_title: 'Contract Terms—Commercial Products', clause_type: 'FAR', risk_level: 'low', compliance_status: 'Compliant', oppIdx: 4 },
    { clause_number: 'GSAR 552.238-82', clause_title: 'Ordering Procedures for Order-Level Materials', clause_type: 'GSAR', risk_level: 'medium', compliance_status: 'Review Needed', oppIdx: 4 },
  ]

  let clauseCount = 0
  for (const c of clauses) {
    const opp = opps[c.oppIdx % opps.length]
    const { error } = await supabase.from('contract_clauses').insert({
      id: randomUUID(), opportunity_id: opp.id,
      clause_number: c.clause_number, clause_title: c.clause_title,
      clause_type: c.clause_type, risk_level: c.risk_level,
      compliance_status: c.compliance_status,
    })
    if (error) errors.push(`clause: ${error.message}`)
    else clauseCount++
  }
  results['contract_clauses'] = clauseCount

  // ─── Tasks ───────────────────────────────────────────────
  const tasks = [
    { task_title: 'Complete Technical Volume Draft', status: 'in_progress', priority: 'critical', task_type: 'writing', estimated_hours: 40, actual_hours: 18, oppIdx: 0 },
    { task_title: 'Finalize Compliance Matrix', status: 'in_progress', priority: 'high', task_type: 'compliance', estimated_hours: 16, actual_hours: 8, oppIdx: 0 },
    { task_title: 'Review Management Volume', status: 'pending', priority: 'high', task_type: 'review', estimated_hours: 8, actual_hours: 0, oppIdx: 0 },
    { task_title: 'Gather Past Performance References', status: 'completed', priority: 'high', task_type: 'research', estimated_hours: 12, actual_hours: 10, oppIdx: 1 },
    { task_title: 'FHIR API Integration Analysis', status: 'in_progress', priority: 'critical', task_type: 'technical', estimated_hours: 24, actual_hours: 12, oppIdx: 1 },
    { task_title: 'Draft Teaming Agreement', status: 'blocked', priority: 'medium', task_type: 'legal', estimated_hours: 8, actual_hours: 2, oppIdx: 2 },
    { task_title: 'Cost Model Development', status: 'pending', priority: 'high', task_type: 'pricing', estimated_hours: 20, actual_hours: 0, oppIdx: 2 },
    { task_title: 'Broadband Assessment Survey Design', status: 'pending', priority: 'medium', task_type: 'research', estimated_hours: 16, actual_hours: 0, oppIdx: 3 },
    { task_title: 'Gate 3 Decision Brief', status: 'completed', priority: 'critical', task_type: 'review', estimated_hours: 8, actual_hours: 6, oppIdx: 4 },
    { task_title: 'Labor Category Mapping', status: 'in_progress', priority: 'high', task_type: 'pricing', estimated_hours: 12, actual_hours: 4, oppIdx: 4 },
    { task_title: 'Security Clearance Verification', status: 'completed', priority: 'critical', task_type: 'administrative', estimated_hours: 4, actual_hours: 3, oppIdx: 0 },
    { task_title: 'Draft Executive Summary', status: 'pending', priority: 'high', task_type: 'writing', estimated_hours: 8, actual_hours: 0, oppIdx: 4 },
  ]

  let taskCount = 0
  for (const t of tasks) {
    const opp = opps[t.oppIdx % opps.length]
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 5)
    const { error } = await supabase.from('tasks').insert({
      id: randomUUID(), task_title: t.task_title, status: t.status,
      priority: t.priority, task_type: t.task_type,
      estimated_hours: t.estimated_hours, actual_hours: t.actual_hours,
      opportunity_id: opp.id, assigned_to: userId,
      assigned_to_name: userName, company_id: companyId,
      due_date: dueDate.toISOString(),
    })
    if (error) errors.push(`task: ${error.message}`)
    else taskCount++
  }
  results['tasks'] = taskCount

  // ─── Win Themes ──────────────────────────────────────────
  const themes = [
    { theme_text: '15+ years MHS GENESIS implementation experience, reducing transition risk by 60%.', theme_type: 'experience', priority: 1, status: 'approved', evaluation_factor: 'Technical Approach', ghost_competitor: 'Leidos', oppIdx: 0 },
    { theme_text: 'Proven DevSecOps pipeline with zero critical vulnerabilities across 3 DoD ATOs.', theme_type: 'capability', priority: 2, status: 'approved', evaluation_factor: 'Cybersecurity', ghost_competitor: null, oppIdx: 0 },
    { theme_text: 'FHIR expertise includes 12 VistA integrations enabling health data exchange for 2.3M beneficiaries.', theme_type: 'past_performance', priority: 1, status: 'draft', evaluation_factor: 'Technical Approach', ghost_competitor: 'Cerner/Oracle', oppIdx: 1 },
    { theme_text: 'Fixed-price ML model development with performance guarantees eliminates cost overrun risk.', theme_type: 'pricing', priority: 1, status: 'draft', evaluation_factor: 'Cost/Price', ghost_competitor: null, oppIdx: 2 },
    { theme_text: 'Culturally competent workforce includes 8 team members from tribal communities.', theme_type: 'experience', priority: 1, status: 'proposed', evaluation_factor: 'Staffing', ghost_competitor: null, oppIdx: 3 },
    { theme_text: 'GSA Schedule pricing provides 18% savings vs market rates with no ceiling limitations.', theme_type: 'pricing', priority: 1, status: 'approved', evaluation_factor: 'Cost/Price', ghost_competitor: 'Booz Allen', oppIdx: 4 },
  ]

  let themeCount = 0
  for (const th of themes) {
    const opp = opps[th.oppIdx % opps.length]
    const { error } = await supabase.from('win_themes').insert({
      id: randomUUID(), opportunity_id: opp.id, company_id: companyId,
      theme_text: th.theme_text, theme_type: th.theme_type,
      priority: th.priority, status: th.status,
      evaluation_factor: th.evaluation_factor, ghost_competitor: th.ghost_competitor,
      created_by: userId,
    })
    if (error) errors.push(`theme: ${error.message}`)
    else themeCount++
  }
  results['win_themes'] = themeCount

  // ─── Discriminators ──────────────────────────────────────
  const discs = [
    { discriminator_text: 'Only vendor with 3 successful MHS GENESIS cloud migrations under current DISA STIG compliance.', discriminator_type: 'technical', status: 'validated', vs_competitor: 'Leidos', quantified_value: '60% faster migration', evidence_source: 'Past Performance—DHA HDSP-III', oppIdx: 0 },
    { discriminator_text: 'Proprietary CI/CD pipeline achieves ATO in 45 days vs industry average of 120 days.', discriminator_type: 'process', status: 'proposed', vs_competitor: 'All competitors', quantified_value: '75 days faster ATO', evidence_source: 'Internal metrics', oppIdx: 0 },
    { discriminator_text: 'Demonstrated FHIR R4 interoperability with 12 distinct EHR systems.', discriminator_type: 'technical', status: 'validated', vs_competitor: 'Cerner/Oracle', quantified_value: '12 verified integrations', evidence_source: 'VA EHRM Contract', oppIdx: 1 },
    { discriminator_text: 'ML fraud detection model achieved 97.3% precision, exceeding 95% requirement.', discriminator_type: 'technical', status: 'draft', vs_competitor: 'Palantir', quantified_value: '2.3% above threshold', evidence_source: 'CMS Innovation Pilot', oppIdx: 2 },
    { discriminator_text: 'Only bidder with ISDA Title I contracting experience across 6 IHS Areas.', discriminator_type: 'experience', status: 'proposed', vs_competitor: 'All competitors', quantified_value: '6 IHS Area contracts', evidence_source: 'CPARS ratings', oppIdx: 3 },
  ]

  let discCount = 0
  for (const d of discs) {
    const opp = opps[d.oppIdx % opps.length]
    const { error } = await supabase.from('discriminators').insert({
      id: randomUUID(), opportunity_id: opp.id,
      discriminator_text: d.discriminator_text, discriminator_type: d.discriminator_type,
      status: d.status, vs_competitor: d.vs_competitor,
      quantified_value: d.quantified_value, evidence_source: d.evidence_source,
    })
    if (error) errors.push(`disc: ${error.message}`)
    else discCount++
  }
  results['discriminators'] = discCount

  // ─── Competitors ─────────────────────────────────────────
  const competitors = [
    { name: 'Leidos', threat_level: 'high', pwin_estimate: 35, incumbent: true, strengths: ['Incumbent advantage', 'Large workforce', 'Existing ATO'], weaknesses: ['High overhead rates', 'Slow innovation', 'Staff turnover'], likely_strategy: 'Leverage incumbent knowledge and existing infrastructure.', counter_strategy: 'Emphasize modernization gaps and faster cloud migration.', oppIdx: 0 },
    { name: 'Cerner/Oracle Health', threat_level: 'critical', pwin_estimate: 40, incumbent: true, strengths: ['MHS GENESIS platform owner', 'Deep VA relationship'], weaknesses: ['Interoperability challenges', 'High license costs'], likely_strategy: 'Push proprietary solutions and platform continuity.', counter_strategy: 'Highlight open standards (FHIR) and vendor lock-in risks.', oppIdx: 1 },
    { name: 'Palantir', threat_level: 'medium', pwin_estimate: 25, incumbent: false, strengths: ['Advanced analytics platform', 'Government clearances'], weaknesses: ['High cost', 'Limited healthcare domain'], likely_strategy: 'Propose Foundry as turnkey solution.', counter_strategy: 'Demonstrate healthcare-specific ML expertise and lower TCO.', oppIdx: 2 },
    { name: 'Booz Allen Hamilton', threat_level: 'high', pwin_estimate: 30, incumbent: false, strengths: ['Large BPA portfolio', 'Strong GSA presence'], weaknesses: ['Premium pricing', 'Subcontractor-heavy'], likely_strategy: 'Compete on breadth and GSA Schedule pricing.', counter_strategy: 'Differentiate on specialized expertise and lower rates.', oppIdx: 4 },
    { name: 'SAIC', threat_level: 'medium', pwin_estimate: 20, incumbent: false, strengths: ['IT modernization experience', 'DoD relationships'], weaknesses: ['Less healthcare focus', 'Recent leadership changes'], likely_strategy: 'Emphasize IT modernization track record.', counter_strategy: 'Highlight healthcare-specific past performance.', oppIdx: 0 },
  ]

  let compCount2 = 0
  for (const comp of competitors) {
    const opp = opps[comp.oppIdx % opps.length]
    const { error } = await supabase.from('competitors').insert({
      id: randomUUID(), opportunity_id: opp.id,
      name: comp.name, threat_level: comp.threat_level,
      pwin_estimate: comp.pwin_estimate, incumbent: comp.incumbent,
      strengths: comp.strengths, weaknesses: comp.weaknesses,
      likely_strategy: comp.likely_strategy, counter_strategy: comp.counter_strategy,
    })
    if (error) errors.push(`competitor: ${error.message}`)
    else compCount2++
  }
  results['competitors'] = compCount2

  // ─── Key Personnel ───────────────────────────────────────
  const personnel = [
    { first_name: 'James', last_name: 'Mitchell', title: 'Program Manager', clearance_level: 'TS/SCI', clearance_status: 'active', availability_status: 'available', labor_category: 'Program Manager III', years_experience: 18, current_project: null, employee_type: 'FTE', skills: ['PMP', 'Agile', 'DoD Programs'], certifications: ['PMP', 'SAFe Agilist', 'ITIL v4'] },
    { first_name: 'Sarah', last_name: 'Chen', title: 'Lead Systems Engineer', clearance_level: 'Secret', clearance_status: 'active', availability_status: 'available', labor_category: 'Systems Engineer IV', years_experience: 14, current_project: null, employee_type: 'FTE', skills: ['AWS GovCloud', 'Kubernetes', 'FedRAMP'], certifications: ['AWS Solutions Architect Pro', 'CISSP'] },
    { first_name: 'Marcus', last_name: 'Thompson', title: 'Cybersecurity Lead', clearance_level: 'TS/SCI', clearance_status: 'active', availability_status: 'partial', labor_category: 'Cybersecurity Engineer III', years_experience: 12, current_project: 'DHA HDSP Maintenance', employee_type: 'FTE', skills: ['NIST 800-171', 'STIG Compliance', 'Zero Trust'], certifications: ['CISSP', 'CISM'] },
    { first_name: 'Elena', last_name: 'Rodriguez', title: 'Data Scientist', clearance_level: 'Secret', clearance_status: 'active', availability_status: 'available', labor_category: 'Data Scientist II', years_experience: 8, current_project: null, employee_type: 'FTE', skills: ['Python', 'TensorFlow', 'Healthcare Analytics'], certifications: ['AWS ML Specialty'] },
    { first_name: 'David', last_name: 'Kim', title: 'FHIR Integration Architect', clearance_level: 'Public Trust', clearance_status: 'active', availability_status: 'available', labor_category: 'Solution Architect III', years_experience: 10, current_project: null, employee_type: 'FTE', skills: ['FHIR R4', 'HL7 v2', 'Health IT'], certifications: ['HL7 FHIR Proficiency'] },
    { first_name: 'Amanda', last_name: 'Foster', title: 'Proposal Manager', clearance_level: 'Confidential', clearance_status: 'active', availability_status: 'unavailable', labor_category: 'Proposal Manager II', years_experience: 9, current_project: 'GSA BPA Response', employee_type: 'FTE', skills: ['Shipley Process', 'Federal Proposals'], certifications: ['APMP Practitioner', 'PMP'] },
    { first_name: 'Robert', last_name: 'Washington', title: 'Cloud Infrastructure Engineer', clearance_level: 'Secret', clearance_status: 'active', availability_status: 'available', labor_category: 'Cloud Engineer III', years_experience: 11, current_project: null, employee_type: 'FTE', skills: ['AWS', 'Azure', 'DevSecOps', 'Terraform'], certifications: ['AWS DevOps Pro', 'CKA'] },
    { first_name: 'Lisa', last_name: 'Begay', title: 'Tribal Health Specialist', clearance_level: 'Public Trust', clearance_status: 'active', availability_status: 'available', labor_category: 'Subject Matter Expert II', years_experience: 15, current_project: null, employee_type: 'FTE', skills: ['IHS Programs', 'Tribal Consultation', 'Telehealth'], certifications: ['CHC', 'PMP'] },
  ]

  let persCount = 0
  for (const p of personnel) {
    const { error } = await supabase.from('key_personnel').insert({
      id: randomUUID(), company_id: companyId, ...p,
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
      id: randomUUID(), opportunity_id: opp.id, company_id: companyId,
      name: pm.name, contract_type: pm.contract_type, status: pm.status,
      version: pm.version, total_price: pm.total_price,
      total_direct_labor: pm.total_direct_labor, base_period_months: pm.base_period_months,
    })
    if (error) errors.push(`pricing_model: ${error.message}`)
    else pmCount++
  }
  results['pricing_models'] = pmCount

  // ─── Pricing Items ───────────────────────────────────────
  const pricingItems = [
    { description: 'Program Manager III', clin: '0001AA', labor_category: 'Program Manager III', unit: 'hour', quantity: 2080, unit_price: 185, proposed_rate: 185, gsa_rate: 195, oppIdx: 0 },
    { description: 'Systems Engineer IV', clin: '0001AB', labor_category: 'Systems Engineer IV', unit: 'hour', quantity: 2080, unit_price: 165, proposed_rate: 165, gsa_rate: 175, oppIdx: 0 },
    { description: 'Cybersecurity Engineer III', clin: '0001AC', labor_category: 'Cybersecurity Engineer III', unit: 'hour', quantity: 2080, unit_price: 175, proposed_rate: 175, gsa_rate: 185, oppIdx: 0 },
    { description: 'FHIR Integration Architect', clin: '0001AA', labor_category: 'Solution Architect III', unit: 'hour', quantity: 1500, unit_price: 170, proposed_rate: 170, gsa_rate: 180, oppIdx: 1 },
    { description: 'Data Scientist II', clin: '0001AB', labor_category: 'Data Scientist II', unit: 'hour', quantity: 1200, unit_price: 145, proposed_rate: 145, gsa_rate: 155, oppIdx: 1 },
    { description: 'Senior IT Consultant', clin: '0001AA', labor_category: 'IT Consultant III', unit: 'hour', quantity: 4160, unit_price: 160, proposed_rate: 155, gsa_rate: 168, oppIdx: 4 },
    { description: 'DevSecOps Engineer', clin: '0001AB', labor_category: 'Cloud Engineer II', unit: 'hour', quantity: 4160, unit_price: 140, proposed_rate: 135, gsa_rate: 148, oppIdx: 4 },
  ]

  let piCount = 0
  for (const pi of pricingItems) {
    const opp = opps[pi.oppIdx % opps.length]
    const extended = pi.quantity * pi.proposed_rate
    const { error } = await supabase.from('pricing_items').insert({
      id: randomUUID(), opportunity_id: opp.id, company_id: companyId,
      description: pi.description, clin: pi.clin,
      labor_category: pi.labor_category, unit: pi.unit,
      quantity: pi.quantity, unit_price: pi.unit_price,
      proposed_rate: pi.proposed_rate, gsa_rate: pi.gsa_rate,
      extended_price: extended,
    })
    if (error) errors.push(`pricing_item: ${error.message}`)
    else piCount++
  }
  results['pricing_items'] = piCount

  // ─── Playbook Entries ────────────────────────────────────
  const playbook = [
    { title: 'Cloud Migration Approach — DoD/DHA', category: 'Technical Approach', user_prompt: 'Generate technical approach for DoD cloud migration', assistant_response: 'Our cloud migration methodology leverages a phased DAPMO approach: Discovery, Assessment, Planning, Migration, and Optimization. We begin with automated workload discovery using our CloudReady assessment tool, analyzing 200+ compatibility factors against FedRAMP High and DISA STIG requirements.', quality_rating: 'excellent', effectiveness_score: 9, use_count: 7 },
    { title: 'Past Performance — VA EHRM Support', category: 'Past Performance', user_prompt: 'Write past performance narrative for VA EHR support', assistant_response: 'Under VA Contract No. 36C10X20D0042, our team delivered EHR modernization support from 2022-2025. Successfully integrated FHIR R4 APIs across 12 VistA instances, enabling bidirectional health data exchange for 2.3M veteran beneficiaries. Achieved 99.97% uptime (exceeding 99.9% SLA) and 45-day ATO.', quality_rating: 'excellent', effectiveness_score: 10, use_count: 12 },
    { title: 'Cybersecurity — NIST 800-171', category: 'Technical Approach', user_prompt: 'Describe cybersecurity approach for NIST compliance', assistant_response: 'Our cybersecurity framework implements all 110 NIST SP 800-171 Rev 2 security requirements through an integrated DevSecOps pipeline. We maintain continuous ATO readiness through automated STIG scanning, real-time vulnerability management, and zero-trust architecture.', quality_rating: 'good', effectiveness_score: 8, use_count: 5 },
    { title: 'Agile Development Methodology', category: 'Management Approach', user_prompt: 'Describe agile development approach for federal contracts', assistant_response: 'We implement SAFe 6.0 tailored for federal acquisition. Our approach integrates continuous delivery with ATO requirements through DevSecOps. Sprint cadence: 2-week iterations with quarterly PI Planning. Each sprint delivers tested, deployable increments with full NIST 800-53 control inheritance.', quality_rating: 'good', effectiveness_score: 7, use_count: 9 },
    { title: 'Healthcare Analytics Capabilities', category: 'Capabilities', user_prompt: 'Describe healthcare data analytics and ML capabilities', assistant_response: 'Our Healthcare Analytics CoE operates a certified platform processing 50M+ claims monthly. Core capabilities: predictive fraud detection (97.3% precision), population health analytics, quality measure calculation (eCQMs), and NLP for clinical documentation. All models use explainable AI with full audit trails.', quality_rating: 'excellent', effectiveness_score: 9, use_count: 3 },
  ]

  let pbCount = 0
  for (const pb of playbook) {
    const { error } = await supabase.from('playbook_entries').insert({
      id: randomUUID(), title: pb.title, category: pb.category,
      user_prompt: pb.user_prompt, assistant_response: pb.assistant_response,
      quality_rating: pb.quality_rating, effectiveness_score: pb.effectiveness_score,
      use_count: pb.use_count, created_by: userId,
      keywords: { tags: pb.category.toLowerCase().split(' ') },
    })
    if (error) errors.push(`playbook: ${error.message}`)
    else pbCount++
  }
  results['playbook_entries'] = pbCount

  // ─── Notifications ───────────────────────────────────────
  const notifs = [
    { title: 'Deadline Approaching', message: 'GSA BPA response is due soon. Compliance matrix is 45% complete.', notification_type: 'deadline_warning', priority: 'high', link_url: '/pipeline', link_text: 'View Pipeline' },
    { title: 'Gate 3 Decision Required', message: 'CMS Analytics Platform requires Go/No-Go decision. pWin: 35%.', notification_type: 'gate_approval', priority: 'critical', link_url: '/pipeline', link_text: 'Review Opportunity' },
    { title: 'New Team Assignment', message: 'You have been assigned as Capture Manager for DHA Health IT IDIQ.', notification_type: 'assignment', priority: 'medium', link_url: '/pipeline', link_text: 'View Assignment' },
    { title: 'Compliance Gap Detected', message: '4 requirements have status "Not Started" with deadline approaching.', notification_type: 'compliance_alert', priority: 'high', link_url: '/compliance', link_text: 'View Iron Dome' },
    { title: 'pWin Update', message: 'VA EHR pWin increased from 38% to 45% based on competitive analysis.', notification_type: 'pwin_change', priority: 'medium', link_url: '/pipeline', link_text: 'View Details' },
    { title: 'Welcome to MissionPulse', message: 'Your account is ready. Explore your pipeline and create opportunities.', notification_type: 'system', priority: 'low', link_url: '/dashboard', link_text: 'Go to Dashboard' },
  ]

  let notifCount = 0
  for (const n of notifs) {
    const { error } = await supabase.from('notifications').insert({
      id: randomUUID(), user_id: userId, company_id: companyId,
      title: n.title, message: n.message,
      notification_type: n.notification_type, priority: n.priority,
      link_url: n.link_url, link_text: n.link_text,
      is_read: false, is_dismissed: false,
    })
    if (error) errors.push(`notification: ${error.message}`)
    else notifCount++
  }
  results['notifications'] = notifCount

  // ─── Activity Log ────────────────────────────────────────
  const activities = [
    { action: 'created_opportunity', details: { entity_type: 'opportunity', description: 'Created DHA Health IT Modernization IDIQ' } },
    { action: 'updated_pwin', details: { entity_type: 'opportunity', description: 'Updated pWin from 55% to 62%' } },
    { action: 'completed_task', details: { entity_type: 'task', description: 'Completed: Gather Past Performance References' } },
    { action: 'created_opportunity', details: { entity_type: 'opportunity', description: 'Created VA EHR Interoperability Recompete' } },
    { action: 'added_team_member', details: { entity_type: 'team', description: 'Added Sarah Chen as Lead Systems Engineer' } },
    { action: 'updated_compliance', details: { entity_type: 'compliance', description: 'Verified requirement L.1.2 — FedRAMP High authorization' } },
    { action: 'gate_decision', details: { entity_type: 'gate', description: 'Approved Gate 3 Go decision for GSA IT BPA' } },
    { action: 'created_opportunity', details: { entity_type: 'opportunity', description: 'Created CMS Quality Measure Analytics Platform' } },
  ]

  let actCount = 0
  for (let i = 0; i < activities.length; i++) {
    const a = activities[i]
    const ts = new Date()
    ts.setHours(ts.getHours() - (i * 6 + Math.floor(Math.random() * 12)))
    const { error } = await supabase.from('activity_log').insert({
      id: randomUUID(), action: a.action,
      user_name: userName, user_role: userRole,
      details: a.details, timestamp: ts.toISOString(),
    })
    if (error) errors.push(`activity: ${error.message}`)
    else actCount++
  }
  results['activity_log'] = actCount

  // Deduplicate errors
  const uniqueErrors = Array.from(new Set(errors))

  return NextResponse.json({
    success: true,
    user: { name: userName, role: userRole },
    opportunities: opps.length,
    inserted: results,
    errors: uniqueErrors.length > 0 ? uniqueErrors : undefined,
    message: 'Refresh your browser to see the data! Delete app/api/seed/route.ts when done.',
  })
}
