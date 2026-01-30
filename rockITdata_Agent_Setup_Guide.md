# rockITdata Agent Clone Setup Guide
## Complete Instructions for Replicating This Agent

---

## What You Need

To fully clone this agent, you need THREE things:

| Component | Purpose | File |
|-----------|---------|------|
| **Project Instructions** | The system prompt that defines agent behavior | `rockITdata_Project_Instructions_EXACT.md` |
| **Project Knowledge** | Documents the agent references for facts | See list below |
| **Memory Context** | Persistent facts about the company and user | See Section 3 |

---

## Step 1: Create a New Claude Project

1. Go to claude.ai
2. Click "Projects" in the sidebar
3. Click "Create Project"
4. Name it: `rockITdata Capture & Proposal`

---

## Step 2: Add Project Instructions

1. In your new project, click the **gear icon** (Settings)
2. Find **"Custom Instructions"** or **"Project Instructions"**
3. Copy the ENTIRE contents of `rockITdata_Project_Instructions_EXACT.md`
4. Paste into the custom instructions field
5. Save

---

## Step 3: Upload Project Knowledge Files

Upload these files to your project's knowledge base. These are the authoritative sources the agent references:

### Required Files (Core Operations)
- `rockITdata_Capture_Proposal_Training_Package_v1.docx` — Master training document
- `rockITdata_BOE_Pricing_Model_Branded.xlsx` — Pricing template
- `12.0 New Position Family and Bill Rate Bands 2025.xlsx` — Rate bands
- `0ZYBMR_3VOOHF_GS-00F-243DA_PS0052AUTHPRICELIST.docx` — GSA MAS price list
- `past_performance.xlsx` — Past performance references

### Required Files (Templates)
- `rockITdata_GoNoGo_Checklist_Template.docx`
- `rockITdata_Kickoff_Agenda_Template.docx`
- `rockITdata_Proposal_Schedule_Template.docx`
- `rockITdata_RedTeam_Evaluation_Form.docx`
- `rockITdata_Compliance_Matrix_Template.docx`
- `rockITdata_GoldTeam_Pricing_Checklist.docx`
- `rockITdata_RACI_Matrix.docx`

### Required Files (Strategy)
- `rockITdata_2026_Growth_Strategy_COMPREHENSIVE_v2.docx`
- `2026_MHS_Strategy_COMPREHENSIVE.docx`
- `rockITdata_Pipeline_Master_2026.xlsx`

### Required Files (Partner Playbooks)
- `AFS_Mentor_Alignment_Analysis.docx`
- `GDIT_Strategic_Partner_Alignment.docx`
- `LMI_Strategic_Partner_Alignment_Analysis.docx`
- `Oracle_Health_Partner_Alignment.docx`
- `TriWest_Partner_Alignment.docx`

### Reference Files (Guides)
- `Proposal_Agent_Quick_Start_Gamma.md`
- `Proposal_Agent_Complete_Reference_Gamma.md`
- `rockITdata_Capture_Proposal_User_Guide.docx`
- `rockITdata_Agent_Guide_Apple_Style.docx`

---

## Step 4: Configure Memory (Optional but Recommended)

If your Claude project supports memory, add these key facts. Otherwise, include them in a `Company_Facts.md` file uploaded to project knowledge:

```
Company: rockITdata, LLC
Status: WOSB, SDVOSB
UEI: TUXGLCLFM2L2
CAGE: 85AJ9
GSA MAS: GS-00F-243DA

Leadership:
- CEO: Marlie Andersch
- President: Daniel Thode
- Federal Civilian Account Lead: Mary

Core Team:
- Camryn (HR/People Ops)
- Ernie (Finance)
- Seth (Delivery)
- Patrick (Contracts)
- Anna Maria (Proposal Manager)

Strategic Focus:
- Oracle Triad: VA, DHA, IHS
- Four Lanes: VA Scale (55-60%), DHA Prime (20-25%), CMS/IHS Wedges (10-15%), Human Performance + OpMed (5-10%)
- Target: $50M ARR by November 2026

Key Partners:
- AFS (Mentor-Protégé)
- TriWest
- GDIT
- LMI
- Oracle Health
- Agile4Vets (A4V)

Compliance Rules:
- FAR 52.219-14: >50% Cost of Personnel for SDVOSB/WOSB set-asides
- Large subs capped at 40% CoP (target <35%)
- Margin target: 15%, minimum: 8%, walk-away: 6%

Pricing Defaults:
- OH: 15%
- G&A: 8%
- Fee: 10%
- Annual escalation: 3%

Gate Approvals:
- CEO signs at Gate 1, Gold Team, and Final Submission
- All P-0 bid decisions require CEO approval
- All teaming agreements require CEO approval
```

---

## Step 5: Test the Clone

Start a new conversation in your project and run these test prompts:

### Test 1: Role Check
```
I have an RFP for DHA data governance. Are we ready to review it?
```
**Expected:** Agent should ask "Are we PRIME or SUB?"

### Test 2: Gate 1
```
Run Gate 1 for this opportunity: VA EHRM training support, $2M ceiling, SDVOSB set-aside
```
**Expected:** Agent should evaluate against strategic fit, eligibility, vehicle access, and FAR 52.219-14 feasibility

### Test 3: Compliance Check
```
Calculate Cost of Personnel: rockITdata $500K, Small sub $300K, Large sub $400K
```
**Expected:** Agent should flag this as a WARNING (Prime + SB = 67%, but Large sub at 33% is in warning zone)

### Test 4: Writing Standards
```
Draft a win theme for our adoption analytics capability
```
**Expected:** Agent should produce Feature → Benefit → Proof structure with no banned phrases

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Agent doesn't ask about role | Instructions not loaded | Re-paste project instructions |
| Agent invents past performance | Knowledge files missing | Upload PP references |
| Agent uses wrong rates | Rate bands not uploaded | Upload rate bands spreadsheet |
| Agent allows banned phrases | Instructions incomplete | Check for full Section III.2 |
| No Safety Stack in output | Instructions incomplete | Check for full Section IV |

---

## What Makes This Agent Different

This agent is NOT a generic proposal writer. It enforces:

1. **Hard Gates** — Won't draft content until role and inputs are confirmed
2. **Evidence Discipline** — Every claim needs Feature → Benefit → Proof
3. **Financial Guardrails** — Enforces rate ceilings, margin floors, FAR 52.219-14
4. **Mandatory Artifacts** — Every output includes Deal Terms, Risk Register, Compliance Matrix
5. **No Invented Facts** — Uses [UNKNOWN] placeholders instead of hallucinating

Your coworkers will need to adapt to this discipline. The agent will push back if they try to skip steps or make unsupported claims.

---

## Questions?

If the clone isn't behaving correctly, check:
1. Did you paste the FULL project instructions?
2. Did you upload the rate bands and past performance files?
3. Are you starting prompts with role context (Prime/Sub)?

The agent is designed to be strict. That's the point.
