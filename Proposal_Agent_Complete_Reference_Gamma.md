# Proposal Agent
## Complete Reference

---

The authoritative guide for federal capture and proposal operations.

For quick-start workflows, see the **Quick Start Guide**.
This document covers the full lifecycle, edge cases, and advanced operations.

---

# Document Map

| Section | What It Covers |
|---------|----------------|
| **1. Lifecycle Overview** | End-to-end flow, gates, timing |
| **2. Phase 0: Qualification** | Opportunity ID, Go/No-Go, Gate 1 |
| **3. Phase 1: Capture** | Strategy, win themes, teaming, Gate 2 |
| **4. Phase 2: Proposal Kickoff** | RFP analysis, compliance, assignments |
| **5. Phase 3: Proposal Development** | Writing, color teams, pricing |
| **6. Phase 4: Final Production** | Reviews, QC, submission |
| **7. Phase 5: Post-Submit** | Monitoring, orals, debrief |
| **8. Teaming Operations** | Partners, TAs, workshare |
| **9. Pricing Deep Dive** | Contract types, BOE, compliance |
| **10. Color Team Protocols** | Blue, Pink, Red, Gold, White Glove |
| **11. Shipley Artifacts** | Required deliverables by gate |
| **12. Contract Type Variations** | FFP, T&M, Cost-Plus, IDIQ |
| **13. All Prompts** | Complete prompt library |
| **14. Decision Trees** | Complex scenario navigation |
| **15. Troubleshooting** | Expanded problem resolution |
| **16. Governance & RACI** | Roles, approvals, accountability |

---

# 1. Lifecycle Overview

## The Five Phases

| Phase | Name | Duration | Key Gate |
|-------|------|----------|----------|
| **0** | Qualification | 1–2 weeks | Gate 1 (Go/No-Go) |
| **1** | Capture | 2–8 weeks | Gate 2 (Bid Decision) |
| **2** | Kickoff | 48 hours | RFP Release |
| **3** | Development | 2–6 weeks | Color Teams |
| **4** | Final Production | 3–5 days | Gate 3 (Submit) |
| **5** | Post-Submit | Until award | Orals / Debrief |

---

## Gate Structure

```
GATE 1 ──────────────────────────────────────────────────────────────►
   │
   ├── GO → Proceed to Capture
   ├── CONDITIONAL → Resolve items, then proceed
   ├── NO-GO → Kill opportunity
   └── DORMANT → Monitor for trigger event

GATE 2 ──────────────────────────────────────────────────────────────►
   │
   ├── BID → Commit resources, proceed to proposal
   └── NO-BID → Stop pursuit, document lessons

GATE 3 ──────────────────────────────────────────────────────────────►
   │
   ├── SUBMIT → Final approval, send proposal
   └── HOLD → Fix critical issues first
```

---

## Approval Authority

| Decision | Recommends | Approves |
|----------|------------|----------|
| Gate 1 (Go/No-Go) | Capture Lead, COO | **CEO** |
| Gate 2 (Bid/No-Bid) | Capture Lead, COO | **CEO** |
| Gate 3 (Submit) | Contracts, COO | **CEO** |
| Teaming Agreement | Capture Lead | **CEO** |
| Rate Exception | Finance | **CEO** |
| P-0/P-1 Promotion | Capture Lead | **CEO** |

---

# 2. Phase 0: Qualification

## Purpose

Determine if an opportunity deserves pursuit resources before committing B&P spend.

---

## Inputs Required

| Document | Source | Why Needed |
|----------|--------|------------|
| SAM.gov notice | SAM.gov | Solicitation details, dates |
| Agency forecast | Agency website | Timeline, requirements preview |
| USAspending data | USAspending.gov | Incumbent history, contract value |
| Past performance list | Internal | Relevance assessment |
| Vehicle status | Internal | Access confirmation |

---

## Gate 1 Evaluation Criteria

### Required (Must Pass)

| Criterion | Question | Fail = NO-GO |
|-----------|----------|--------------|
| Strategic Fit | Aligns to core agencies (VA, DHA, CMS, IHS)? | Yes |
| Eligibility | Set-aside status confirmed (WOSB/SDVOSB/SB)? | Yes |
| Vehicle Access | On contract vehicle or clear path? | Yes |
| FAR 52.219-14 | Can maintain >50% Cost of Personnel? | Yes |

### High Priority

| Criterion | Question | Impact |
|-----------|----------|--------|
| Past Performance | Relevant PP as prime or credible sub path? | pWin +/- 20% |
| Customer Access | Warm relationship or introduction path? | pWin +/- 15% |
| Staffing | Can field >50% of SOW scope? | Execution risk |

### Medium Priority

| Criterion | Question | Impact |
|-----------|----------|--------|
| pWin Threshold | ≥25% (prime) or ≥40% (sub)? | B&P efficiency |
| B&P ROI | Bid cost <5% of first-year revenue? | Financial discipline |

---

## Gate 1 Prompts

**Initial assessment:**
```
What do I need to know about this RFP?
```

**Fact extraction:**
```
Extract procurement facts. Label each FACT, ASSUMPTION, or UNKNOWN.
```

**Incumbent research:**
```
Who is the incumbent? What's their contract value and history?
```

**Gate 1 decision:**
```
Run Gate 1. Is this a GO, CONDITIONAL, NO-GO, or DORMANT?
```

---

## Gate 1 Outcomes

### GO
- Proceed to Capture Planning
- Assign Capture Lead
- Begin teaming outreach
- Schedule Blue Team

### CONDITIONAL
- Proceed with defined kill criteria
- Set deadline for gap closure
- Document conditions in pipeline
- Review weekly until resolved

### NO-GO
- Document rationale
- Archive opportunity data
- Update pipeline (KILL status)
- Conduct brief lessons learned

### DORMANT
- Define trigger event
- Set monitoring cadence
- Assign owner for tracking
- Document re-evaluation criteria

---

# 3. Phase 1: Capture

## Purpose

Develop the strategy, themes, and team to win. Confirm bid decision before committing proposal resources.

---

## Capture Plan Components

| Component | Description | Agent Prompt |
|-----------|-------------|--------------|
| Win Themes | 3 memorable value propositions | `Develop 3 win themes. What we do → why it matters → proof.` |
| Discriminators | 2-3 unique differentiators | `What are our discriminators vs. likely competition?` |
| Ghost Strategies | Competitor weakness exploitation | `Create ghost strategies against likely competition.` |
| Customer Hot Buttons | Agency priorities and pain points | `What are the customer's hot buttons for this procurement?` |
| Competitive Assessment | Landscape analysis | `Analyze the competitive landscape. Who's likely to bid?` |
| Call Plan | Customer engagement schedule | `Create a call plan for customer engagement.` |
| Teaming Strategy | Partner roles and workshare | `Recommend teaming strategy for this opportunity.` |

---

## Win Theme Construction

### Required Structure

```
[FEATURE] → [MEASURABLE BENEFIT] → [PROOF]
```

### Example

> rockITdata's Adoption Analytics platform (feature) reduces EHR adoption timelines by 40% (benefit), validated by 94% clinician satisfaction across 13 VA medical centers (proof).

### Rules

- Maximum 3 win themes
- Each must have quantified proof
- Must map to Section M factors
- No marketing language

---

## Ghost Strategy Rules

### Do

- Attack methods, latency, operational friction
- Use neutral language: "traditional approaches," "legacy methods"
- Highlight structural disadvantages

### Don't

- Name competitors directly
- Make unsubstantiated claims
- Attack people or organizations

### Example

> "Traditional approaches rely on periodic manual audits that identify issues 60-90 days after occurrence. rockITdata's continuous monitoring detects anomalies within 24 hours, enabling preventive intervention before financial impact."

---

## Gate 2 Checklist

Before running Gate 2, verify:

- [ ] All UNKNOWN items resolved or accepted
- [ ] Win themes finalized (max 3)
- [ ] Teaming partners confirmed
- [ ] Pricing ROM completed
- [ ] Customer access pathway confirmed
- [ ] Key personnel identified
- [ ] No unresolved CONDITIONAL items from Gate 1

---

## Gate 2 Prompts

**Strategy validation:**
```
Run Gate 2. Am I ready to bid?
```

**If gaps exist:**
```
What's blocking Gate 2 approval? List specific items to resolve.
```

---

# 4. Phase 2: Proposal Kickoff

## Purpose

Mobilize the proposal team within 48 hours of RFP release. Establish compliance baseline and assignments.

---

## Kickoff Meeting (90 Minutes)

| Time | Topic | Owner |
|------|-------|-------|
| 10 min | RFP Overview — contract type, dates, set-aside | Capture Lead |
| 15 min | Compliance Review — Section L/M analysis, red flags | Contracts |
| 10 min | Win Strategy Refresh — themes, discriminators | Capture Lead |
| 15 min | Technical Approach — PWS scope, solution direction | Solution Architect |
| 10 min | Staffing & Key Personnel — requirements, gaps | HR/People Ops |
| 10 min | Pricing Strategy — contract type, margin targets | Finance |
| 5 min | Teaming Confirmation — sub roles, TA status | Capture Lead |
| 10 min | Schedule & Assignments — color teams, owners | PM |
| 5 min | Action Items — Q&A questions, blockers | All |

---

## Required Attendees

| Role | Responsibility |
|------|----------------|
| Capture Lead | Win strategy, solution direction |
| Contracts | L/M analysis, compliance |
| HR/People Ops | Key personnel, staffing |
| Finance | Pricing strategy, margin |
| Delivery Lead | Execution feasibility |
| Solution Architect | Technical approach |

> ⚠️ Contracts MUST read full solicitation before kickoff.

---

## Kickoff Outputs

| Deliverable | Due | Owner |
|-------------|-----|-------|
| Compliance Matrix (draft) | Kickoff +24hrs | Contracts |
| Volume Outline | Kickoff +48hrs | Capture Lead |
| Writer Assignments | Kickoff +48hrs | PM |
| Q&A Questions (draft) | Kickoff +72hrs | Technical Team |
| Color Team Schedule | Kickoff +24hrs | PM |

---

## Kickoff Prompts

**Compliance matrix:**
```
Build compliance matrix from Section L. Map to Section M factors.
```

**Volume structure:**
```
Create outlines for Volume 1 (Technical), Volume 2 (Management), Volume 3 (Past Performance). Allocate pages based on Section L limits.
```

**Identify gaps:**
```
What questions should we submit for Q&A based on RFP ambiguities?
```

---

# 5. Phase 3: Proposal Development

## Purpose

Write, price, and review the proposal through progressive color team gates.

---

## Writing Workflow

### Step 1: Compliance Matrix First

Never write without a complete compliance matrix.

```
Build compliance matrix from Section L. Map to Section M factors.
```

### Step 2: Volume Outlines

```
Create detailed outline for Volume 1 (Technical). Map each section to PWS tasks and Section M factors.
```

### Step 3: Section Drafts

```
Draft Section 3.2 (Technical Approach to Training). Map to PWS Task 3. Embed win theme about adoption analytics.
```

### Step 4: Integration

```
Review all volume sections for consistency. Flag any conflicts or gaps.
```

---

## Volume Structure (Standard)

| Volume | Content | Typical Pages |
|--------|---------|---------------|
| **1 — Technical** | Approach, methodology, solution | 30-50 |
| **2 — Management** | Org chart, staffing, QA, risk | 15-25 |
| **3 — Past Performance** | References, relevance, outcomes | 10-15 |
| **4 — Pricing** | BOE, labor mix, rates | Per RFP |

---

## Section Development Prompts

**Technical Approach:**
```
Draft Technical Approach. Map to PWS tasks. Embed win themes. Include transition plan.
```

**Management Approach:**
```
Draft Management Approach. Include org chart, reporting structure, QA plan, risk management, and communication plan.
```

**Staffing Plan:**
```
Create staffing plan. Show roles, FTEs by period, key personnel qualifications, and 90-day transition timeline.
```

**Past Performance:**
```
Draft Past Performance volume. Structure each reference as: relevance → scope → outcomes → customer contact.
```

**Risk Management:**
```
Create risk register. Identify top 5 risks with likelihood, impact, and mitigation strategy.
```

---

## Amendment Tracking

When amendments are released:

```
Compare this amendment to the original RFP. List all changes and their impact on our approach.
```

```
Update compliance matrix for Amendment [X]. Flag any new requirements.
```

---

# 6. Phase 4: Final Production

## Purpose

Complete final reviews, resolve all issues, and prepare submission package.

---

## Final Week Timeline

| Days Out | Activity | Gate |
|----------|----------|------|
| **7-5** | Red Team Review | Content complete |
| **5-3** | Fix Red Team findings | Revisions |
| **3-2** | Gold Team Review | Pricing final |
| **2-1** | White Glove QC | Production |
| **1-0** | Gate 3 + Submit | CEO approval |

---

## Gate 3 Checklist

### Compliance Verification

- [ ] All Section L instructions followed
- [ ] All Section M factors addressed
- [ ] Page counts within limits
- [ ] Required forms completed and signed
- [ ] Certifications current

### Content Verification

- [ ] Win themes present in each volume
- [ ] Technical approach covers full PWS
- [ ] Staffing supports technical approach
- [ ] Past performance demonstrates relevance

### Pricing Verification

- [ ] Rates within bands and MAS ceilings
- [ ] FAR 52.219-14 compliant
- [ ] Margin meets minimum threshold
- [ ] BOE documented and traceable

### Production Verification

- [ ] All volumes formatted correctly
- [ ] Headers, footers, page numbers consistent
- [ ] Cross-references accurate
- [ ] Electronic files tested for upload

---

## Gate 3 Prompt

```
Run Gate 3. Am I ready to submit? Verify compliance, content, pricing, and production.
```

---

## Submission Checklist

| Item | Status |
|------|--------|
| Volume 1 — Technical | ☐ |
| Volume 2 — Management | ☐ |
| Volume 3 — Past Performance | ☐ |
| Volume 4 — Pricing | ☐ |
| Required Forms | ☐ |
| Certifications | ☐ |
| Electronic upload tested | ☐ |
| CEO sign-off obtained | ☐ |

---

# 7. Phase 5: Post-Submit

## Purpose

Monitor award status, prepare for orals if required, and capture lessons learned.

---

## Award Monitoring

```
What's the expected timeline for award on [Solicitation Number]?
```

Track:
- Evaluation period (typically 60-90 days)
- Competitive range announcements
- Discussions/clarifications requests
- Award date

---

## Orals Preparation (If Required)

### Preparation Prompts

```
Create orals preparation guide. Key messages, anticipated questions, speaker assignments.
```

```
Generate likely evaluator questions based on our proposal and Section M factors.
```

```
Create practice scenarios for orals dry run.
```

### Orals Structure

| Segment | Duration | Content |
|---------|----------|---------|
| Opening | 5 min | Win themes, team introduction |
| Technical | 20-30 min | Approach walkthrough |
| Management | 10-15 min | Team, QA, risk |
| Q&A | 30-45 min | Evaluator questions |
| Close | 5 min | Summary, call to action |

---

## Win/Loss Debrief

### If Won

```
Create transition plan for contract start. 90-day mobilization timeline.
```

### If Lost

```
Prepare debrief questions for contracting officer. Focus on evaluation feedback.
```

### Debrief Questions

1. What was our evaluated score for each factor?
2. What were our identified strengths?
3. What were our identified weaknesses?
4. How did our pricing compare?
5. What could we have done differently?

---

## Lessons Learned

After every pursuit (win or lose):

```
Generate lessons learned report. What worked, what didn't, recommendations for next time.
```

---

# 8. Teaming Operations

## Purpose

Build and manage partner relationships that strengthen proposals and execution.

---

## Partner Meeting Protocol

After every partner call:

```
Process these meeting notes from [Partner Name].
```

### 5 Required Outputs

| # | Output | Definition | Example |
|---|--------|------------|---------|
| 1 | **Deal Lanes** | Specific opportunities partner will support | "CCN Next Gen, EHRM Restart" |
| 2 | **Role Split** | Who leads vs supports on each lane | "TriWest leads; rockITdata owns OCM" |
| 3 | **Staffing ×2** | Named roles, timing, FTE level | "PM-4 (1.0 FTE) Q2; OCM Lead (0.5) Q3" |
| 4 | **Access** | Intro list + customer contacts + date | "Intro to CMS Director by Feb 15" |
| 5 | **Gated Next Step** | Action + deadline + kill condition | "TA draft by Feb 1; kill if no response by Feb 15" |

### Missing Output? Generate Follow-Up

```
Generate follow-up questions for missing partner outputs.
```

---

## Partner Status Rules

| Status | Criteria |
|--------|----------|
| **COMPLETE** | All 5 outputs captured |
| **INCOMPLETE** | Any output missing |
| **GATED** | Conditional commitment (e.g., license, exclusivity) |

> ⚠️ Partners with uncleared gates are capped at 30% pWin.

---

## Teaming Agreement Review

```
Review this teaming agreement. Flag any terms that conflict with Prime Authority or FAR compliance.
```

### Red Flags to Check

| Issue | Risk | Action |
|-------|------|--------|
| Exclusivity clause | Limits flexibility | Negotiate or reject |
| Prime authority dilution | Compliance risk | Reject |
| Unlimited liability | Financial risk | Cap or reject |
| Non-compete overreach | Future pursuit limits | Narrow scope |
| Rate lock without escalation | Margin erosion | Add escalation |

---

## Workshare Negotiation

```
Calculate workshare split for [Partner] on [Opportunity]. Show Cost of Personnel impact.
```

### Target Workshare Ranges

| Partner Type | Typical Range | CoP Impact |
|--------------|---------------|------------|
| Large Business Sub | 10-25% | Watch closely (>40% = risk) |
| Small Business Sub | 15-35% | Helps compliance |
| Mentor (if applicable) | 5-15% | Limited scope |

---

# 9. Pricing Deep Dive

## Purpose

Build compliant, competitive, profitable pricing.

---

## Standard Assumptions

| Parameter | Value | Notes |
|-----------|-------|-------|
| Overhead (OH) | 15% | Applied to direct labor |
| G&A | 8% | Applied to total costs |
| Fee | 10% | Target profit margin |
| Composite Wrap | 1.37x | Direct Labor × 1.37 = Bill Rate |
| Escalation | 3% YoY | Applied to option years |

---

## Margin Thresholds

| Threshold | FFP | Cost-Plus | Notes |
|-----------|-----|-----------|-------|
| Qualification | 15% | — | Go/No-Go bid decision target |
| Target | 12% | 10% (fee) | Operational pricing target |
| COO Flag | 10% | 10% | Requires COO review if below |
| Minimum | 8% | 8% (fee) | Floor for approval |
| Walk-Away | 6% | 6% | CEO approval required |

> ⚠️ Margin below 10% triggers mandatory COO escalation. Below 6% requires CEO approval to proceed.

---

## Pricing Prompts

**Build BOE:**
```
Build pricing. Use my rate bands. OH 15%, G&A 8%, Fee 10%, 3% escalation.
```

**Rate check:**
```
Check all rates against rate bands and MAS ceilings. Flag exceedances.
```

**Compliance check:**
```
Calculate Cost of Personnel. Is FAR 52.219-14 satisfied?
```

**Margin analysis:**
```
Calculate margin at proposed price. Flag if below minimum threshold.
```

**Price sensitivity:**
```
Model pricing scenarios: baseline, 5% reduction, 10% reduction. Show margin impact.
```

---

## FAR 52.219-14 Compliance

### The Rule

For SDVOSB/WOSB set-asides: **Prime must perform ≥50% of Cost of Personnel**

### Calculation

```
COST OF PERSONNEL ANALYSIS

Prime (rockITdata):     $X.XM  (XX%)
SB Subs:                $X.XM  (XX%)
Large Subs:             $X.XM  (XX%)

Prime + SB = XX%
```

### Thresholds

| Metric | Safe | Warning | Violation |
|--------|------|---------|-----------|
| Prime + SB CoP | ≥60% | 50-59% | <50% |
| Large Sub CoP | <30% | 30-40% | >40% |

---

## Rate Band Usage

| Scenario | Band Position |
|----------|---------------|
| Competitive bid (LPTA) | Min to Target |
| Best value / trade-off | Target |
| Sole source | Target to Max |
| Large sub rates | Must stay within band OR escalate |

---

# 10. Color Team Protocols

## Overview

| Team | Timing | Purpose | Focus |
|------|--------|---------|-------|
| **Blue** | Pre-RFP | Validate capture strategy | Strategy, themes |
| **Pink** | ~30% complete | Compliance check | Structure, gaps |
| **Red** | ~70% complete | Simulated evaluation | Content quality |
| **Gold** | ~90% complete | Pricing review | Cost, margin |
| **White Glove** | Final | Production QC | Format, completeness |

---

## Blue Team

### Timing
Before or immediately after RFP release

### Purpose
Validate capture strategy and win themes before writing begins

### Participants
CEO, COO, Solution Architect, Delivery Lead

### Agenda
1. Win theme presentation (10 min)
2. Competitive assessment review (10 min)
3. Solution approach overview (15 min)
4. Teaming strategy (10 min)
5. Risk discussion (10 min)
6. Go/No-Go confirmation (5 min)

### Prompt
```
Prepare Blue Team briefing. Present win themes, discriminators, competitive assessment, and solution approach.
```

---

## Pink Team

### Timing
~30% complete (storyboards/outlines done)

### Purpose
Verify compliance and structure before full drafting

### Participants
Capture Lead, PM, Contracts, Solution Architect

### Checklist
- [ ] All Section L requirements mapped
- [ ] All Section M factors addressed
- [ ] Page allocations appropriate
- [ ] Writer assignments complete
- [ ] Outline structure logical

### Prompt
```
Run Pink Team review. Check compliance matrix completeness and outline structure.
```

---

## Red Team

### Timing
~70% complete (drafts done)

### Purpose
Simulated government evaluation against Section M

### Participants
Independent reviewers (not writers), COO, Solution Architect, Delivery Lead

### Key Rules
- Writers do NOT review their own sections
- Score against Section M factors only
- Identify strengths, weaknesses, deficiencies
- Provide specific fix recommendations

### Scoring Scale

| Rating | Definition |
|--------|------------|
| Outstanding | Exceeds requirements, significant strengths |
| Good | Meets requirements, some strengths |
| Acceptable | Meets minimum requirements |
| Marginal | Fails to meet some requirements |
| Unacceptable | Fails to meet requirements, major deficiencies |

### Prompt
```
Run Red Team. Score each Section M factor. List strengths, weaknesses, deficiencies. Provide prioritized fix list.
```

---

## Gold Team

### Timing
~90% complete (5-7 days before submission)

### Purpose
Executive pricing review and risk acceptance

### Participants
CEO, COO, Finance, Contracts, Capture Lead

### Verification Items
- [ ] Margin meets target (≥12% FFP, ≥10% CP)
- [ ] FAR 52.219-14 Cost of Personnel compliant
- [ ] Labor rates within bands and MAS ceilings
- [ ] Subcontractor rates confirmed in writing
- [ ] Cost realism narrative complete
- [ ] BOE documented and traceable

### Prompt
```
Run Gold Team on pricing. Verify rates, margins, compliance. Output approval checklist.
```

---

## White Glove

### Timing
24-48 hours before submission

### Purpose
Final production quality check

### Participants
Contracts, PM, QA

### Checklist
- [ ] All volumes formatted correctly
- [ ] Headers, footers, page numbers consistent
- [ ] Cross-references accurate
- [ ] Table of contents matches content
- [ ] All attachments present
- [ ] File names per RFP instructions
- [ ] Electronic upload tested

### Prompt
```
Run White Glove QC. Check formatting, cross-references, attachments, and submission requirements.
```

---

# 11. Shipley Artifacts

## Required Artifacts by Gate

| Artifact | Gate 1 | Gate 2 | Gate 3 | P-0 | P-1 |
|----------|--------|--------|--------|-----|-----|
| Win Themes (max 3) | Draft | Final | Validated | YES | YES |
| Discriminators (max 3) | Draft | Final | Proof points | YES | YES |
| Competitive Assessment | Initial | Updated | Ghost strategies | YES | YES |
| Capture Plan | — | Draft | Final | YES | REC |
| Call Plan | — | Draft | Executed | YES | REC |
| Compliance Matrix | — | — | Complete | YES | YES |
| Staffing Plan | — | Draft | Named KP | YES | REC |
| BOE / Pricing Model | — | ROM | Final | YES | REC |
| Risk Register | — | Initial | Mitigated | YES | REC |
| Partner Workshare | Verbal | Draft TA | Signed TA | YES (if teaming) | REC |

---

## Artifact Prompts

**Win themes:**
```
Develop 3 win themes. What we do → why it matters → proof.
```

**Discriminators:**
```
What are our discriminators? How do we prove each one?
```

**Competitive assessment:**
```
Analyze competitive landscape. Likely bidders, their strengths/weaknesses, our positioning.
```

**Capture plan:**
```
Build capture plan. Include win themes, discriminators, ghost strategies, teaming, and call plan.
```

**Call plan:**
```
Create customer engagement call plan. Who to contact, when, what to discuss.
```

**Risk register:**
```
Create risk register. Top 10 risks with likelihood, impact, and mitigation.
```

---

# 12. Contract Type Variations

## FFP (Firm Fixed Price)

### Characteristics
- Fixed price regardless of actual costs
- Contractor assumes cost risk
- Government assumes performance risk

### Pricing Approach
- Target margin: 12%
- Minimum margin: 8%
- Include contingency in estimates
- Escalation critical for multi-year

### Prompt
```
Build FFP pricing. Target 12% margin. Include risk contingency.
```

---

## T&M (Time and Materials)

### Characteristics
- Hourly rates fixed, hours variable
- Shared cost risk
- Ceiling price typically specified

### Pricing Approach
- Rates must be competitive
- Hours based on historical data
- Ceiling provides upper bound

### Prompt
```
Build T&M pricing. Set rates at target band. Estimate hours based on similar past work.
```

---

## Cost-Plus (Cost Reimbursement)

### Characteristics
- Costs reimbursed plus fixed fee
- Government assumes cost risk
- Fee typically 8-10%

### Pricing Approach
- Target fee: 10%
- Costs must be allowable, allocable, reasonable
- Detailed BOE required

### Prompt
```
Build cost-plus pricing. Target 10% fee. Ensure all costs are allowable.
```

---

## IDIQ (Indefinite Delivery/Indefinite Quantity)

### Characteristics
- Master contract with task order competition
- Ceiling value vs. actual task order value
- Multiple award typical

### Key Rule

> ⚠️ Never use ceiling value for planning. Always use sub-slice target.

### Prompt
```
This is an IDIQ. Use sub-slice target of $[X]M, not the ceiling value.
```

---

# 13. All Prompts

## Phase 0: Qualification

```
What do I need to know about this RFP?
```

```
Extract procurement facts. Label each FACT, ASSUMPTION, or UNKNOWN.
```

```
Who is the incumbent? What's their contract value and history?
```

```
Run Gate 1. Is this a GO, CONDITIONAL, NO-GO, or DORMANT?
```

---

## Phase 1: Capture

```
Develop 3 win themes. What we do → why it matters → proof.
```

```
What are our discriminators vs. likely competition?
```

```
Create ghost strategies against likely competition.
```

```
What are the customer's hot buttons for this procurement?
```

```
Analyze the competitive landscape. Who's likely to bid?
```

```
Create a call plan for customer engagement.
```

```
Recommend teaming strategy for this opportunity.
```

```
Build capture plan. Include win themes, discriminators, ghost strategies, and call plan.
```

```
Run Gate 2. Am I ready to bid?
```

---

## Phase 2: Kickoff

```
Build compliance matrix from Section L. Map to Section M factors.
```

```
Create outlines for Volume 1 (Technical), Volume 2 (Management), Volume 3 (Past Performance). Allocate pages.
```

```
What questions should we submit for Q&A based on RFP ambiguities?
```

---

## Phase 3: Development

```
Draft Technical Approach. Map to PWS tasks. Embed win themes.
```

```
Draft Management Approach. Org chart, reporting, QA, risk.
```

```
Create staffing plan. Roles, FTEs, key personnel, 90-day transition.
```

```
Draft Past Performance volume. Relevance, scope, outcomes, contacts.
```

```
Create risk register. Top 10 risks with mitigation.
```

```
Compare this amendment to the original RFP. List all changes.
```

---

## Pricing

```
Build pricing. Use my rate bands. OH 15%, G&A 8%, Fee 10%, 3% escalation.
```

```
Check all rates against rate bands and MAS ceilings.
```

```
Calculate Cost of Personnel. Is FAR 52.219-14 satisfied?
```

```
Calculate margin at proposed price.
```

```
Model pricing scenarios: baseline, 5% reduction, 10% reduction.
```

---

## Reviews

```
Prepare Blue Team briefing. Win themes, discriminators, competitive assessment.
```

```
Run Pink Team review. Check compliance matrix and outline structure.
```

```
Run Red Team. Score Section M factors. Give me the fix list.
```

```
Run Gold Team on pricing. Verify rates, margins, compliance.
```

```
Run White Glove QC. Check formatting and submission requirements.
```

```
Run Gate 3. Am I ready to submit?
```

---

## Partners

```
Process these meeting notes from [Partner Name].
```

```
Generate follow-up questions for missing partner outputs.
```

```
Review this teaming agreement. Flag conflicts with Prime Authority.
```

```
Calculate workshare split for [Partner]. Show Cost of Personnel impact.
```

---

## Post-Submit

```
Create orals preparation guide. Key messages, anticipated questions.
```

```
Generate likely evaluator questions based on our proposal.
```

```
Create transition plan for contract start. 90-day mobilization.
```

```
Prepare debrief questions for contracting officer.
```

```
Generate lessons learned report.
```

---

# 14. Decision Trees

## Should We Pursue? (Gate 1)

```
START
  │
  ├── Strategic fit? (VA/DHA/CMS/IHS)
  │     ├── NO → NO-GO
  │     └── YES ↓
  │
  ├── Eligible? (Set-aside, vehicle)
  │     ├── NO → NO-GO
  │     └── YES ↓
  │
  ├── Can satisfy FAR 52.219-14?
  │     ├── NO → NO-GO
  │     └── YES ↓
  │
  ├── pWin ≥25% (prime) or ≥40% (sub)?
  │     ├── NO → DORMANT (monitor for changes)
  │     └── YES ↓
  │
  ├── Past performance gap?
  │     ├── YES → CONDITIONAL (teaming path?)
  │     └── NO ↓
  │
  └── GO
```

---

## Should We Bid? (Gate 2)

```
START
  │
  ├── All Gate 1 conditions resolved?
  │     ├── NO → Return to capture
  │     └── YES ↓
  │
  ├── Win themes finalized?
  │     ├── NO → Finalize before proceeding
  │     └── YES ↓
  │
  ├── Teaming confirmed?
  │     ├── NO → Lock partners or adjust strategy
  │     └── YES ↓
  │
  ├── Pricing viable? (margin ≥8%)
  │     ├── NO → Redesign or NO-BID
  │     └── YES ↓
  │
  ├── Staffing plan feasible?
  │     ├── NO → Address gaps
  │     └── YES ↓
  │
  └── BID (proceed to proposal)
```

---

## Rate Exceeds Limit

```
START
  │
  ├── Above internal rate band?
  │     ├── YES → Negotiate with sub or replace
  │     └── NO ↓
  │
  ├── Above MAS ceiling?
  │     ├── YES → Remap to different labor category
  │     │         └── Still exceeds? → Escalate to Finance
  │     └── NO ↓
  │
  └── Rate approved
```

---

## FAR 52.219-14 Violation

```
START
  │
  ├── Prime + SB CoP ≥50%?
  │     ├── NO ↓
  │     │     ├── Can shift work from Large to Prime?
  │     │     │     ├── YES → Redesign staffing
  │     │     │     └── NO ↓
  │     │     │           ├── Can shift work from Large to SB sub?
  │     │     │           │     ├── YES → Redesign staffing
  │     │     │           │     └── NO → ESCALATE (may be no-bid)
  │     └── YES ↓
  │
  ├── Large Sub CoP <40%?
  │     ├── NO → Review and reduce Large sub scope
  │     └── YES ↓
  │
  └── Compliant
```

---

# 15. Troubleshooting (Expanded)

## Document Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Too many UNKNOWNs | Missing source documents | Upload SAM.gov, USAspending, forecast. Re-run. |
| Compliance matrix wrong | Incomplete RFP | Upload full RFP + all amendments. Re-extract. |
| Amendment conflicts | Changes not integrated | Run amendment comparison. Update matrix. |
| Section L/M mismatch | Misinterpretation | Cross-reference L and M. Verify mapping. |

---

## Pricing Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Rate above band | Sub rate too high | Negotiate, replace, or remap category. |
| Rate above MAS | Category mismatch | Remap to appropriate labor category. |
| Margin below minimum | Cost structure | Reduce scope, adjust mix, or escalate. |
| 52.219-14 violation | Too much Large sub work | Shift work to Prime/SB. Redesign staffing. |
| Ceiling value used | IDIQ confusion | Specify sub-slice target explicitly. |

---

## Content Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Marketing language | Old habits | "Rewrite. Every claim needs proof." |
| Missing win themes | Not embedded | "Embed win themes in Section [X]." |
| Weak discriminators | Generic claims | "Strengthen discriminators with proof points." |
| Ghost strategy names competitor | Rule violation | "Remove competitor name. Use neutral language." |

---

## Partner Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Missing 5 outputs | Incomplete meeting | Generate follow-up questions. Send them. |
| Partner won't commit | Soft engagement | Set deadline. If missed, find alternative. |
| Partner gated | Conditional commitment | Cap pWin at 30%. Set gate deadline. |
| TA conflicts with Prime Authority | Bad terms | Reject or renegotiate. Never dilute Prime. |

---

## Review Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Red Team score low | Content gaps | Address fixes in priority order. |
| Gold Team margin fail | Pricing issues | Redesign staffing or adjust scope. |
| White Glove format errors | Rush production | Fix all items before submission. |

---

# 16. Governance & RACI

## RACI Matrix (Key Activities)

**R** = Responsible | **A** = Accountable | **C** = Consulted | **I** = Informed

| Activity | CEO | COO | Capture | PM | SA | Finance | Contracts | HR | Delivery |
|----------|-----|-----|---------|----|----|---------|-----------|----|---------| 
| Opportunity ID | | | C | | | | | | | 
| Go/No-Go | **A** | R | R | | C | C | R | C | C |
| Gate 1 Decision | **A** | R | C | | | | C | | |
| Capture Plan | I | **A** | R | | R | C | C | C | C |
| Win Themes | I | **A** | R | | R | | | | C |
| Teaming Strategy | **A** | R | R | | C | C | R | | C |
| Kickoff Meeting | I | **A** | R | R | R | C | R | C | C |
| Compliance Matrix | | I | C | R | | | **A** | | |
| Technical Volume | | I | C | R | **A** | | C | | R |
| Pricing | **A** | R | C | | C | R | C | | |
| Red Team | I | **A** | I | R | R | | R | | R |
| Gold Team | **A** | R | R | | | R | R | | |
| Gate 3 Decision | **A** | R | C | | | C | R | | |
| Submission | **A** | R | R | R | | | R | | |

---

## Approval Authority Summary

| Decision | Authority |
|----------|-----------|
| All Gate decisions | CEO |
| P-0/P-1 promotion | CEO |
| Final submission | CEO |
| Teaming agreement | CEO |
| Rate exceptions | CEO |
| Margin below walk-away | CEO |

---

## Escalation Triggers

### Escalate Immediately

- FAR 52.219-14 cannot be satisfied
- P-0 deadline at risk
- Partner backs out after Gate 2
- Compliance issue discovered post-Red Team

### Get Approval Before

- Any Gate 1 decision
- Promote deal to P-0 or P-1
- Commit to bid on P-0
- Submit any proposal
- Sign or change teaming agreement
- Exceed rate bands or MAS ceilings
- Accept margin below minimum

---

# Quick Reference Card

## The Flow

```
1. QUALIFY → 2. CAPTURE → 3. BUILD → 4. SUBMIT → 5. WIN
```

## The Gates

| Gate | Question | Approver |
|------|----------|----------|
| **1** | Should we pursue? | CEO |
| **2** | Should we bid? | CEO |
| **3** | Should we submit? | CEO |

## The Teams

| Team | When | Focus |
|------|------|-------|
| Blue | Pre-RFP | Strategy |
| Pink | 30% | Compliance |
| Red | 70% | Content |
| Gold | 90% | Pricing |
| White | Final | Production |

## The Rules

- Prime Authority is non-negotiable
- FAR 52.219-14: Prime + SB ≥50% CoP
- Win themes: max 3, must have proof
- Never name competitors
- Never use ceiling values
- Every claim needs evidence

---

# End of Complete Reference

For quick-start workflows, see the **Quick Start Guide**.

For questions the agent can't answer, escalate to CEO.
