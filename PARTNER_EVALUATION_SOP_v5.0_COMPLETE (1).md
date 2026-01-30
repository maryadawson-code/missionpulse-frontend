# rockITdata PARTNER EVALUATION SOP
## Federal Health GTM & Partner Strategy System
**Version:** 5.0 | **Effective:** January 2026 | **Classification:** Internal Use Only

---

# TABLE OF CONTENTS

1. [Principles of Execution](#1-principles-of-execution)
2. [Workflow Overview](#2-workflow-overview)
3. [Quick Start Guide](#3-quick-start-guide)
4. [Project Instructions (Global Rules)](#4-project-instructions)
5. [Phase Prompts](#5-phase-prompts)
6. [Optional Prompts](#6-optional-prompts)
7. [Output Standards](#7-output-standards)
8. [Troubleshooting](#8-troubleshooting)
9. [Templates](#9-templates)
10. [Version History](#10-version-history)

---

# 1. PRINCIPLES OF EXECUTION

| # | Principle | Why It Matters |
|---|-----------|----------------|
| 1 | **Disqualify First** | Use Phase 0 to kill bad fits in 5 minutes. Don't waste cycles on obvious No-Gos. |
| 2 | **Freeze Assumptions** | Phase 1 facts are immutable. Changes require a logged justification. |
| 3 | **Trace Evidence** | Every claim tagged: [EVIDENCE], [INFERENCE], [PUBLIC], or [UNVERIFIED]. |
| 4 | **Outcome Validity** | Go, Conditional Go, and No-Go are equally valid. Protect the Growth Strategy over enthusiasm. |
| 5 | **The Year-2 Rule** | A deal must survive renewal, not just the pilot. Test for incentive divergence. |
| 6 | **20-Page Constraint** | If the CEO won't read it in one sitting, it's too long. Appendices support, not repeat. |

---

# 2. WORKFLOW OVERVIEW

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  PHASE 0    │───▶│  PHASE 1    │───▶│  PHASE 2    │───▶│  PHASE 3    │
│  Gate       │    │  Normalize  │    │  Strategy   │    │  Red Team   │
│  (5 min)    │    │  (15 min)   │    │  (30 min)   │    │  (20 min)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                                                         │
      │ FAIL = STOP                                            ▼
      │                                              ┌─────────────┐
      ▼                                              │  PHASE 4    │
┌─────────────┐                                      │  Executive  │
│  No-Go Doc  │                                      │  Package    │
│  (5 min)    │                                      │  (45 min)   │
└─────────────┘                                      └─────────────┘
                                                            │
                                                            ▼
                                                   ┌─────────────┐
                                                   │  PHASE 5    │
                                                   │  Lessons    │
                                                   │  (Optional) │
                                                   └─────────────┘
```

**Total Time (Full Evaluation):** 2-3 hours

**Decision Gates:**
- Phase 0 FAIL → Stop, document No-Go
- Phase 3 BLOCKING risks unresolvable → Stop, document No-Go
- Phase 4 complete → Ready for leadership decision

---

# 3. QUICK START GUIDE

## First-Time Setup

1. Create new Claude Project: **"rockITdata - Partner Evaluation"**
2. Copy **Section 4: Project Instructions** into Claude's Project Instructions field
3. Upload rockITdata Growth Strategy to Project Knowledge
4. Upload partner materials
5. Start with **Phase 0 prompt**

## What You Need Before Starting

| Required | Optional |
|----------|----------|
| Partner capability deck/materials | Prior contract documentation |
| rockITdata Growth Strategy (in Project) | Technical architecture docs |
| Basic partner background | Competitor analysis |

## Decision Rules

| Phase 0 Result | Action |
|----------------|--------|
| ELIGIBLE | Proceed to Phase 1 |
| NOT ELIGIBLE | Document No-Go, stop |

| Final Score | Rating | Action |
|-------------|--------|--------|
| 4.0 - 5.0 | GO | Proceed with standard teaming |
| 3.0 - 3.9 | CONDITIONAL GO | Proceed with blocking gates defined |
| 2.0 - 2.9 | HIGH RISK GO | Proceed only if strategic value outweighs risk AND gates clear |
| < 2.0 | NO-GO | Do not proceed without fundamental changes |

---

# 4. PROJECT INSTRUCTIONS

**Copy this entire block into Claude Project Instructions.**

```
ROLE: You are StratOps, the Senior Federal Health GTM & Partner Strategy Architect for rockITdata.

═══════════════════════════════════════════════════════════════
AUTHORITY HIERARCHY
═══════════════════════════════════════════════════════════════
1. rockITdata Growth Strategy (Project Memory) - Controlling
2. Non-public materials uploaded to Project - Authoritative  
3. Public sources (NDAA, DoD/DHA/VA releases) - Reference
4. Inference/hypothesis - Must be labeled clearly

Do not ask the user to restate information that exists in Project Memory.

═══════════════════════════════════════════════════════════════
ETHICS & PROCUREMENT INTEGRITY
═══════════════════════════════════════════════════════════════
- Do not suggest improper influence, backchannel actions, or anything that violates procurement integrity.
- If asked for tactics that risk impropriety, respond with a compliant alternative.

═══════════════════════════════════════════════════════════════
EVIDENCE TAGGING RULE (GLOBAL)
═══════════════════════════════════════════════════════════════
- Partner materials claims: [EVIDENCE: Phase1] or [UNVERIFIED]
- Government policy/funding/vehicles: [PUBLIC] or [INFERENCE]
- rockITdata strategy alignment: [STRATEGY]

═══════════════════════════════════════════════════════════════
CORE RULES
═══════════════════════════════════════════════════════════════

RULE 1: DECISION DISCIPLINE (Required)
Every major recommendation must include:
- Decision Owner (role, not name)
- Decision Timing (Now / FY26 / FY27)
- Cost of Delay
- Reversibility (Easy / Hard / One-way door)

RULE 2: OUTCOME VALIDITY
Go, Conditional Go, and No-Go are equally valid outcomes.
Recommend No-Go when evidence does not support execution.
Protect the Growth Strategy over enthusiasm.

RULE 3: PARTNER INCENTIVE TEST
For every partner, assess:
- What do they want from rockITdata?
- What risk do they expect us to carry?
- Where do incentives diverge in Year 2+?
- What is the access-flip risk?
Assume incentives diverge unless proven otherwise.

RULE 4: EXECUTIVE PACKAGE CONSTRAINT
Total deliverable (Brief + Appendices) should not exceed 20 pages.
If the CEO won't read it in one sitting, it's too long.

RULE 5: INTEGRATION REALITY CHECKS
For GENESIS: Write-back? CDS risk? Oracle workflow? ATO implications?
For JOMIS: DDIL capable? Latency tolerant? Training burden? Sustainment?
If proposal fails checks, flag with one-line verdict. Don't build analysis for obvious non-fits.

═══════════════════════════════════════════════════════════════
SYCOPHANCY BREAKER
═══════════════════════════════════════════════════════════════
- Do not praise the partner or assume competence. Default posture is skepticism until evidence is provided.
- Do not soften risks to be polite.
- A "No-Go" recommendation based on solid evidence is a successful outcome.

═══════════════════════════════════════════════════════════════
STYLE GUARDRAILS
═══════════════════════════════════════════════════════════════
FORBIDDEN WORDS: "Synergistic," "Holistic," "Best-in-Class," "Next-Gen," "Seamless," "Robust," "Leverage," "Ecosystem"
Replace with specific descriptive nouns and verbs.

No em dashes. No marketing language. Fact vs inference always distinguished.

═══════════════════════════════════════════════════════════════
MODES
═══════════════════════════════════════════════════════════════
- BUILDER: Produce structured deliverables
- RED-TEAM: Disqualify first, find gaps, assume failure
- HYBRID (default): Build → Red-Team → Revise → Final
```

---

# 5. PHASE PROMPTS

## PHASE 0: PARTNER ELIGIBILITY GATE

**Purpose:** Fast kill. 5 minutes. If they fail, stop.

**Prompt:**
```
MODE: BUILDER

Task: Partner Eligibility Gate (5-Minute Screen)

Partner: [NAME]
Materials: [LIST WHAT YOU UPLOADED]

Based ONLY on the partner's intro materials, answer:

1) Is there a credible federal health use case today (not speculative)?
2) Is there a plausible funding path in the next 12-18 months?
3) Does this require write-back into GENESIS or other regulated systems?
4) Are IP/data rights potentially incompatible with government ownership?
5) Does this appear to be a platform seeking validation vs a capability seeking scale?
6) Does this align with any rockITdata Growth Strategy offensive?

Output:
- Eligible for Full Evaluation: YES / NO
- If NO: State the single disqualifying reason.
- If YES: Which Growth Strategy offensive does this support?

Do not proceed to Phase 1 if NO.
```

**Decision Gate:** NO = Stop. Use No-Go Documentation prompt. YES = Proceed to Phase 1.

---

## PHASE 1: PARTNER NORMALIZATION

**Purpose:** Extract facts. No opinions. Freeze assumptions.

**Prompt:**
```
MODE: BUILDER

Task: Partner Normalization (No Strategy, No Recommendations)

Review the attached partner materials and extract a neutral, execution-focused inventory.

Rules:
- Do NOT evaluate, recommend, or speculate.
- If something is unclear, label it as [UNVERIFIED].
- Treat all materials as confidential.
- Tag all claims with source: [EVIDENCE: doc name, page] or [UNVERIFIED]

Produce the following:

1) CAPABILITY INVENTORY
- What the partner actually provides (Product vs Service) [CITE SOURCE]
- What is proven vs aspirational [CITE SOURCE]
- Current customers (federal vs commercial) [CITE SOURCE]

2) DATA RIGHTS & IP CHECK (CRITICAL)
- Who owns the data input? [CITE or "UNDEFINED"]
- Who owns the output/derivative models? [CITE or "UNDEFINED"]
- Are there restrictive licensing clauses?
- Is there university/government IP from prior R&D?

3) TECHNICAL DEPENDENCIES
- Platform dependencies (GENESIS, JOMIS, cloud, other)
- Government action dependencies (ATOs, authorizations)
- Integration requirements (APIs, data formats)

4) TEAM & CAPACITY
- Team size and key personnel
- Burn rate/runway (if known)
- Federal BD infrastructure (vehicles, certs, pricing)

5) FROZEN ASSUMPTIONS LIST
Number each assumption. These are now locked.
Any changes in later phases require a "Changed Assumption Log" entry.

No conclusions. No opinions. No GTM. Just facts.
```

**Output:** Normalized fact base. All subsequent phases reference this.

---

## PHASE 2: STRATEGY BUILD

**Purpose:** Build the GTM logic using Phase 1 facts only.

**Prompt:**
```
MODE: HYBRID

Task: Strategy Build for [PARTNER NAME]

ASSUMPTION FREEZE CHECK:
- Start with "Changed Assumption Log"
- If none changed: "No changes to Phase 1 assumptions."
- If changed: List (Old) → (New) + reason + evidence

CONSTRAINT: Use Phase 1 facts only. Do not introduce new claims without tagging [INFERENCE].

Produce the following sections:

SECTION 1: GTM ASSESSMENT & STRATEGIC ALIGNMENT
- Which rockITdata Growth Strategy offensive does this support? [STRATEGY]
- Verdict: Scalable platform play or niche point solution?
- What capability gap does this fill that we cannot build?

SECTION 2: THE ECONOMICS
- Services Wrap Ratio: Estimate range (1:1 to 1:4) [EVIDENCE or INFERENCE]
- Vehicle Constraint: Does likely vehicle cap services or push fixed-price? [PUBLIC/INFERENCE]
- "Resell Trap" Check: Is this low-margin pass-through? What must be true to avoid it?
- Pricing model fit for federal economics?

SECTION 3: INTEGRATION ANALYSIS
Run checks ONLY for systems with Growth Strategy alignment. One-line verdicts for non-fits.

For GENESIS (if applicable):
- How does it ingest Oracle Health data?
- Write-back required? CDS risk?
- "Data Gravity" problem: Must model live inside gov enclave?
- ATO implications and timeline?

For JOMIS/OpMed (if applicable):
- DDIL capable (Disconnected, Intermittent, Low-bandwidth)?
- Hardware profile: Laptop/tent ready or cloud-tethered?
- Training burden at Role 1-2?

For VA/IHS (if applicable):
- Mandate alignment? Funding path?

SECTION 4: FUNDING PATHS & USE CASES
- Specific funding sources: R&D (OTA), O&M, STRATFI [PUBLIC]
- 3 pitchable use cases with buyer and vehicle
- Timeline to first contract

SECTION 5: PARTNER INCENTIVE TEST
- What do they want from rockITdata?
- What risk do they expect us to carry?
- Where do incentives diverge in Year 2+?
- Access-flip risk assessment
- Best posture: Prime / JV / Sub?

SECTION 6: PRELIMINARY SCORECARD
Score each criterion (1-5) with one-line evidence:

| Criteria | Weight | Score | Evidence |
|----------|--------|-------|----------|
| GTM Maturity | 15% | | |
| GENESIS Integration | 20% | | |
| JOMIS Readiness | 15% | | |
| Governance & ATO | 20% | | |
| Funding Credibility | 15% | | |
| Incentive Alignment | 15% | | |
| **TOTAL** | 100% | | |

Preliminary Rating: [GO / CONDITIONAL / HIGH RISK / NO-GO]
```

---

## PHASE 3: RED TEAM

**Purpose:** Break the plan. Assume failure. Find kill conditions.

**Prompt:**
```
MODE: RED-TEAM

Task: Independent Red Team for [PARTNER NAME]

ASSUMPTION CHECK:
- Review Phase 2 assumptions
- If you disagree with any, log in "Changed Assumption Log"

INSTRUCTION: Ignore your prior recommendation. Wipe the slate clean. Assume the partnership will fail. Your job is to find out how.

Produce the following:

1) FAILURE MODE ANALYSIS
Identify 8-12 failure modes. For each:

| ID | Failure Mode | Probability | Impact | Exposure | Classification |
|----|--------------|-------------|--------|----------|----------------|
| RT-1 | [Description] | L/M/H | L/M/H/CRIT | $XXX | BLOCKING/MANAGEABLE |

2) THE "TROJAN HORSE" CHECK
- Does this partner genuinely need our capability, or just our vehicle/set-aside?
- If they get their own vehicle in 12 months, do they still need us?
- Are they using us for market validation before partnering with a larger prime?

3) THE YEAR-2 FAILURE TEST
- If Year 1 succeeds, what breaks in Year 2?
- Do incentives shift? (e.g., they take Prime role)
- What happens if they get acquired by a large integrator?
- What happens if key personnel leave?

4) INTEGRATION REALITY CHECK
- Hidden GENESIS/JOMIS/VA constraints not surfaced in Phase 2?
- ATO timeline vs contract period mismatch?
- Technical LOE underestimated?

5) BLOCKING VS MANAGEABLE CLASSIFICATION
- BLOCKING: Must resolve before proceeding. List specific gate questions.
- MANAGEABLE: Execution challenges with available mitigations.

6) KILL CONDITIONS
- What single fact would force immediate No-Go?
- What answer at a meeting triggers walk-away?

7) REVISED SCORE
- Does the recommendation survive red team?
- If score changes, document why.

Final Output:
- Confirmed or revised recommendation
- Top 2 blocking risks that must clear
- Kill questions for decision meeting
```

---

## PHASE 4: EXECUTIVE PACKAGE

**Purpose:** Produce decision-ready deliverables. Max 20 pages total.

**Prompt:**
```
MODE: BUILDER (Executive Communications)

Task: Executive Decision Package for [PARTNER NAME]

Input: Phase 1 facts, Phase 2 strategy, Phase 3 red team

CONSTRAINT: Total package must not exceed 20 pages. Appendices support the brief, not repeat it.

═══════════════════════════════════════════════════════════════
EXECUTIVE BRIEF (4 pages max)
═══════════════════════════════════════════════════════════════

PAGE 1: THE DECISION BOARD
- Header: Partner Name / Capability / Date / Data Confidence [High/Med/Low]
- BLUF: Recommendation [GO / CONDITIONAL GO / HIGH RISK GO / NO-GO]
- One-sentence rationale (quoted, memorable)
- Risk Profile: 3 boxes (Primary Risk / Procurement Friction / Kill Condition)
- Decision Requirements table (Owner / Timing / Cost of Delay / Reversibility)

PAGE 2: SCORECARD & INTEGRATION STATUS
- 6-criteria scorecard with scores and key findings
- Integration verdicts (GENESIS / VA / JOMIS) - one line each
- Funding paths table (Opportunity / Buyer / Vehicle / Timeline / Status)

PAGE 3: BATTLE CARD
- 5 kill questions with GOOD answer / BAD answer criteria
- What we offer (bullet list)
- What we need (bullet list)

PAGE 4: DECISION LOGIC
- Visual flowchart: If Q1=Good → If Q2=Good → AUTHORIZE [ACTION]
- If NO at any gate → STOP. NO-GO.
- Immediate next step if gates clear

═══════════════════════════════════════════════════════════════
APPENDICES (as needed, aim for 3-6 pages)
═══════════════════════════════════════════════════════════════

Include only what supports the brief. Combine related content.

A: Partner Evaluation Detail
- Expanded scorecard with evidence and gaps (if not clear from brief)

B: Red Team Failure Modes
- Blocking vs Manageable table
- Year-2 risk assessment
- Trojan Horse check results

C: Integration Analysis (only for fit systems)
- Technical deep-dive only if decision requires it

D: Evidence Classification
- Verified / Claimed / Blocking / Unknown
- Financial projection (pipeline, investment, ROI)

═══════════════════════════════════════════════════════════════
SUMMARY PAGE (1 page)
═══════════════════════════════════════════════════════════════

- Evidence snapshot (4 quadrants: Verified / Claimed / Blocking / Unknown)
- Financial summary (Investment required / Pipeline value / ROI)
- Immediate next step (bolded, specific)
- Window closing date (if applicable)

═══════════════════════════════════════════════════════════════
DESIGN SPECIFICATIONS
═══════════════════════════════════════════════════════════════

Apply rockITdata brand standards:
- Background: Deep Data Blue (#0d1117 or #181F27)
- Accent: Teal/Cyan (#00d4aa or #44C7F4)
- Alert/Risk: Red (#AF3026 or #f85149) - ONLY for No-Go, High Risk, Kill Conditions
- Warning: Yellow/Amber (#d29922 or #F0A202)
- Success: Green (#3fb950 or #238636)
- Typography: Clean sans-serif, 12pt minimum body text
- Tables: Dark background, light borders, adequate padding

Match tone to audience:
- Executive brief: Conversational, direct
- "Quick version" > "Executive Summary"
- If they won't read a book, don't write one
```

---

## PHASE 5: LESSONS LEARNED (Optional)

**Purpose:** Train the agent. Invoke only on request to close a project.

**When to Use:**
- After completing full evaluation cycle
- When deliverables required significant rework
- User explicitly requests retrospective

**Prompt:**
```
MODE: BUILDER

Task: Lessons Learned - Project Training

Evaluation completed: [PARTNER NAME]

Analyze this sprint and answer:

1) What rules helped us most?
   - List 2-4 rules with specific examples of impact

2) What rules slowed us down?
   - List 1-3 rules that created friction or redundancy

3) What assumptions proved unnecessary?
   - What did we analyze that didn't change the recommendation?

4) What should be REMOVED from this SOP next time?
   - Specific deletions with rationale

5) Did any phase produce redundant insight?
   - Identify overlapping sections or duplicated analysis

Output:
- 3 rules to keep (with why)
- 2 rules to remove (with why)
- 1 new rule to add (with rule text)

Produce a block titled: "PROPOSED UPDATES TO SOP vNext"
```

---

# 6. OPTIONAL PROMPTS

Use these for specific situations outside the standard flow.

## Quick Score (Skip Full Evaluation)
```
MODE: BUILDER

Quick Score: [PARTNER NAME]

Score all 6 criteria (1-5) with one-line evidence each.
No deep analysis. No appendices. Max 2 pages.

Output:
- Scorecard table
- Total score and rating
- Top concern
- Recommended next step (Full evaluation / Pass / Revisit in X months)
```
**Use when:** Time-constrained, preliminary screen only

---

## Integration-Only Analysis
```
MODE: BUILDER

Integration Analysis: [PARTNER NAME] for [SYSTEM]

Run full integration reality checks for [GENESIS / VA / JOMIS].

Output:
- Feasibility verdict (Executable / Conditional / Not Executable)
- Timeline estimate
- Top 3 technical risks
- Development LOE estimate
- ATO pathway and timeline
```
**Use when:** Partner passed screen, need technical deep-dive

---

## Competitive Positioning
```
MODE: BUILDER

Competitive Analysis: [PARTNER NAME]

1) Who else does what this partner does?
2) What is their moat vs competitors?
3) Why would government choose them over alternatives?
4) What would make rockITdata choose a competitor instead?
5) Risk of competitor signing exclusive first?
```
**Use when:** Need to validate differentiation claims

---

## Meeting Prep (Battle Card Only)
```
MODE: BUILDER

Meeting Battle Card: [PARTNER NAME]

Produce 1-page battle card only:
- Recommendation (one line)
- Score (X.XX / 5.00)
- 5 kill questions with good/bad answer criteria
- Decision logic (If X then Y)
- What we offer / What we need

Format for printing. No preamble. No appendices.
```
**Use when:** Meeting scheduled, full package already exists

---

## No-Go Documentation
```
MODE: BUILDER

No-Go Documentation: [PARTNER NAME]

Document why we are not proceeding:

1) What was evaluated (scope)
2) What disqualified them (specific evidence)
3) Phase where disqualification occurred
4) What would change the assessment
5) Recommendation to revisit? (Yes/No + timeframe)

Max 1 page. Archive for future reference.
```
**Use when:** Declining a partner at any phase, need documentation

---

## Partner Comparison
```
MODE: BUILDER

Partner Comparison: [PARTNER A] vs [PARTNER B]

Both partners address: [CAPABILITY GAP]

Compare across all 6 criteria with side-by-side scores.

Output:
- Comparison scorecard table
- Key differentiators (3-5 bullets)
- Recommended choice with rationale
- What would flip the recommendation
```
**Use when:** Evaluating multiple partners for same capability

---

## Email Draft
```
MODE: BUILDER

Email to [RECIPIENT] re: [PARTNER NAME]

Context: [BRIEF CONTEXT - e.g., "Sending evaluation package before CEO meeting"]

Write email matching this tone: [PASTE EXAMPLE OR DESCRIBE]

Include:
- Personal context (if provided)
- "Quick version" summary (score, why interesting, why cautious)
- Key questions to ask
- What happens if gates clear
- Attachment reference

Keep it tight. No formal language. Write like talking to a colleague.
```
**Use when:** Need cover email for deliverables

---

# 7. OUTPUT STANDARDS

## Evidence Tagging

| Tag | Meaning | Example |
|-----|---------|---------|
| [EVIDENCE: Phase1] | Traceable to partner materials | "SANTOS has 215 DOF [EVIDENCE: Phase1, Capabilities Deck p.3]" |
| [PUBLIC] | Supported by public source | "OPMED PAE chartering Jan-Apr 2026 [PUBLIC: DHA announcement]" |
| [INFERENCE] | Logical conclusion, not proven | "Integration LOE likely 12+ months [INFERENCE]" |
| [UNVERIFIED] | Claimed but not confirmed | "iPredict validated by ONR [UNVERIFIED]" |
| [STRATEGY] | Aligned to Growth Strategy | "Supports Offensive 01: DHA Expansion [STRATEGY]" |

## Formatting Rules

| Do | Don't |
|----|-------|
| Clear headers and bullets | Walls of text |
| Tables for comparisons | Narrative comparisons |
| Short paragraphs (3-4 sentences) | Long paragraphs |
| 12pt minimum font | Tiny unreadable text |
| Specific numbers and dates | Vague timeframes |
| Plain language | Marketing speak |

## Forbidden Words

Never use: "Synergistic," "Holistic," "Best-in-Class," "Next-Gen," "Seamless," "Robust," "Leverage," "Ecosystem," "Cutting-edge," "Revolutionary"

Replace with specific descriptive language.

## Required Endings

Every major output ends with:
1. **Next actions (7-30 days)** - Specific, assigned
2. **Key assumptions to validate** - What could change the recommendation
3. **Decisions required** - Owner + timing + cost of delay

## File Naming

```
[PartnerName]_[DocumentType]_[Status].pdf

Examples:
iHuman_Executive_Package_FINAL.pdf
Acme_Initial_Assessment_v1.pdf
TechCorp_NoGo_Documentation.pdf
```

---

# 8. TROUBLESHOOTING

## Common Issues & Fixes

### Output is too long (30+ pages)
**Fix:**
- Remind agent of 20-page constraint
- Prompt: "Consolidate to max 20 pages. Combine redundant sections."
- Check if appendices repeat brief content
- Use one-line verdicts for non-fit systems

### Recommendation is wishy-washy ("It depends...")
**Fix:**
- Invoke RED-TEAM mode explicitly
- Ask: "If you had to decide today with no more information, what's the call?"
- Check if Decision Discipline was applied
- Force a score and rating

### Score doesn't match recommendation
**Fix:**
- Review scoring interpretation table
- Ask: "Reconcile the score with the recommendation. What gates must clear?"
- May need "High Risk Conditional Go" framing

### Missing Growth Strategy alignment
**Fix:**
- Confirm Growth Strategy is in Project Knowledge
- Prompt: "Re-evaluate alignment to rockITdata Growth Strategy offensives 1-3"
- Explicitly ask which offensive this supports

### Integration analysis is superficial ("FHIR compatible")
**Fix:**
- Run Integration Reality Checks explicitly
- Ask: "What specific technical work is required? Who does it? What's the LOE?"
- Request timeline and ATO pathway

### Red team didn't find real risks
**Fix:**
- Re-run with: "You are trying to disqualify this partner. What kills the deal?"
- Ask for financial exposure estimates
- Require "blocking vs manageable" classification
- Ask for Year-2 failure scenario

### Agent is too positive (sycophancy)
**Fix:**
- Remind of Sycophancy Breaker rule
- Prompt: "What would a skeptical federal evaluator say about this?"
- Ask: "What's the strongest argument against this partnership?"

### Evidence tags missing
**Fix:**
- Prompt: "Re-tag all claims with [EVIDENCE], [PUBLIC], [INFERENCE], or [UNVERIFIED]"
- Check Phase 1 normalization was completed
- Ask for source citations

### Tone is too formal
**Fix:**
- Include example of desired tone
- Add: "Match this tone: [paste example]"
- For emails: "Write like talking to a colleague, not a board"

### Agent keeps asking for information it has
**Fix:**
- Check Project Knowledge uploads
- Prompt: "Search Project Knowledge for [topic] before asking"
- Restart conversation if context corrupted

## Escalation Paths

| Situation | Action |
|-----------|--------|
| Agent hallucinates facts | Flag assumption, request source, verify independently |
| Recommendation conflicts with Growth Strategy | Escalate to leadership with explicit conflict noted |
| Technical claims unverifiable | Mark as [UNVERIFIED], flag for partner clarification |
| Partner provides contradictory information | Document both versions, flag for meeting clarification |
| Blocking risk discovered late | Re-run Phase 3, update recommendation |

---

# 9. TEMPLATES

## A. Scorecard Template

```markdown
## PARTNER SCORECARD: [NAME]

| Criteria | Weight | Score | Evidence | Gap |
|----------|--------|-------|----------|-----|
| GTM Maturity | 15% | X.X | [SOURCE] | |
| GENESIS Integration | 20% | X.X | [SOURCE] | |
| JOMIS Readiness | 15% | X.X | [SOURCE] | |
| Governance & ATO | 20% | X.X | [SOURCE] | |
| Funding Credibility | 15% | X.X | [SOURCE] | |
| Incentive Alignment | 15% | X.X | [SOURCE] | |
| **TOTAL** | **100%** | **X.XX** | | |

**Rating:** [GO / CONDITIONAL GO / HIGH RISK GO / NO-GO]
```

---

## B. Decision Discipline Template

```markdown
## DECISION REQUIREMENTS

| Element | Value |
|---------|-------|
| **Decision Owner** | [Role] |
| **Decision Timing** | [Now / FY26 / FY27] |
| **Cost of Delay** | [What happens if we wait] |
| **Reversibility** | [Easy / Hard / One-way door] |
| **Immediate Next Step** | [Specific action] |
```

---

## C. Failure Mode Template

```markdown
## FAILURE MODE: RT-[X]

**Description:** [What goes wrong]

| Attribute | Value |
|-----------|-------|
| Probability | [Low / Medium / High] |
| Impact | [Low / Medium / High / Critical] |
| Financial Exposure | [$XXX-XXX] |
| Classification | [BLOCKING / MANAGEABLE] |

**Mitigation:** [How to reduce risk]

**Gate Question:** [What to ask to resolve]
```

---

## D. Evidence Classification Template

```markdown
## EVIDENCE CLASSIFICATION

### ✓ Verified
- [Item] [EVIDENCE: source]

### ○ Claimed (Unverified)
- [Item] [UNVERIFIED]

### ✗ Blocking (Must Resolve)
- [Item] - Required before proceeding

### ? Unknown
- [Item] - No information available
```

---

## E. Battle Card Template

```markdown
## MEETING BATTLE CARD: [PARTNER NAME]

**Recommendation:** [One line]
**Score:** X.XX / 5.00 ([RATING])

### KILL QUESTIONS

**Q1: [Topic]**
"[Exact question to ask]"
| GOOD | BAD |
|------|-----|
| [Answer that clears gate] | [Answer that triggers No-Go] |

[Repeat Q2-Q5]

### DECISION LOGIC
```
Q1 = GOOD? ──NO──> STOP. NO-GO.
    │
   YES
    ↓
Q2 = GOOD? ──NO──> STOP. NO-GO.
    │
   YES
    ↓
AUTHORIZE: [Next step]
```

### WHAT WE OFFER
- [Bullet]
- [Bullet]

### WHAT WE NEED
- [Bullet]
- [Bullet]
```

---

## F. Email Template

```markdown
Hey [Name],

[Personal context]

---

**THE QUICK VERSION**

Score: **X.XX/5.00 - [RATING]**

**Why it's interesting:** [1-2 sentences]

**Why I'm cautious:** [1-2 sentences]

**Questions to ask at the meeting:**
1. [Question] (If no = walk)
2. [Question] (If no = walk)

Both clear? [Next step].

---

**Attachment:** [Filename] (XX pages)
- Pages 1-4: Executive Brief
- Pages 5-XX: Appendices

---
```

---

## G. No-Go Documentation Template

```markdown
## NO-GO DOCUMENTATION: [PARTNER NAME]

**Date:** [Date]
**Evaluated By:** [Name/Role]
**Phase Reached:** [0/1/2/3]

### What Was Evaluated
[Brief scope description]

### Disqualifying Factor
[Specific evidence-based reason]

### What Would Change This Assessment
[Conditions that would warrant re-evaluation]

### Recommendation to Revisit
[ ] Yes - Timeframe: [When]
[ ] No - Reason: [Why permanent No-Go]

---
*Filed for future reference*
```

---

# 10. VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 4.3 | Jan 2026 | Design-Integrated Edition: Added Phase 4.5 visual specs, brand standards |
| 5.0 | Jan 2026 | Post-iHuman Sprint Consolidation |

**v5.0 Changes:**
- Merged Phase 3.5 (Visual Synthesis) and Phase 4.5 (Design Spec) into Phase 4
- Removed fixed appendix taxonomy (A-H) → flexible "as needed" structure
- Added 20-page executive package constraint
- Added Partner Incentive Test as core rule
- Made Phase 5 (Lessons Learned) explicitly optional
- Added comprehensive troubleshooting section
- Added optional prompt library for edge cases
- Streamlined non-fit system analysis (one-line verdicts)
- Added evidence tagging requirements throughout
- Consolidated templates into single reference section

---

**END OF SOP v5.0**

*For questions, updates, or feedback: Strategic Operations*
