# Proposal Agent
## Quick Start Guide

---

Everything you need to run a proposal independently.

For comprehensive procedures, see the **Complete Reference**.

**The Flow:**
1. QUALIFY → 2. CAPTURE → 3. BUILD → 4. SUBMIT

---

# When to Escalate

Handle everything else yourself.

## Get approval before you:

- Make any Gate 1 decision (GO/NO-GO/DORMANT)
- Promote a deal to P-0 or P-1
- Commit to bid on any P-0
- Submit any proposal
- Sign or change a teaming agreement
- Exceed rate bands or MAS ceilings

## Escalate immediately if:

- FAR 52.219-14 can't be satisfied with any staffing design
- A P-0 deadline is at risk
- A partner backs out after Gate 2

> **Everything else? You've got this.**

---

# Your First 5 Minutes

⏱ About 5 minutes

## What you do:

1. Drag your RFP into the chat
2. Type this prompt:

```
What do I need to know about this RFP?
```

3. Read the response

## What the agent does:

Analyzes the document and extracts key facts

## What you get:

Summary with dates, value, set-aside, incumbent, and fit assessment

### Example Output

```
Solicitation: 75FCMC25R0012
Agency: CMS/CCSQ
Value: $45M ceiling, estimate $8-12M sub-slice
Set-aside: 8(a) competitive
Vehicle: CMS SPARC
Incumbent: Acme Corp (since 2019, $32M to date)

FIT: CONDITIONAL
Strong OCM alignment, but need past performance in fraud analytics to clear Gate 1.

ACTION: Upload PP references.
```

> ⚠️ The agent only knows what it can see. Upload everything—RFP, amendments, Q&A, teaming notes.

---

# Understanding Labels

Every fact gets tagged. Here's what they mean.

| Label | Meaning | Action |
|-------|---------|--------|
| **FACT** | Confirmed in documents | None needed |
| **ASSUMPTION** | Reasonable inference | Verify before Gate 2 |
| **UNKNOWN** | Not in any document | Find before proceeding |

## Too many UNKNOWNs?

Upload more evidence, then ask again:

- **SAM.gov notice** → solicitation details
- **USAspending export** → incumbent history
- **Agency forecast** → timeline

```
Re-check the facts with these new documents.
```

---

# Phase 1: Qualify

⏱ 15–30 minutes

**Should we pursue this opportunity?**

## What you do:

1. Upload RFP and past performance list
2. Run Gate 1:

```
Run Gate 1. Is this a GO, CONDITIONAL, NO-GO, or DORMANT?
```

## What the agent does:

Scores fit across 6 factors, identifies gaps

## What you get:

Recommendation with action items

---

## What Happens Next

### GO
Proceed to Capture. This fits our capabilities.

### CONDITIONAL
Fits with caveats. Resolve the listed items, then proceed.

### NO-GO
Doesn't fit. Kill the opportunity.

### DORMANT
Not ready now. Monitor for trigger event, then re-evaluate.

---

### Example: Gate 1 Result

```
RECOMMENDATION: CONDITIONAL

✓ Set-aside: 8(a) — we qualify
✓ Vehicle: CMS SPARC — we're on it
✓ Scope: OCM + analytics — core capability
⚠ Past performance: Need fraud-specific reference
⚠ Teaming: No analytics sub identified

ACTION: Partner with Acme Analytics (8(a)) to close PP gap.
Clear by Jan 20 or downgrade to NO-GO.
```

---

# Phase 2: Capture

⏱ 1–2 hours

**How do we win this?**

---

## Create Win Themes

Win themes are what evaluators remember. You need exactly three.

```
Develop 3 win themes. Structure: what we do → why it matters → proof.
```

### Example: Win Theme

> rockITdata's Adoption Analytics platform reduces EHR adoption timelines by 40%, validated by 94% clinician satisfaction across 13 VA medical centers and 12,000+ users.

---

## Create Ghost Strategies

Highlight competitor weaknesses without naming them.

```
Create ghost strategies against likely competition.
```

> ⚠️ Never name competitors. Use "traditional approaches" or "legacy methods."

---

## Confirm Bid Decision

```
Run Gate 2. Am I ready to bid?
```

**Agent verifies:**
- All UNKNOWNs resolved
- Win themes locked
- Teaming confirmed
- Pricing viable

> 🔴 **ESCALATE:** Gate 2 BID decision on P-0 requires CEO approval

---

# Phase 3: Build

⏱ 4–8 hours

**Write and price the proposal.**

---

## Start with Compliance

Map every requirement before you write anything.

```
Build compliance matrix from Section L. Map to Section M factors.
```

### Example: Compliance Matrix Row

```
L.5.2.1: "Describe approach to training end users"
→ Maps to: M.2 (Technical Approach)
→ Weight: High
→ Volume 1, Section 3.2
→ Page allocation: 2 pages
→ Owner: [Your name]
```

---

## Draft the Volumes

### Technical Approach

```
Draft Technical Approach. Map to PWS tasks. Embed win themes.
```

### Management Approach

```
Draft Management Approach. Org chart, reporting, QA, risk.
```

### Staffing Plan

```
Create staffing plan. Roles, FTEs, key personnel, 90-day transition.
```

> 💡 For AI claims, the agent automatically adds continuity language about parallel operations.

---

## Price It

1. Upload rate bands spreadsheet
2. Run:

```
Build pricing. Use my rate bands. OH 15%, G&A 8%, Fee 10%, 3% escalation.
```

**You get:** Labor mix, rates, totals, and margin calculation

---

## Run Compliance Checks

```
Check rates against rate bands and MAS ceilings.
```

```
Calculate Cost of Personnel. Is FAR 52.219-14 satisfied?
```

### Example: 52.219-14 Check

```
COST OF PERSONNEL ANALYSIS

Prime (rockITdata):     $2.1M  (42%)
SB Subs:                $1.2M  (24%)
Large Subs:             $1.7M  (34%)

Prime + SB = 66% ✓ COMPLIANT (minimum 50%)
Large Sub CoP = 34% ✓ SAFE (flag at >40%)
```

---

## If Something Fails

| Problem | Solution |
|---------|----------|
| Rate above band | Negotiate with sub or find replacement |
| Rate above MAS | Remap to different labor category |
| 52.219-14 violation | Redesign staffing—shift work from Large to Prime/SB |

> 🔴 **ESCALATE:** If no staffing design satisfies 52.219-14

---

# Phase 4: Submit

⏱ 2–4 hours

**Review, fix, and get it out the door.**

---

## Red Team (Content Review)

```
Run Red Team. Score each Section M factor. Give me the fix list.
```

**You get:** Scorecard + prioritized list of fixes

### Example: Red Team Finding

```
SECTION 3.2 — Technical Approach to Training
Score: Acceptable (target: Good)

Weakness: Describes training methodology but lacks
metrics proving effectiveness. Evaluator cannot
differentiate from competitors.

FIX: Add "94% clinician satisfaction" proof point.
Reference VA OCM contract CLIN 3 deliverable.
```

---

## Fix the Issues

Address each item on the fix list:

```
Rewrite Section 3.2 to address this weakness: [paste it]
```

---

## Gold Team (Pricing Review)

```
Run Gold Team on pricing. Verify rates, margins, compliance.
```

---

## Final Check

```
Run Gate 3. Am I ready to submit?
```

### Submission Checklist

- [ ] Compliance matrix 100% complete
- [ ] All page counts within limits
- [ ] All attachments present
- [ ] Pricing passes all checks
- [ ] CEO sign-off obtained

> 🔴 **ESCALATE:** Final submission requires CEO approval. Send Gate 3 output.

---

# Partners

⏱ 15 minutes per meeting

**Get commitments you can count on.**

After every partner call:

```
Process these meeting notes from [Partner Name].
```

---

## The 5 Required Outputs

| # | Field | What it means |
|---|-------|---------------|
| 1 | **Deal lanes** | Which opportunities they'll support |
| 2 | **Role split** | Who leads, who supports |
| 3 | **Staffing ×2** | Two named roles with FTEs and timing |
| 4 | **Access** | Customer intros with dates |
| 5 | **Next step** | Action + deadline + kill condition |

---

## Missing Outputs?

The agent generates follow-up questions. Send them.

**Don't mark a partner COMPLETE until all 5 are populated.**

> ⚠️ Partners with uncleared gates are capped at 30% pWin. Set deadlines.

---

# Quick Fix

Problem → Solution. No explanation needed.

| Problem | Solution |
|---------|----------|
| Too many UNKNOWNs | Upload SAM.gov, USAspending, forecast. Re-run fact check. |
| Compliance matrix wrong | Upload full RFP + amendments. Re-extract Section L. |
| Agent using ceilings | Say: "This is IDIQ. Use sub-slice target $[X]M." |
| Marketing language | Say: "Rewrite. Every claim needs proof." |
| Rate above band | Negotiate with sub or replace. |
| Rate above MAS | Remap labor category. Escalate if stuck. |
| 52.219-14 fail | Redesign staffing. Escalate if no design works. |
| Partner won't commit | Set deadline. If missed, mark INCOMPLETE. Find alternative. |
| Page count wrong | Say: "Reallocate. Cut low-weight sections first." |
| Weak Red Team score | Say: "Rewrite [section] to address: [weakness]" |

---

# Quick Reference

**Keep this at your desk.**

---

## The Prompts

**Intake**
```
What do I need to know about this RFP?
```

**Gate 1**
```
Run Gate 1. GO, CONDITIONAL, NO-GO, or DORMANT?
```

**Win Themes**
```
Develop 3 win themes. What we do → why it matters → proof.
```

**Gate 2**
```
Run Gate 2. Am I ready to bid?
```

**Compliance**
```
Build compliance matrix from Section L. Map to Section M.
```

**Pricing**
```
Build pricing. Use my rate bands. OH 15%, G&A 8%, Fee 10%.
```

**52.219-14**
```
Calculate Cost of Personnel. Is FAR 52.219-14 satisfied?
```

**Red Team**
```
Run Red Team. Score Section M factors. Give me the fix list.
```

**Gate 3**
```
Run Gate 3. Am I ready to submit?
```

---

## Escalate Only For

- Gate 1 decisions
- P-0 bid decisions
- Final submissions
- Teaming agreements
- Rate exceptions
- Unsolvable compliance failures

---

# You've got this.

Upload the documents.
Run the prompts.
Follow the flow.

**The agent handles the rest.**
