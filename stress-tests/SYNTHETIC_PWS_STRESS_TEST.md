# SYNTHETIC PERFORMANCE WORK STATEMENT
## FOR STRESS TESTING ONLY - NOT A REAL SOLICITATION

**Solicitation Number:** SYNTHETIC-2026-0001  
**Agency:** Federal Health Agency (FHA)  
**Program:** Enterprise Data Modernization Initiative (EDMI)  
**Classification:** UNCLASSIFIED // SYNTHETIC TEST DATA  

---

## SECTION C: DESCRIPTION/SPECIFICATIONS/STATEMENT OF WORK

### C.1 BACKGROUND

The Federal Health Agency (FHA) operates a nationwide network of 142 medical treatment facilities serving approximately 9.6 million beneficiaries annually. The current Enterprise Health Record (EHR) system, deployed in 2009, has reached end-of-life status and requires modernization to meet emerging interoperability mandates under the 21st Century Cures Act and HIPAA 2025 amendments.

**CONTRADICTION #1:** The legacy system processes 847,000 transactions daily. [See Section C.4.2 which states 1.2M transactions daily - evaluators will test whether your system catches this.]

The incumbent contractor, Legacy Systems Inc., has provided sustainment services since 2012. **This contract is a full and open competition and is NOT a recompete.** [Intentional ambiguity - is there an incumbent advantage or not?]

### C.2 SCOPE

The Contractor shall provide all personnel, equipment, facilities, transportation, tools, materials, supervision, and other items and non-personal services necessary to perform Enterprise Data Modernization as defined in this Performance Work Statement.

**Period of Performance:**
- Base Year: 12 months from contract award
- Option Year 1: 12 months  
- Option Year 2: 12 months
- Option Year 3: 6 months [CONTRADICTION #2: Later sections reference 4 full option years]

**AMBIGUITY #1:** Work shall be performed "primarily" at Government facilities but the Contractor "may" establish a local presence within 30 miles of Site A (Primary), Site B (Secondary), or the National Capital Region. Define "primarily."

### C.3 APPLICABLE DOCUMENTS

The Contractor shall comply with the following, **in order of precedence** [but the order contradicts itself]:

1. Federal Acquisition Regulation (FAR)
2. Health Insurance Portability and Accountability Act (HIPAA)
3. NIST SP 800-53 Rev 5 (Note: Section C.7 references Rev 4)
4. FHA Policy Directive 2024-003 [Document does not exist - test error handling]
5. 21st Century Cures Act, Section 4003
6. Defense Federal Acquisition Regulation Supplement (DFARS) [Why DFARS for a civilian health agency?]
7. FedRAMP Moderate Baseline
8. CISA Binding Operational Directive 23-01

**CONTRADICTION #3:** Section C.7.2 states "FedRAMP High authorization required" while this section specifies Moderate.

### C.4 TECHNICAL REQUIREMENTS

#### C.4.1 System Migration

The Contractor shall migrate all data from the legacy Oracle RAC database (Version 11g) to the target PostgreSQL 15 environment within **90 calendar days** of contract award.

**Data Volume:**
- Patient Records: 47.3 million active records
- Historical Records: 128.6 million archived records  
- Imaging Data: 4.2 petabytes (DICOM format)
- Lab Results: 892 million discrete values

**IMPOSSIBLE TIMELINE TEST:** At the stated volume, achieving migration in 90 days requires sustained throughput of 1.95 TB/day for imaging data alone, assuming zero validation overhead. Industry standard for validated healthcare migrations is 200-400 GB/day.

**Success Criteria:**
- Zero data loss (100% record fidelity)
- Maximum 4-hour system downtime [CONTRADICTION #4: Section C.4.4 allows 72-hour maintenance windows]
- All 142 facilities operational within 24 hours of cutover

#### C.4.2 Transaction Processing

The system shall process a minimum of **1,200,000 transactions per day** with the following performance requirements:

| Transaction Type | Volume (Daily) | Max Latency | Availability |
|------------------|----------------|-------------|--------------|
| Patient Lookup | 450,000 | 200ms | 99.99% |
| Order Entry | 380,000 | 500ms | 99.95% |
| Results Delivery | 220,000 | 1000ms | 99.9% |
| Scheduling | 150,000 | 300ms | 99.95% |
| **TOTAL** | **1,200,000** | - | **99.999%** |

**MATH ERROR TEST:** The individual availability requirements mathematically cannot achieve 99.999% composite availability. (0.9999 × 0.9995 × 0.999 × 0.9995 = 99.79%)

#### C.4.3 Interoperability Requirements

The Contractor shall implement bidirectional interfaces with:

1. Department of Defense Military Health System (MHS GENESIS)
2. Veterans Health Administration (VistA/Cerner)
3. Centers for Medicare & Medicaid Services (CMS) Blue Button 2.0
4. 847 civilian healthcare partners via FHIR R4
5. State immunization registries (56 jurisdictions)
6. **Classified Network Interface** [CONTRADICTION #5: This is supposedly an unclassified system]

**HL7 FHIR Conformance:** The system shall be certified as a "FHIR Server" AND "FHIR Client" under the ONC Health IT Certification Program, 2015 Edition Cures Update. Certification must be achieved **prior to contract award.** [IMPOSSIBLE: How can you be certified before being awarded?]

#### C.4.4 Maintenance Windows

Scheduled maintenance shall occur only during approved windows:
- **Option A:** Sunday 0200-0600 ET (4 hours)
- **Option B:** Saturday 2200 - Sunday 0600 ET (8 hours)
- **Option C:** Continuous operations with rolling updates (zero downtime)

**The Government reserves the right to select any option at any time without equitable adjustment.** [Unreasonable risk transfer]

The Contractor shall provide **72-hour advance notice** for all maintenance activities. Emergency maintenance requires **Government approval within 30 minutes** of request. [Who approves at 3 AM?]

### C.5 STAFFING REQUIREMENTS

#### C.5.1 Key Personnel

The following positions are designated as Key Personnel and require Government approval for substitution:

| Position | Qty | Clearance | Certification Required | Location |
|----------|-----|-----------|------------------------|----------|
| Program Manager | 1 | Secret | PMP, ITIL v4 | Site A |
| Chief Architect | 1 | Top Secret/SCI | TOGAF 9, AWS Solutions Architect Pro | Site A |
| Security Lead | 1 | Top Secret/SCI | CISSP, CISM, CEH, CCSP, Security+ | Remote |
| Data Migration Lead | 1 | Secret | OCP, PgMP | Site B |
| Clinical Informaticist | 2 | Public Trust | RN License (any state), CPHIMS | Sites A/B |

**CLEARANCE CONTRADICTION #6:** This is a civilian health agency. Why require TS/SCI clearances? The PWS states "unclassified" system but requires TS/SCI personnel.

**CERTIFICATION STACKING:** The Security Lead must hold 5 concurrent certifications. Industry average for this combination is $15,000/year in maintenance fees alone.

#### C.5.2 Labor Categories

**HIDDEN REQUIREMENT:** All labor categories shall be mapped to the General Services Administration (GSA) Schedule 70 SIN 54151S subcategories. Pricing shall not exceed GSA rates **minus 15%**. [Margin crusher]

| LCAT | Education | Experience | GSA Equivalent |
|------|-----------|------------|----------------|
| Senior Engineer | BS + 12 yrs OR MS + 10 yrs OR PhD + 8 yrs | 8 years healthcare IT | 54151S-13 |
| Mid Engineer | BS + 6 yrs OR MS + 4 yrs | 4 years healthcare IT | 54151S-11 |
| Junior Engineer | BS + 2 yrs | 0 years healthcare IT | 54151S-09 |
| Analyst | BA/BS | 2 years | 54151S-07 |

**EXPERIENCE TRAP:** "Healthcare IT" experience is required but not defined. Does EHR implementation count? Does medical device software count? Does health insurance IT count?

### C.6 DELIVERABLES

| CDRL | Title | Format | Frequency | Due |
|------|-------|--------|-----------|-----|
| A001 | Program Management Plan | MS Word | Once | POA + 30 days |
| A002 | Monthly Status Report | MS Word + PPT | Monthly | 5th business day |
| A003 | Risk Register | MS Excel | Bi-weekly | Every other Friday |
| A004 | Security Assessment Report | OSCAL JSON | Quarterly | Q+15 days |
| A005 | System Design Document | **MIL-STD-498** format | Once | POA + 60 days |
| A006 | Test Results | **IEEE 829** format | Per milestone | Milestone + 5 days |
| A007 | Training Materials | **SCORM 2004** compliant | Per release | Release - 14 days |

**FORMAT CHAOS:** The deliverables require three different documentation standards (MIL-STD-498, IEEE 829, SCORM 2004) plus OSCAL. Typical commercial projects use one.

**TIMELINE TRAP:** CDRL A007 requires training materials 14 days BEFORE release. This assumes waterfall development despite Section C.8 requiring Agile/SAFe.

### C.7 SECURITY REQUIREMENTS

#### C.7.1 Personnel Security

All Contractor personnel with access to FHA systems shall:
- Undergo National Agency Check with Inquiries (NACI) within 30 days of contract award
- Complete annual Cybersecurity Awareness Training (2 hours)
- Complete annual HIPAA Training (4 hours)
- Complete annual Privacy Act Training (1 hour)  
- Complete **Counter-Intelligence Awareness Training** [For a health IT project?]

**Failure to complete training within 30 days of due date shall result in immediate system access revocation with no grace period.**

#### C.7.2 System Security

The Contractor shall achieve and maintain:
- **FedRAMP High** authorization [Contradicts C.3 which says Moderate]
- SOC 2 Type II attestation (annual)
- HITRUST CSF certification (r2 framework)
- **CMMC Level 3** certification [CONTRADICTION #7: CMMC is for DoD, not civilian agencies]

**ATO Timeline:** The Contractor shall achieve Authority to Operate (ATO) within **120 days** of contract award. Industry average for FedRAMP High is 12-18 months.

#### C.7.3 Incident Response

The Contractor shall report all security incidents to:
1. FHA Security Operations Center (SOC) - within 1 hour
2. CISA - within 24 hours  
3. HHS Office of Inspector General - within 72 hours
4. **FBI Cyber Division** - within 24 hours [For a health IT breach?]

**Breach notification to affected individuals shall occur within 48 hours of discovery.** [HIPAA allows 60 days; state laws vary from 30-90 days. 48 hours is impractical for large breaches.]

### C.8 MANAGEMENT APPROACH

#### C.8.1 Agile Methodology

The Contractor shall utilize **Scaled Agile Framework (SAFe) 5.0** with the following constraints:

- Sprint Duration: 2 weeks (non-negotiable)
- Program Increment: 5 sprints (10 weeks)
- **All user stories must be approved by Government Product Owner prior to sprint planning** [Anti-pattern: defeats purpose of Agile]
- **No user story may exceed 8 story points** [Arbitrary constraint]
- **Velocity must increase by minimum 5% each sprint** [Mathematically unsustainable]

#### C.8.2 Earned Value Management

Despite Agile methodology, the Contractor shall maintain **ANSI/EIA-748 compliant** Earned Value Management System (EVMS) with:

- Monthly CPR Format 1-5 submissions
- Variance thresholds: Cost ±5%, Schedule ±5%
- **Work Breakdown Structure to Level 5 minimum** [Conflicts with Agile story-based tracking]

**METHODOLOGY CONFLICT:** SAFe + traditional EVMS is a known anti-pattern. The PWS requires both without reconciliation.

### C.9 EVALUATION CRITERIA

Proposals will be evaluated using **Best Value Tradeoff** with the following factors:

| Factor | Weight | Subfactors |
|--------|--------|------------|
| Technical Approach | 40% | Migration Strategy (15%), Architecture (15%), Innovation (10%) |
| Past Performance | 30% | Relevance (20%), Quality (10%) |
| Price | 30% | Realism, Reasonableness |

**EVALUATION TRAP #1:** "Innovation" worth 10% but Section C.8 requires strict SAFe compliance. How do you innovate within rigid methodology constraints?

**EVALUATION TRAP #2:** Price is 30% but Section C.5.2 caps rates at GSA -15%. The evaluation will mathematically favor larger contractors with lower overhead.

**AMBIGUITY #2:** "Relevance" for past performance is undefined. Is a $5M EHR project relevant to a $200M modernization? Is a DoD health project relevant to a civilian health project?

---

## SECTION L: INSTRUCTIONS TO OFFERORS

### L.1 PAGE LIMITS

| Volume | Limit | Font | Margins |
|--------|-------|------|---------|
| Technical | 50 pages | Times New Roman 12pt | 1" all sides |
| Past Performance | 10 pages | Times New Roman 12pt | 1" all sides |
| Price | Unlimited | Arial 10pt | 0.5" all sides |

**FONT TRAP:** Technical requires TNR 12pt, Price requires Arial 10pt. Easy to miss.

### L.2 SUBMISSION DEADLINE

Proposals are due **February 29, 2026** at 2:00 PM Eastern Time.

[NOTE: 2026 is not a leap year. February 29 does not exist. This tests date validation.]

**Late proposals will not be considered under any circumstances, including Government system failures.**

---

## SECTION M: EVALUATION FACTORS

### M.1 ADJECTIVAL RATINGS

| Rating | Definition |
|--------|------------|
| Outstanding | Exceeds requirements in ways that benefit the Government |
| Good | Meets requirements |
| Acceptable | Meets minimum requirements with minor weaknesses |
| Marginal | Fails to meet some requirements |
| Unacceptable | Fails to meet requirements; proposal may not be considered |

**HIDDEN RULE:** An "Unacceptable" rating in ANY subfactor results in overall "Unacceptable" regardless of other ratings. [Buried in M.3.7, not visible in summary table]

---

## ATTACHMENT A: PRICING TEMPLATE

[Intentionally incompatible with standard tools]

The Contractor shall submit pricing in the following format:

```
<PRICING_DATA>
  <BASE_YEAR>
    <CLIN_0001 type="FFP">
      <DESCRIPTION>Program Management</DESCRIPTION>
      <UNIT>Month</UNIT>
      <QTY>12</QTY>
      <RATE format="USD-cents">0</RATE>
    </CLIN_0001>
    <!-- 47 additional CLINs omitted -->
  </BASE_YEAR>
</PRICING_DATA>
```

**XML TRAP:** Rates must be in "USD-cents" (multiply dollars by 100). Easy to submit prices 100x higher than intended.

---

## END OF SYNTHETIC PWS

**STRESS TEST SCORECARD:**

| Test Category | Challenges Embedded |
|---------------|---------------------|
| Contradictions | 7 major contradictions |
| Ambiguities | 2 critical ambiguities |
| Impossible Requirements | 3 (timeline, math, dates) |
| Methodology Conflicts | 2 (Agile/EVMS, FedRAMP timeline) |
| Hidden Traps | 5 (font, XML, ratings, rates, certification) |
| Scope Confusion | 3 (clearances, civilian/DoD, CMMC) |

**Expected MissionPulse Outputs:**
1. RFP Shredder should extract 47+ requirements with conflict flags
2. Iron Dome should flag 7+ compliance contradictions
3. Pricing Module should handle XML format warning
4. Black Hat should identify incumbent advantage despite "full and open" language

---

**⚠️ SYNTHETIC TEST DATA - DO NOT USE FOR ACTUAL PROPOSALS**

*Generated for MissionPulse stress testing*
*February 2026*
