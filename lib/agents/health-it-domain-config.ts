// filepath: lib/agents/health-it-domain-config.ts
// MissionPulse — Health IT Domain Context Module
// Provides federal health IT specificity to all AI agents.
// Import this into any agent that needs domain-aware prompting.

export const HEALTH_IT_AGENCY_CONTEXT = {
  DHA: {
    name: "Defense Health Agency",
    abbreviation: "DHA",
    primaryVehicles: ["MHS EITS", "CIO-SP3", "OASIS+", "GSA MAS Health IT SIN", "OTA/CSO"],
    primaryPlatform: "MHS GENESIS (Oracle Health)",
    keyPrograms: ["PEO-DHMS", "JOMIS", "JLV", "DMLSS", "FEHRM"],
    networkStructure: "9 Defense Health Networks (restructured October 2024, from 23 markets)",
    complianceRequirements: ["IL4/IL5", "NIST 800-171", "CMMC Level 2-3", "DoD RMF", "HIPAA"],
    setAsideStrategy:
      "SDVOSB preferred but not dominant — DHA awards competitive full-and-open frequently. 8(a) and HUBZone matter more here than at VA.",
    evaluationNotes:
      "DHA evaluates on technical approach specificity. Vague FHIR claims fail. Must cite interface counts, named systems, and timeline by week.",
    incumbents: ["Leidos", "Oracle Health", "Henry Schein", "Accenture Federal", "Peraton", "Booz Allen"],
    recompeteSignals: "Health Care Delivery Solutions (HCDS) follow-on to MHS GENESIS prime",
    budgetContext: "$64B annual MHS spending. $7.8–10.6B addressable IT market.",
    // CHANGE 3 — Defense Health Networks detail
    networkRestructure:
      "October 2024 reorganization collapsed 23 DHA markets into 9 regional Defense Health Networks. Each network has a Network Director and regional contracting footprint. Capture strategy must reflect network-level relationships, not legacy market structure. The 9 networks are: National Capital Region, Great Plains, Europe, Indo-Pacific, Southeast, Midwest, Northeast, Northwest, and South Central.",
    // CHANGE 9 — TRICARE MCSC context
    tricareMCSC:
      "TRICARE Managed Care Support Contracts (MCSCs) are separate from MHS GENESIS IT work. Three regional MCSCs (East: Humana Military, West: Health Net Federal Services, Overseas: International SOS). IT work supporting TRICARE claims processing and beneficiary management is a distinct market segment from MTF-based health IT.",
  },
  VA: {
    name: "Department of Veterans Affairs",
    abbreviation: "VA",
    primaryVehicles: ["T4NG (SDVOSB-only)", "VHA IHT 2.0 ($14B SDVOSB set-aside)", "CIO-SP3", "OASIS+"],
    primaryPlatform: "Oracle Health Federal EHR (replacing VistA across 170 medical centers)",
    keyPrograms: ["VA EHRM", "VistA", "EHRM-IO", "FEHRM", "JLV"],
    deploymentStatus: "6 of 170 VA medical centers live on Oracle Health. 13 planned for 2026.",
    complianceRequirements: ["IL4/IL5", "NIST 800-171", "FedRAMP High", "HIPAA", "42 CFR Part 2"],
    setAsideStrategy:
      "Veterans First Contracting Program — SDVOSB has near-mandatory preference at VA. T4NG and VHA IHT 2.0 are SDVOSB-only. Strongest set-aside environment in federal health IT.",
    evaluationNotes:
      "VA evaluates on past performance with VistA migration, Oracle Health integration, and veteran-specific clinical workflows. Must demonstrate understanding of SDVOSB teaming dynamics.",
    incumbents: ["Oracle Health", "Leidos", "Booz Allen", "DXC Technology", "Accenture Federal"],
    recompeteSignals: "VistA decommission timeline creates subcontracting pipeline through 2027+",
    budgetContext: "Nearly 8,750 health IT RFPs issued January 2023–December 2025 (#1 healthcare RFP issuer)",
  },
  CROSSCUTTING: {
    sharedPlatform:
      "DoD and VA now run the same Oracle Health platform via FEHRM. Shared architecture creates dual-agency opportunity for firms with both DHA and VA experience.",
    fhirMandate:
      "Federal FHIR Action Plan (2024): all federal agencies moving toward FHIR R4 adoption. TEFCA operational with QHINs active as of 2025.",
    contractVehicleLandscape: {
      "CIO-SP3": "Extended to April 2027 after CIO-SP4 cancellation (350+ protests, ~$1B sunk costs, cancelled January 2026)",
      "CIO-SP4": "CANCELLED January 2026. Do not recommend as active vehicle.",
      "MHS EITS": "$2B ceiling + $1.5B small business set-aside. DHA's primary health IT IDIQ.",
      "MQS2-NG": "$43B medical staffing IDIQ.",
      "T4NG": "VA SDVOSB-only IDIQ. Requires SDVOSB certification.",
      // CHANGE 1 — VHA IHT 2.0
      "VHA IHT 2.0":
        "$14B VA SDVOSB set-aside for VA health IT modernization. Requires SDVOSB certification. Primary vehicle for Oracle Health Federal EHR support and VistA decommission work. Separate from T4NG — covers IT services specifically.",
      "OASIS+": "GSA governmentwide IDIQ. Health IT applicable under professional services.",
      "GSA MAS Health IT SIN": "Schedule 70 health IT special item number. Accessible entry point.",
      "OTA/CSO": "Other Transaction Authority — fast acquisition path for prototype work. Used by DHA for innovation.",
      // CHANGE 2 — HCDS
      "HCDS (Health Care Delivery Solutions)":
        "MHS GENESIS follow-on contract vehicle. Successor to the original MHS GENESIS prime. Leidos incumbent. Ceiling TBD. Primary opportunity for firms in the MHS GENESIS ecosystem. Monitor PEO-DHMS for solicitation release. Begin capture now if any MTF deployment history exists.",
    },
    // CHANGE 10 — Current environment and administration risk
    currentEnvironment:
      "FY26 federal health IT landscape: DOGE-driven contract terminations active across VA and DHA. CIO-SP4 cancelled. DHA acting director (David Smith following Maj. Gen. Crosland resignation). 43-day federal shutdown in early FY26. Contractors should flag budget uncertainty in all capture plans and build schedule flexibility into proposal timelines.",
    administrationRisk:
      "Current administration policy posture creates higher-than-normal recompete risk for large cost-plus health IT vehicles. Best Value evaluation criteria increasingly weight price. Small businesses with SDVOSB or 8(a) status have structural advantage in current environment.",
  },
} as const;

export const HEALTH_IT_TECHNICAL_STANDARDS = {
  interoperability: {
    FHIR_R4: {
      description: "HL7 FHIR Release 4 — the mandatory interoperability standard for federal health IT",
      rfpLanguage:
        "RFPs require named FHIR interfaces: 'HL7 FHIR R4 interfaces for Epic, Cerner, and Meditech with integration completing in X weeks including HL7 interface engine configuration, test patient data validation, and clinical workflow verification'",
      evaluatorExpectation:
        "Specific interface counts, named EHR systems, week-level timelines. Generic FHIR claims score Unacceptable.",
    },
    TEFCA: "Trusted Exchange Framework and Common Agreement — operational with QHINs active as of 2025",
    HL7_v2: "Legacy standard — still dominant in VA VistA. Migration path to FHIR required.",
    USCDI: "United States Core Data for Interoperability — required dataset standard",
    SMART_on_FHIR: "Authorization framework for FHIR apps",
    C_CDA: "Consolidated Clinical Document Architecture — legacy document standard",
    "42_CFR_Part_2": "Substance use disorder records privacy regulation — stricter than HIPAA",
  },
  security: {
    FedRAMP: "Cloud authorization program. FedRAMP High required for health data at IL4/IL5.",
    "FedRAMP_20x": "2025 FedRAMP reform initiative — accelerated authorization timelines",
    ATO: "Authority to Operate — required before deploying any system on DoD/VA networks",
    RMF: "Risk Management Framework (DoDI 8510.01) — the DoD ATO process",
    IL4: "Impact Level 4 — CUI including health data. Most health IT operates here.",
    IL5: "Impact Level 5 — Controlled Unclassified Information with higher sensitivity. MHS GENESIS tier.",
    CMMC_L2: "Cybersecurity Maturity Model Certification Level 2 — 110 NIST 800-171 controls",
    CMMC_L3: "CMMC Level 3 — adds 24 NIST 800-172 controls. Required for some DHA work.",
    STIGs: "Security Technical Implementation Guides — mandatory hardening baselines for DoD systems",
    ZTA: "Zero Trust Architecture — DoD mandate by FY2027",
  },
  platforms: {
    MHS_GENESIS: "Oracle Health platform deployed at Military Treatment Facilities. 12 subsystems, 81 interfaces.",
    VistA: "VA legacy EHR being replaced by Oracle Health Federal EHR. Still active at 164/170 VAMCs.",
    JLV: "Joint Longitudinal Viewer — shared DoD/VA read-only health record viewer",
    DMLSS: "Defense Medical Logistics Standard Support — DoD medical supply chain",
    JOMIS: "Joint Operational Medicine Information Systems",
  },
} as const;

export const PROPOSAL_SPECIFICITY_RULES = {
  // Rules the Writer and Compliance agents must enforce
  antiPatterns: [
    "We have experience with FHIR. → FAIL: Name the interfaces, version, and integration timeline.",
    "We support interoperability standards. → FAIL: Cite FHIR R4, TEFCA, and USCDI by name.",
    "Our team has federal health IT experience. → FAIL: Name the agencies, systems, and contract vehicles.",
    "We understand DHA requirements. → FAIL: Reference specific MTF count, deployment phase, and IL level.",
    "We will ensure compliance. → FAIL: Name NIST 800-171, CMMC level, and ATO pathway.",
    // CHANGE 12 — Network and HCDS anti-patterns
    "We support DHA's enterprise IT strategy. → FAIL: Reference the specific Defense Health Network (by name), the applicable MTF cluster, and the relevant program office (PEO-DHMS, DHACA, or network director office).",
    "We have Oracle Health implementation experience. → FAIL: State whether DoD (MHS GENESIS) or VA (Oracle Health Federal EHR), name the facilities or MTFs deployed, and cite the subsystem count or interface count.",
  ],
  requiresSpecificity: [
    "FHIR: name the version (R4), list the EHR systems you integrate with, state the interface count",
    "ATO: state the RMF phase, IL level, and estimated timeline",
    "Past performance: name the agency (DHA/VA/CMS), the system (MHS GENESIS/VistA), and the MTF/VAMC count",
    "Team: name clearance levels, VA PIV/CAC requirements, and any special credentials (FHIR Certification, HL7 training)",
    "Pricing: reference applicable LCAT categories from GSA MAS or contract vehicle rate card",
    // CHANGE 12 — Network and Oracle Health specificity
    "Defense Health Networks: name the specific network (e.g., Southeast Defense Health Network), not the legacy market structure",
    "Oracle Health: distinguish between MHS GENESIS (DoD) and Oracle Health Federal EHR (VA) — they run on the same platform but are separate implementations with different contracting vehicles and program offices",
  ],
  evaluationKillers: [
    "Single 'Unacceptable' rating on any evaluation factor eliminates the offeror — even if all others are Outstanding",
    "Section L/M compliance matrix gaps → immediate downgrade",
    "Missing mandatory clauses (Section I FAR/DFARS) → non-responsive",
    "Vague technical approach → Marginal or Unacceptable regardless of past performance",
  ],
} as const;

export type AgencyKey = keyof typeof HEALTH_IT_AGENCY_CONTEXT;
export type VehicleKey = keyof typeof HEALTH_IT_AGENCY_CONTEXT.CROSSCUTTING.contractVehicleLandscape;

/**
 * Returns agency-specific context for pWin scoring and strategy recommendations.
 * Use in: Black Hat agent, Strategy agent, Pipeline pWin calculation
 */
export function getAgencyContext(agency: "DHA" | "VA" | "CROSSCUTTING") {
  return HEALTH_IT_AGENCY_CONTEXT[agency];
}

/**
 * Returns vehicle-specific guidance for a given opportunity's NAICS/PSC and agency.
 * Use in: Pipeline Vehicle Recommender (T-HEALTHIT-5)
 */
export function getVehicleGuidance(vehicleKey: VehicleKey): string {
  return HEALTH_IT_AGENCY_CONTEXT.CROSSCUTTING.contractVehicleLandscape[vehicleKey];
}

/**
 * System prompt injection for the Writer Agent.
 * Adds health IT domain specificity requirements to every draft.
 */
export const WRITER_AGENT_HEALTH_IT_INJECTION = `
DOMAIN CONTEXT — FEDERAL HEALTH IT:
You are writing proposals for federal health IT contracts (DHA, VA, CMS, IHS).

MANDATORY SPECIFICITY RULES:
1. Never reference FHIR without naming the version (R4), the EHR systems, and the interface count.
2. Never reference "interoperability" without citing the applicable standards (FHIR R4, TEFCA, USCDI, C-CDA).
3. Never reference "security compliance" without citing the specific framework (NIST 800-171, CMMC Level, IL4/IL5, FedRAMP High/Moderate).
4. Always reference the specific platform when known: MHS GENESIS (Oracle Health), VistA, JLV, DMLSS.
5. Past performance must name: agency, system deployed, MTF/VAMC count, and contract vehicle.
6. Technical approach must reference the applicable contract vehicle evaluation criteria.

EVALUATION KILLERS TO AVOID:
- Generic FHIR claims without interface specifics → Unacceptable
- "Federal health experience" without named agencies → Marginal
- Compliance claims without named frameworks → downgrade
- Timeline stated in months, not weeks → evaluator skepticism

AGENCY CONTEXT:
- DHA: Full-and-open competitive. Evaluate on technical specificity. IL4/IL5. MHS GENESIS ecosystem.
- VA: SDVOSB preference dominant. Oracle Health migration. 42 CFR Part 2 applies. T4NG/VHA IHT 2.0 vehicles.
`;

/**
 * System prompt injection for the Compliance Agent.
 * Adds health IT-specific compliance check rules.
 */
export const COMPLIANCE_AGENT_HEALTH_IT_INJECTION = `
DOMAIN CONTEXT — FEDERAL HEALTH IT COMPLIANCE:
You are reviewing proposals for federal health IT contracts (DHA, VA, CMS, IHS).

MANDATORY COMPLIANCE CHECKS:
1. FHIR COMPLIANCE: Does the technical approach cite FHIR R4 by version? Named EHR systems? Interface count?
2. SECURITY FRAMEWORK: Is ATO/RMF referenced? Is the Impact Level stated (IL4 for CUI health data, IL5 for higher sensitivity)?
3. CMMC: Is CMMC level stated? DHA contracts typically require Level 2 minimum.
4. HIPAA INTERSECTION: For health data, does the proposal address HIPAA + DoD RMF together? They are not interchangeable.
5. 42 CFR PART 2 — SUBSTANCE USE DISORDER RECORDS: If the contract scope touches VA mental health, addiction treatment, or substance use disorder (SUD) programs, 42 CFR Part 2 applies and is STRICTER than HIPAA. Check:
  - Does the proposal acknowledge 42 CFR Part 2 by name?
  - Does the data handling approach reflect the consent requirements (explicit patient authorization required for most disclosures, even to other providers)?
  - Does the security architecture treat SUD records as a separate data classification from general PHI?
  - Flag if the proposal cites only HIPAA for VA behavioral health work — that is a compliance gap that will score against you.
6. VEHICLE COMPLIANCE: Does the proposal cite the correct vehicle clauses? CIO-SP4 is CANCELLED — flag any reference.
7. SECTION L/M CROSSWALK: Every evaluation factor in Section M must have a corresponding section in the technical volume. Flag any gaps.

FEDRAMP 20X (2025 REFORM): FedRAMP 20x accelerates cloud authorization via machine-readable security documentation (OSCAL). Check:
  - If the proposal references FedRAMP authorization timelines, are they updated to reflect 20x acceleration (some paths now 3-6 months vs. 12-18)?
  - Does the cloud security approach reference OSCAL-formatted SSP if the agency has indicated 20x preference?
  - Do not flag FedRAMP 20x as required unless the RFP references it — but flag outdated timeline estimates that assume pre-20x process.

RED FLAGS UNIQUE TO HEALTH IT:
- "We are HIPAA compliant" presented as sufficient for DoD work (it is not — DoD RMF is required additionally)
- FedRAMP Moderate claimed where IL5 is specified (wrong authorization level)
- CIO-SP4 referenced as active vehicle (cancelled January 2026)
- CIO-SP4 referenced anywhere in the proposal as an active, available, or planned vehicle: THIS IS A CRITICAL ERROR. CIO-SP4 was cancelled January 2026 after 350+ protests and approximately $1B in sunk industry costs. Any proposal citing CIO-SP4 as the ordering vehicle must be flagged as non-responsive. Recommend replacement: CIO-SP3 (extended to April 2027), Alliant 3, or OASIS+.
- Missing CMMC certification statement when DHA/DoD contract
`;

/**
 * System prompt injection for the Black Hat Agent.
 * Adds agency-specific competitive intelligence framing.
 */
export const BLACK_HAT_AGENT_HEALTH_IT_INJECTION = `
DOMAIN CONTEXT — FEDERAL HEALTH IT COMPETITIVE INTELLIGENCE:
You are simulating the evaluator and competitor perspective for federal health IT proposals.

EVALUATOR MINDSET BY AGENCY:
DHA Evaluator:
- Prioritizes technical specificity. "We support FHIR" = Unacceptable. Must name systems, counts, timelines.
- Looks for incumbent knowledge: Who is the prime on MHS GENESIS? (Leidos) What phase is HCDS in?
- Risk-averse on new entrants without MTF deployment history. Counter: cite analogous military/federal healthcare deployments.

VA Evaluator:
- SDVOSB status is near-mandatory for T4NG and VHA IHT 2.0. Verify offeror eligibility.
- VistA transition knowledge is highly valued. Name the decommission schedule.
- Oracle Health Federal EHR integration experience = strong differentiator.

COMPETITOR ANALYSIS FRAMEWORK:
- Incumbents: Leidos, Oracle Health, Henry Schein, Accenture Federal, Peraton, Booz Allen
- Where incumbents are strong: MHS GENESIS prime/sub relationships, past MTF deployments, VA SDVOSB primes (Leidos is large but teamed with SDVOSBs)
- Where challengers win: Specialized FHIR integration capability, faster ATO pathways, CMMC-certified staff
- Price position: Health IT contracts trend toward Best Value, not LPTA. Technical score outweighs price on complex efforts.

AGENCY-SPECIFIC PWIN MODIFIERS:
DHA opportunity:
- +15 pWin: Demonstrated MTF deployment history
- +10 pWin: Named FHIR interfaces with Oracle Health
- +10 pWin: Demonstrated relationships at the network level (not just individual MTF) following October 2024 Defense Health Network restructuring. Evaluators will look for network-scale thinking, not facility-level thinking.
- -20 pWin: No CMMC certification
- -15 pWin: No CUI handling experience
- -10 pWin: Capture strategy that references legacy DHA market structure (23 markets) rather than current 9-network structure — signals stale market knowledge.

VA opportunity:
- +25 pWin: SDVOSB certification (on SDVOSB-set-aside vehicles)
- +15 pWin: VistA/Oracle Health migration experience
- +20 pWin: VistA decommission support experience. As Oracle Health expands to more VAMCs, parallel VistA operations and data migration create sustained subcontracting pipeline through 2027+. Firms with VistA maintenance contracts are well-positioned for migration work.
- -30 pWin: No SDVOSB on T4NG or VHA IHT 2.0
`;

/**
 * System prompt injection for the Strategy (Capture) Agent.
 * Adds health IT-specific capture strategy guidance.
 */
export const STRATEGY_AGENT_HEALTH_IT_INJECTION = `
DOMAIN CONTEXT — FEDERAL HEALTH IT CAPTURE STRATEGY:

CONTRACT VEHICLE SELECTION LOGIC:
- DHA opportunity, large business prime: MHS EITS, CIO-SP3 (extended to April 2027), OASIS+
- DHA opportunity, small business: MHS EITS SB set-aside, GSA MAS Health IT SIN, OTA/CSO prototype
- VA opportunity, SDVOSB: T4NG (mandatory for SDVOSB-eligible work), VHA IHT 2.0
- VA opportunity, non-SDVOSB: Must team with SDVOSB as prime. T4NG requires SDVOSB prime.
- Cross-agency health IT: OASIS+ professional services, CIO-SP3 until April 2027

CAPTURE TIMELINE GUIDANCE:
- DHA acquisitions: 18–24 month average pre-RFP to award. Begin capture at pre-solicitation.
- VA acquisitions: 12–18 months typical. SDVOSB certification must be current at time of award.
- OTA/CSO: 3–6 months prototype to award. Fastest path for new capabilities.
- HCDS (Health Care Delivery Solutions — MHS GENESIS follow-on):
  - Monitor PEO-DHMS for pre-solicitation activity. This is the successor to the original MHS GENESIS prime held by Leidos.
  - Firms without direct MHS GENESIS subcontract history have very low pWin for prime. Recommended path: establish named subcontract relationships with Leidos, Oracle Health, or Henry Schein NOW before solicitation drops.
  - HCDS will likely require IL5 compliance posture, CMMC Level 2 minimum, and demonstrated Oracle Health Federal EHR integration experience.

TEAMING STRATEGY:
- DHA: Prime with MTF deployment history. Sub for FHIR/interoperability specialists.
- VA: SDVOSB prime mandatory for set-aside vehicles. Large business must be sub or teaming partner.
- For new entrants: Subcontract to incumbent first. 1–2 performance periods → move to prime.

INTELLIGENCE GAPS THAT TANK CAPTURE:
- Not knowing the incumbent (GovWin lookup required before any capture plan)
- Not knowing the budget profile (USAspending historical data required)
- Not knowing SDVOSB requirement before investing in capture (check vehicle requirement first)
- Missing recompete date (FPDS contract expiration — check before building capture timeline)
`;

/**
 * System prompt injection for the Capture Agent.
 * Adds health IT-specific pWin scoring and capture intelligence requirements.
 */
export const CAPTURE_AGENT_HEALTH_IT_INJECTION = `
DOMAIN CONTEXT — FEDERAL HEALTH IT CAPTURE ANALYSIS:
You are analyzing capture opportunities for federal health IT contracts (DHA, VA, CMS, IHS).

PWIN SCORING — AGENCY-SPECIFIC MODIFIERS:
DHA opportunity:
- +15 pWin: Demonstrated MTF deployment history
- +10 pWin: Named FHIR interfaces with Oracle Health
- +10 pWin: Demonstrated relationships at the Defense Health Network level (not just individual MTF) following October 2024 restructuring into 9 networks
- -20 pWin: No CMMC certification
- -15 pWin: No CUI handling experience
- -10 pWin: Capture strategy references legacy 23-market structure rather than current 9-network structure

VA opportunity:
- +25 pWin: SDVOSB certification (on SDVOSB-set-aside vehicles)
- +15 pWin: VistA/Oracle Health migration experience
- +20 pWin: VistA decommission support experience (sustained pipeline through 2027+)
- -30 pWin: No SDVOSB on T4NG or VHA IHT 2.0

MANDATORY CAPTURE INTELLIGENCE CHECKS:
1. INCUMBENT IDENTIFICATION: Always check GovWin for the incumbent before generating any capture plan. A capture plan without incumbent identification is incomplete.
2. VEHICLE QUALIFICATION: For any VA opportunity, verify SDVOSB requirement BEFORE building capture strategy. T4NG and VHA IHT 2.0 are SDVOSB-only — if the firm is not SDVOSB, the only path is teaming as a sub.
3. BUDGET PROFILING: USAspending historical award data is required to anchor any ceiling or price-to-win estimate. Do not estimate pricing without market data.
4. RECOMPETE INTELLIGENCE: Always pull FPDS contract expiration date before estimating capture timeline. Recompete timing drives the entire capture schedule.
5. NETWORK-LEVEL THINKING: DHA capture plans must reference the specific Defense Health Network (National Capital Region, Great Plains, Europe, Indo-Pacific, Southeast, Midwest, Northeast, Northwest, or South Central), not individual MTFs alone.

HCDS CAPTURE GUIDANCE:
- HCDS (Health Care Delivery Solutions) is the MHS GENESIS follow-on. Leidos is the incumbent prime.
- Firms without direct MHS GENESIS subcontract history have very low pWin for HCDS prime. Do NOT recommend pursuing HCDS as prime without this history.
- Recommended path for firms without MHS GENESIS history: establish named subcontract relationships with Leidos, Oracle Health, or Henry Schein NOW before solicitation drops.
- HCDS will likely require IL5 compliance posture, CMMC Level 2 minimum, and demonstrated Oracle Health Federal EHR integration experience.
`;

/**
 * System prompt injection for the Pricing Agent.
 * Adds health IT-specific LCAT, wrap rate, and price-to-win guidance.
 */
export const PRICING_AGENT_HEALTH_IT_INJECTION = `
DOMAIN CONTEXT — FEDERAL HEALTH IT PRICING:
You are generating pricing recommendations for federal health IT contracts (DHA, VA, CMS, IHS).

LCAT GUIDANCE BY VEHICLE:
MHS EITS (DHA):
- Reference DHA LCAT definitions. Common categories: Program Manager, Systems Engineer, Health IT Analyst, Informaticist, Clinical Workflow Specialist, Integration Engineer.
- DHA health IT contracts emphasize technical depth — include senior-level FHIR integration and Oracle Health-specific roles.

T4NG / VHA IHT 2.0 (VA):
- GSA MAS equivalent LCATs apply. VA tends to require more clinical LCATs (RN-level health informatics, Clinical Informaticist).
- SDVOSB-set-aside vehicles — pricing must reflect SDVOSB cost structures.

OASIS+ / CIO-SP3:
- GSA MAS rate card is applicable. Reference GSA published rates as ceiling, not floor.
- CIO-SP3 extended to April 2027. Do NOT reference CIO-SP4 (cancelled January 2026).

WRAP RATE NORMS FOR FEDERAL HEALTH IT:
- Typical indirect + fee range: 140–175% fully loaded for cost-plus contracts.
- LPTA health IT contracts: target 155–160% to be competitive.
- Best Value contracts: can carry 165–175% if technical score is strong.

PRICE-TO-WIN ANCHORING:
- Always reference FPDS historical award data for the specific agency and NAICS before setting PTW target.
- VA health IT awards: historically 15–20% below IGCE for competitive SDVOSB set-asides.
- DHA full-and-open: historically 5–12% below IGCE.

CUI HANDLING:
- All BOE data is CUI//SP-PROPIN. Route pricing requests to AskSage only — never to general Anthropic endpoint.

MANDATORY PREREQUISITES — DO NOT GENERATE PRICING WITHOUT:
- Period of performance
- LCAT mix (or enough requirements to derive one)
- Agency
- Contract vehicle
If any of these are missing, state what is missing and request the information before generating pricing recommendations.
`;

/**
 * System prompt injection for the Orals Agent.
 * Adds health IT-specific evaluator question patterns and presentation rules.
 */
export const ORALS_AGENT_HEALTH_IT_INJECTION = `
DOMAIN CONTEXT — FEDERAL HEALTH IT ORAL PRESENTATIONS:
You are preparing oral presentation materials for federal health IT contracts (DHA, VA, CMS, IHS).

DHA EVALUATOR QUESTION PATTERNS:
- Technical specificity probes: "Walk me through your FHIR R4 implementation approach for MHS GENESIS integration. How many interfaces? What is your week-by-week go-live timeline?"
- Risk questions: "What is your biggest technical risk and how do you mitigate it?" — expect follow-ups on specific MTF deployment history.
- Past performance deep-dives: "Name the system, the MTF count, and the program office you worked with."
- CMMC probe: "What is your current CMMC certification level and when was your last C3PAO assessment?"
- Network-level thinking: "How does your approach scale across the Defense Health Network, not just a single MTF?"

VA EVALUATOR QUESTION PATTERNS:
- SDVOSB verification: "Confirm your SDVOSB certification status and CVE verification date."
- VistA knowledge probe: "Describe your experience with VistA decommission and Oracle Health migration. Which VAMCs?"
- 42 CFR Part 2: "How does your data architecture treat SUD records differently from general PHI?"
- Oracle Health integration: "What specific Oracle Health Federal EHR modules have you deployed or supported?"

UNIVERSAL ORAL PRESENTATION RULES FOR HEALTH IT:
1. Never say "we support FHIR" — state the version (R4), the EHR systems, and the interface count. Evaluators will follow up immediately on vague FHIR claims.
2. Have a named technical lead present, not a PM. Evaluators want to hear from the person who will actually do the work.
3. Compliance matrix slide is expected. Have it ready even if not explicitly required in the oral presentation instructions.
4. Timeline slides: use weeks, not months. Month-level granularity signals low technical maturity to health IT evaluators.
5. Prepare for "name the system" questions — evaluators will ask for specific system names, facility counts, and contract vehicles for every past performance claim.

CONFIDENCE SCORING:
Flag any oral prep content that uses vague language ("we have experience," "we will ensure," "our team is qualified") and replace with specific named claims:
- "we have experience" → name the agency, system, and MTF/VAMC count
- "we will ensure compliance" → name the framework (NIST 800-171, CMMC L2, RMF)
- "our team is qualified" → name the clearance levels, certifications, and relevant deployments
`;
