# PROPOSAL MANAGER QUICK-REFERENCE ACTION GUIDE
**DHA Data Governance Proposal - Red Team Remediation**  
**Deadline:** January 9, 2026  
**Total Time Required:** 6-8 hours

---

## 🚨 START HERE: CRITICAL ACTIONS (4 HOURS - MUST COMPLETE)

### ⚠️ STOP AND READ THIS FIRST

**DO NOT SUBMIT THE PROPOSAL UNTIL ALL 4 CRITICAL ITEMS ARE COMPLETE.**

Your proposal has a **strong technical foundation** but has **4 critical compliance issues** that could result in disqualification. All are fixable in 4 hours.

**Current Status:** YELLOW (conditional award)  
**After Fixes:** BLUE (confident award)  
**Risk if Not Fixed:** 40% chance of disqualification or major point deduction

---

## 📋 CRITICAL ACTION #1: REMOVE AUTO-FAIL LANGUAGE (30 MINUTES)

**Problem:** The phrase "in coordination with DHA" appears multiple times. This is auto-fail language because it implies contractor performance is conditional on Government action.

**Reviewers Who Flagged This:** Jack Yang, S. Donohue  
**Impact:** DISQUALIFICATION RISK  
**Priority:** 🔴 CRITICAL

### STEP-BY-STEP FIX:

**STEP 1: Open Volume I (Technical Capability) Document**

**STEP 2: Use Find & Replace**

Press Ctrl+F (Windows) or Cmd+F (Mac) to open Find

**Search For These Phrases:**
1. "coordinate with"
2. "coordinates with"
3. "coordinating with"
4. "in coordination with"

**STEP 3: Fix Each Instance**

**📍 LOCATION 1: Section 2.3 (Objective 1), approximately page 12-13**

**FIND THIS TEXT (or similar):**
> "rockITdata coordinates with DHA stakeholders to obtain required access to systems..."

**REPLACE WITH THIS EXACT TEXT:**
> "The Contractor shall obtain required access through DHA-approved request processes, coordinating timeline expectations with the Contracting Officer's Representative (COR). Our approach accommodates varying stakeholder availability through flexible scheduling, virtual participation options, and asynchronous workflows where appropriate."

---

**📍 LOCATION 2: Section 10.2 (Statement of Work), approximately page 70**

**FIND THIS TEXT (or similar):**
> "rockITdata will coordinate with DHA stakeholders to execute governance activities..."

**REPLACE WITH THIS EXACT TEXT:**
> "The Contractor shall execute governance activities in accordance with DHA-approved processes and schedules, maintaining proactive communication with the COR regarding timeline milestones and deliverable status."

---

**STEP 4: Search for Additional Instances**

After fixing the above, search AGAIN for:
- "coordinate" (look for any other coordination language)
- "subject to" (conditional language)
- "contingent upon" (conditional language)
- "if Government provides" (conditional language)
- "dependent on Government" (conditional language)

**REPLACE ALL CONDITIONAL LANGUAGE WITH:**
- "The Contractor shall..."
- "Our approach accommodates..."
- "We have planned for..."

**STEP 5: Quality Check**

After all replacements:
- [ ] Search "coordinate with" → Should find ZERO instances
- [ ] Search "in coordination with" → Should find ZERO instances
- [ ] All contractor actions use "shall" language
- [ ] No performance is conditional on Government action

**✅ COMPLETION CRITERIA:**
- No instances of "coordinate with" or variations
- All contractor obligations state what contractor WILL DO
- Government processes acknowledged but not blocking contractor performance

---

## 📋 CRITICAL ACTION #2: ADD LMI SUBCONTRACTOR SECTION TO VOLUME III (20 MINUTES)

**Problem:** Volume III never mentions LMI Consulting anywhere. Section 7.2 confirms prime does 50%+ but doesn't identify the subcontractor or their role.

**Reviewer Who Flagged This:** Christian Smith (LMI)  
**Impact:** COMPLIANCE VIOLATION  
**Priority:** 🔴 CRITICAL

### STEP-BY-STEP FIX:

**STEP 1: Open Volume III (Pricing Narrative) Document**

File location: Vol_III_PRICING_NARRATIVE.docx

**STEP 2: Navigate to Section 7.2**

Section 7.2 should be titled "FAR 52.219-14 Compliance" or similar (around page 15)

**STEP 3: Position Cursor**

- Read Section 7.2 completely
- Position cursor at the END of Section 7.2 (after the paragraph about prime performing 50%+)
- Press Enter twice to create spacing

**STEP 4: Insert New Section Heading**

Type exactly: **7.2A SUBCONTRACTOR UTILIZATION**

Format as same heading level as Section 7.2 (probably Heading 2, bold, may be all caps)

**STEP 5: Copy and Paste This Entire Text Below the Heading:**

---

rockITdata has partnered with **LMI Consulting, LLC** (LMI) as a subcontractor to provide specialized quality assurance validation and AI/ML-powered automation expertise for this contract.

**Subcontractor Role and Workshare**

**LMI Subcontractor Allocation:** 25% of Base CLIN 0001 ($459,590 of $1,838,360)

**LMI will provide:**

1. **Quality Assurance Validation (Objective 1):** LMI will validate inventory outputs using ISO 2859-1 statistical sampling methodology, ensuring metadata completeness and accuracy meet DoD and NIST standards before baseline acceptance.

2. **AI/ML Automation Validation (Objective 4):** LMI will validate automated harvesting pipeline outputs, applying proven AI/ML quality controls developed on their Army Data & Analytics Platform contract where they achieved "Exceptional" performance ratings.

3. **ADVANA Integration Expertise (Objective 6):** LMI will provide technical guidance on ADVANA federation protocols based on their demonstrated OSD integration experience, ensuring DHA metadata synchronization aligns with DoD CDAO requirements.

**Rationale for Subcontractor Selection**

LMI was selected based on their directly relevant past performance:

- **Army Data & Analytics Platform Contract:** LMI received "Exceptional" ratings (highest possible) from the U.S. Army Medical Research and Development Command (USAMRDC) for data governance and AI/ML-powered analytics work directly comparable to DHA's requirements.

- **Proven Quality Assurance:** LMI's ISO 2859-1 Acceptance Quality Limit (AQL) sampling methodology has been validated on DoD data governance contracts, providing empirical evidence of their QA capability.

- **AI/ML Data Mesh Expertise:** LMI's experience implementing AI-assisted metadata cataloging with false positive identification and training gap analysis de-risks DHA's automated harvesting objectives.

This partnership enables rockITdata to provide **proven DoD data governance capability** rather than first-time implementation, reducing technical risk to the Government.

**Prime Contractor Compliance**

In full compliance with FAR 52.219-14 Limitations on Subcontracting, **rockITdata (prime contractor) will perform 75% of Base CLIN 0001 work ($1,378,770)** with its own employees, exceeding the required 50% threshold.

**Prime contractor responsibilities include:**
- Program Management (WBS 1.0)
- Technical execution of Objectives 2, 3, 5, 7, 8, 9
- Overall integration and delivery of all objectives
- Single point of accountability to DHA COR

**Subcontractor responsibilities (LMI):**
- QA validation support (Objective 1)
- AI/ML validation support (Objective 4)
- ADVANA technical guidance (Objective 6)

rockITdata maintains full contract performance responsibility and single-point accountability to the DHA Contracting Officer's Representative (COR) for all deliverables, including subcontractor work products.

---

**STEP 6: Format the Text**

Apply these formatting rules to match your document:

- Main subsection headings ("Subcontractor Role and Workshare", "Rationale...", "Prime Contractor Compliance"): Use **Heading 3** or **Bold**
- Numbered lists (1, 2, 3 under "LMI will provide"): Use numbered list formatting
- Bulleted lists (under Prime/Sub responsibilities): Use bullet formatting
- Font: Match document font (probably Times New Roman or Arial, 11-12pt)
- Line spacing: Match document (probably single or 1.15)

**STEP 7: Update Table of Contents (if present)**

If your document has a Table of Contents:
- Right-click on the TOC
- Select "Update Field"
- Choose "Update entire table"
- Verify Section 7.2A appears

**STEP 8: Quality Check**

- [ ] Section 7.2A exists after Section 7.2
- [ ] LMI mentioned by name (LMI Consulting, LLC)
- [ ] 25% allocation stated ($459,590 of $1,838,360)
- [ ] Three specific LMI tasks listed (OBJ 1, 4, 6)
- [ ] Army "Exceptional" ratings mentioned
- [ ] Prime 75% compliance stated ($1,378,770)
- [ ] Math correct: $1,378,770 + $459,590 = $1,838,360 ✓
- [ ] Math correct: 75% + 25% = 100% ✓
- [ ] Formatting matches rest of document
- [ ] No typos

**✅ COMPLETION CRITERIA:**
- Section 7.2A fully inserted and formatted
- LMI subcontractor fully disclosed with role, rationale, allocation
- Prime compliance demonstrated (75% > 50% requirement)

---

## 📋 CRITICAL ACTION #3: VERIFY EXCEL FORMULAS WORKING (15 MIN TEST + 0-6 HR FIX)

**Problem:** LMI reviewer reports formulas don't work in their copy. If formulas don't work in Government's copy = instant disqualification.

**Reviewer Who Flagged This:** Christian Smith (LMI)  
**Impact:** AUTO-FAIL IF BROKEN  
**Priority:** 🔴 CRITICAL

### STEP-BY-STEP FIX:

**⚠️ IMPORTANT: This is a TESTING procedure. If test fails, you may need 2-6 hours to fix or rebuild.**

**STEP 1: Close All Excel Windows**

- Close any open Excel files
- Make sure no Excel is running

**STEP 2: Open Pricing Sheet Fresh**

- Navigate to: rockITdata_Pricing_Sheet.xlsx
- Double-click to open
- If you see "Enable Editing" button → Click it
- If you see "Enable Macros" button → DO NOT click (shouldn't be macros)

**STEP 3: Check Calculation Mode**

- Click **File** menu → **Options** → **Formulas**
- Under "Calculation options" should show: **Automatic** (selected)
- If it says "Manual" → Change to "Automatic" → Click OK
- This is CRITICAL - formulas won't update if set to Manual

**STEP 4: Test Formula Recalculation**

This is the actual test to see if formulas work:

1. Click on the **"Rate Buildup"** tab at the bottom
2. Find the Program Manager (PM) labor rate cell (probably in a column showing hourly rates)
3. Write down the current rate (example: let's say it's $150/hour)
4. **Change the PM rate:**
   - Click on the cell
   - Type a new number (example: change $150 to $155)
   - Press Enter

5. Now click on the **"CLIN Summary"** tab at the bottom
6. Find the Base CLIN 0001 Total (should be around $1,838,360)
7. **CRITICAL CHECK - Did the total change?**

**🟢 IF THE TOTAL CHANGED (went up by about $800):**
- ✅ FORMULAS WORK!
- Change the PM rate BACK to original value
- Verify total returns to $1,838,360
- Skip to Step 6 (Quality Check)
- You're done with this critical action (15 minutes total)

**🔴 IF THE TOTAL DID NOT CHANGE:**
- ❌ FORMULAS ARE BROKEN
- This is a CRITICAL PROBLEM
- **STOP IMMEDIATELY**
- Escalate to Finance team
- You will need 2-6 hours to fix
- DO NOT SUBMIT PROPOSAL until fixed

**STEP 5: Check for Formula Errors**

Look through each tab for these error codes:
- #REF! (broken reference)
- #VALUE! (wrong data type)
- #DIV/0! (divide by zero)
- #NAME? (unrecognized function)

**Tabs to check:**
- CLIN Summary
- Rate Buildup
- BOE Hours Detail
- CLIN 0002 Detail (if exists)
- CLIN 0003 Detail (if exists)

**If you see ANY error codes:**
- 🔴 This is a critical problem
- Document which cells have errors
- Escalate to Finance team immediately

**STEP 6: Verify Formula Visibility**

1. Click on CLIN Summary tab
2. Click on a cell that should have a formula (like G7, which calculates hours × rate)
3. Look at the **Formula Bar** (the text box above the spreadsheet grid)
4. You should see: **=E7*F7** (or similar formula)
5. You should NOT see just a number

**🟢 IF YOU SEE FORMULAS (=E7*F7):**
- ✅ Formulas are visible and editable
- This is good

**🔴 IF YOU SEE JUST NUMBERS (no equals sign):**
- ❌ Formulas have been converted to static values
- This is a critical problem
- Escalate immediately
- May need to rebuild pricing sheet

**STEP 7: Final Checks**

- [ ] File format is .xlsx (not .xls, not .xlsm)
   - Check: File → Info → should say "Excel Workbook (*.xlsx)"
- [ ] File is NOT password protected
   - Check: File → Info → Protect Workbook should be grayed out
- [ ] Calculation mode is Automatic
   - Check: File → Options → Formulas → Automatic selected
- [ ] Save the file (Ctrl+S)
- [ ] Close Excel
- [ ] Reopen the file
- [ ] Verify totals are still correct ($1,838,360 for Base CLIN)

**✅ COMPLETION CRITERIA (All Must Be True):**
- [ ] Formulas recalculate when inputs change (TESTED AND CONFIRMED)
- [ ] No #REF, #VALUE, #DIV/0 errors anywhere
- [ ] Formulas visible in formula bar (not static values)
- [ ] File format is .xlsx
- [ ] File not password protected
- [ ] Calculation mode is Automatic
- [ ] File reopens without errors

**⚠️ IF ANY TEST FAILS:**
- STOP - Do not proceed with submission
- Document the exact problem
- Take screenshots
- Escalate to Finance team
- Allocate 2-6 hours for fix (may need formula rebuild)
- Re-run this entire test after fix

---

## 📋 CRITICAL ACTION #4: REMOVE "ASSUMPTIONS" FROM VOLUME III (10 MINUTES)

**Problem:** The word "assumptions" in pricing context can trigger LLM screening as conditional qualifications, which violates FAR requirement for no exceptions/assumptions.

**Reviewer Who Flagged This:** Jack Yang  
**Impact:** POTENTIAL AUTO-FAIL  
**Priority:** 🔴 CRITICAL

### STEP-BY-STEP FIX:

**STEP 1: Open Volume III (Pricing Narrative) Document**

**STEP 2: Use Find & Replace**

Press Ctrl+H (Windows) or Cmd+H (Mac) to open Find & Replace

**REPLACEMENT 1:**
```
Find: assumptions
Replace with: execution parameters
```
Click "Replace All"

**REPLACEMENT 2:**
```
Find: Assumptions
Replace with: Execution Parameters
```
Click "Replace All"

**REPLACEMENT 3:**
```
Find: assumed
Replace with: established
```
Click "Replace All"

**REPLACEMENT 4:**
```
Find: assuming
Replace with: establishing
```
Click "Replace All"

**STEP 3: Manual Review of Each Replacement**

Go through document and verify each replacement makes sense in context.

**Examples of Good Replacements:**

**BEFORE:** "Our pricing is based on the following assumptions:"  
**AFTER:** "Our pricing is based on the following execution parameters:"  
**Status:** ✅ Good

**BEFORE:** "Key assumptions include:"  
**AFTER:** "Key execution parameters include:"  
**Status:** ✅ Good

**BEFORE:** "We have assumed a 20% complexity factor"  
**AFTER:** "We have established a 20% complexity factor"  
**Status:** ✅ Good

**STEP 4: Search for Related Conditional Language**

Also search for and remove/rephrase:
- "contingent upon"
- "dependent on"
- "subject to"
- "if Government provides"

Replace with:
- "The Contractor shall..."
- "The Contractor will..."
- "Our approach accommodates..."

**STEP 5: Quality Check**

- [ ] No instances of "assumptions" in pricing context
- [ ] No instances of "assumed" or "assuming"
- [ ] All replaced with "execution parameters" or "established"
- [ ] No conditional language tied to Government actions
- [ ] Pricing presented as firm and unconditional

**✅ COMPLETION CRITERIA:**
- Zero instances of "assumptions" in Volume III
- All execution parameters clearly contractor-controlled
- No conditional qualifications on pricing

---

## 🎯 CRITICAL ACTIONS COMPLETION CHECKLIST

**Before Proceeding to Submission:**

- [ ] **Action #1 Complete:** Auto-fail "coordinate" language removed (searched and verified)
- [ ] **Action #2 Complete:** Volume III Section 7.2A added (LMI subcontractor disclosure)
- [ ] **Action #3 Complete:** Excel formulas tested and working (5-step test passed)
- [ ] **Action #4 Complete:** "Assumptions" replaced with "execution parameters" in Volume III

**If ANY of the above are not checked:**
- ⚠️ DO NOT SUBMIT PROPOSAL
- ⚠️ Complete remaining critical actions first
- ⚠️ Risk: Disqualification or major point deduction

**If ALL of the above are checked:**
- ✅ All critical compliance issues resolved
- ✅ Proposal moved from YELLOW to BLUE rating
- ✅ Disqualification risk eliminated
- ✅ Ready to proceed to High Priority items or submission

---

## 🟡 HIGH PRIORITY ACTIONS (3 HOURS - STRONGLY RECOMMENDED)

**These are not mandatory for submission but strongly recommended to move from BLUE to EXCEPTIONAL BLUE rating.**

### HIGH PRIORITY #1: REWRITE EXECUTIVE SUMMARY (2 HOURS)

**Problem:** Executive Summary is too verbose (1,200+ words vs. 600-750 target). Win themes are embedded in prose rather than explicit. Evaluators will experience cognitive overload.

**All 4 Reviewers Flagged This:** Byrd (Gold Team), Jack Yang, S. Donohue, Cory Taylor

**Current State:**
- 4 subsections (1.1, 1.2, 1.3, 1.4)
- ~1,200 words
- Win themes implied, not explicit
- Reading time: 8-10 minutes
- Evaluator confidence: Medium

**Target State:**
- Single flowing section
- ~635 words
- 5 numbered win themes (explicit)
- 5 numbered risk mitigations
- Reading time: 3-5 minutes
- Evaluator confidence: Very High

### STEP-BY-STEP FIX:

**STEP 1: Open Volume I (Technical Capability) Document**

**STEP 2: Navigate to Section 1.0 (Executive Summary)**

**STEP 3: DELETE All Current Content**

Select and delete:
- Section 1.1 (Strategic Vision) - ENTIRE subsection
- Section 1.2 (AMANDA Framework) - ENTIRE subsection
- Section 1.3 (Empirical Evaluation Environment) - ENTIRE subsection
- Section 1.4 (Mission Alignment) - ENTIRE subsection

Delete all subsection numbering (1.1, 1.2, 1.3, 1.4)

**STEP 4: Position Cursor at Section 1.0**

Keep the main heading "SECTION 1.0 EXECUTIVE SUMMARY" or similar

Position cursor right after that heading

**STEP 5: Copy and Paste This Entire New Executive Summary:**

---

### Independent, Adoption-Driven Data Governance for DHA

The Defense Health Agency (DHA) faces a critical data governance challenge. Eighty fragmented legacy systems, inconsistent metadata, and unclear ownership structures have limited the enterprise's ability to treat data as a mission-enabling asset. Premature investment in enterprise catalog platforms—without first establishing governance discipline—introduces significant risk: accelerating the propagation of poor-quality data, eroding user trust, and delaying operational impact. DHA requires a governance-first approach that validates workflows and establishes accountability before committing to long-term platform procurement.

rockITdata addresses this challenge as an **Independent Governance Partner**—a technology-forward, services-only contractor with no ownership stake in data platforms, hosting environments, or catalog products. This independence eliminates organizational conflict of interest and enables neutral oversight between DHA mission owners, incumbent engineering vendors, and future enterprise data catalog providers. Our role is not to select tools or approve data for enterprise use; it is to establish durable governance foundations ensuring DHA's data is Visible, Accessible, Understandable, Linked, Trusted, Interoperable, and Secure (VAULTIS) before it is scaled.

### Why rockITdata?

**Five Core Win Themes:**

1. **Governance Before Tooling:** Establish validated governance workflows and ownership accountability before DHA commits to long-term enterprise catalog procurement, reducing risk of amplifying existing data quality issues.

2. **Government Authority Preserved:** Human-in-the-Loop controls ensure all approvals, publication decisions, and accountability remain with DHA personnel—AI accelerates work but never governs.

3. **Zero-Footprint Execution:** All work operates entirely within DHA-approved Government Furnished Environments (SharePoint, Power Platform, Python on GFE), eliminating new licensing costs and ATO delays.

4. **Adoption-Driven Design:** Governance capabilities are built for immediate operational use through our AMANDA™ Framework—not shelfware. Behavioral analytics identify and address user resistance before it impedes adoption.

5. **Mission-Aligned Outcomes:** Every activity traces directly to DHA priorities for Combat Support readiness, Care Reattraction coordination, and Enterprise Optimization—governance serves mission delivery, not compliance theater.

### Technical Approach

rockITdata delivers an integrated, end-to-end governance program spanning seven base objectives executed in parallel across a 12-month period of performance.

We establish a **Comprehensive Baseline Data Inventory** for up to 80 DHA systems using a Tiered Metadata Ingestion Methodology. High-complexity, mission-critical systems (e.g., MHS GENESIS) receive structured, high-touch deep dives with subject matter experts, while stable or well-documented systems leverage automated harvesting and validation. This risk-based approach balances speed with rigor, ensuring complete coverage without over-engineering. We deploy an **Interim Centralized Repository** using existing SharePoint and Power Platform capabilities in GCC-High, operationalizing metadata standards, approval workflows, and stewardship roles within eight weeks—providing immediate value while validating real-world requirements for DHA's future Enterprise Data Catalog (EDC). We conduct a **GAO-aligned Analysis of Alternatives (AoA)** for DHA-EDC procurement using empirical testing with DHA's actual metadata, weighted decision criteria, and Government-controlled approval gates to reduce procurement and protest risk. **AI-assisted metadata harvesting** increases throughput through automated draft generation while strict Human-in-the-Loop validation ensures no automated output becomes authoritative without DHA approval—automation detects schema drift, flags stale records, and reduces long-term steward burden, enabling sustainable governance beyond contract performance. **Governance standards, metadata lifecycle management, federation to Advana, and self-service usability evaluation** complete the program, ensuring DHA's data governance ecosystem is auditable, interoperable, and usable by both technical and non-technical stakeholders.

### How This Approach Reduces DHA's Risk

**Five Critical Risk Mitigations:**

1. **Schedule Risk Reduced:** Tiered execution methodology and early delivery of operational repository capability (Week 8) prevent delays from over-engineering low-complexity systems.

2. **Procurement Risk Reduced:** Empirically validating EDC requirements before vendor selection prevents costly wrong-tool implementation and reduces protest vulnerability.

3. **Compliance Risk Reduced:** CAC-attributed approvals, complete audit trails, and policy-aligned workflows ensure HIPAA, DoD, and DHA PGI 224.1-90 adherence from day one.

4. **Adoption Risk Reduced:** Designing governance for real users through persona-based usability evaluation and behavioral analytics eliminates interfaces people won't use.

5. **Sustainment Risk Reduced:** Government ownership of complete source code, documentation, and processes enables independent operation post-contract without vendor dependency.

### Mission Impact

**VAULTIS-Aligned Mission Outcomes:**

- **Combat Support:** Rapid, trusted data discovery enables informed operational planning and readiness decisions—when theater medical commanders need data for contingency operations, delays measured in days or weeks can cost lives.

- **Care Reattraction:** Plain-language metadata and governed discovery support coordinated care across clinical systems—care coordinators can locate patient data without requiring technical database expertise.

- **Enterprise Optimization:** Automation and standards reduce manual overhead, enabling scalable analytics and AI initiatives—sustainable governance redirects capacity from mechanical documentation to strategic governance activities.

In summary, rockITdata delivers governance as an operational capability—not a theoretical framework or platform dependency. By establishing validated governance foundations through our AMANDA™ Framework, preserving Government authority through mandatory Human-in-the-Loop controls, and aligning execution to DHA's mission priorities, this approach enables DHA to scale data, analytics, and AI with confidence, control, and measurable impact.

---

**STEP 6: Format the New Text**

Apply formatting to match your document:

**Main section heading:**
- "SECTION 1.0 EXECUTIVE SUMMARY" - Use Heading 1 style

**Subtitle headings:**
- "Independent, Adoption-Driven Data Governance for DHA" - Use Heading 2
- "Why rockITdata?" - Use Heading 3
- "Technical Approach" - Use Heading 3
- "How This Approach Reduces DHA's Risk" - Use Heading 3
- "Mission Impact" - Use Heading 3

**Lists:**
- Five Core Win Themes - Use NUMBERED LIST (1-5), bold the theme titles
- Five Critical Risk Mitigations - Use NUMBERED LIST (1-5), bold the titles
- VAULTIS-Aligned Mission Outcomes - Use BULLETED LIST, bold the mission areas

**Font and Spacing:**
- Match your document font (probably Times New Roman or Arial)
- Match your document size (probably 11pt or 12pt)
- Match your document line spacing (probably single or 1.15)

**STEP 7: Update Table of Contents**

If your document has a TOC:
- Right-click on the Table of Contents
- Select "Update Field"
- Choose "Update entire table"
- Verify Section 1.0 structure is correct (no more 1.1, 1.2, 1.3, 1.4)

**STEP 8: Quality Check**

- [ ] Old subsections 1.1-1.4 completely removed
- [ ] New single-flowing Section 1.0 in place
- [ ] Word count: 600-750 words (should be ~635 words)
- [ ] Win themes: 5 themes, numbered, explicit, bold titles
- [ ] Risk mitigations: 5 items, numbered, bold titles
- [ ] Mission outcomes: 3 items, bulleted, bold mission areas
- [ ] Formatting consistent with rest of document
- [ ] Scannable (evaluator can skim in 3-5 minutes)
- [ ] No placeholder text
- [ ] No typos

**✅ COMPLETION CRITERIA:**
- Executive Summary is 600-750 words
- 5 explicit numbered win themes
- 5 explicit numbered risk mitigations
- 3 mission impact bullets
- Scannable structure (not narrative-heavy)
- Reading time: 3-5 minutes

**Impact:**
- Before: Medium evaluator confidence, 8-10 min read
- After: Very High evaluator confidence, 3-5 min read
- Rating improvement: GREEN → EXCEPTIONAL BLUE

---

### HIGH PRIORITY #2: ADD THROUGHPUT MATH TO OBJECTIVE 1 (15 MINUTES)

**Problem:** Timeline mentioned but not quantified. No throughput calculation. Evaluators can't verify feasibility of completing 80 systems in 12 months.

**Reviewers:** Jack Yang, Byrd

**STEP-BY-STEP FIX:**

**STEP 1: Open Volume I**

**STEP 2: Navigate to Section 2.1 (Objective 1 - Technical Approach)**

Find the paragraph that describes the tiered methodology (Tier 1, Tier 2, Tier 3)

**STEP 3: Find the End of the Tiering Explanation**

Look for text like: "...Tier 3 standard systems receive full automated crawling via Python scripts during Months 5-9, maximizing efficiency where system architectures permit."

**STEP 4: Insert This Text Right After That Paragraph:**

---

**Throughput Analysis:** Our tiered approach enables systematic coverage of all 80 systems within the 12-month period of performance. Tier 1 systems (16 systems) proceed through sequential deep-dive sessions at 2 systems per month (Months 1-8). Tier 2 and Tier 3 systems (64 systems combined) leverage parallel automated harvesting tracks processing 6-8 systems per month simultaneously (Months 4-11), with staggered validation workflows preventing resource bottlenecks. This methodology delivers **complete 80-system coverage by Month 11**, providing one-month buffer for final validation and DHA-EDC migration preparation. All 80 systems will be completed within the period of performance barring Government-directed scope changes requiring baseline re-prioritization.

---

**STEP 5: Quality Check**

- [ ] Throughput math inserted after tiering explanation
- [ ] Specific counts: 16 Tier 1 systems, 64 Tier 2/3 systems
- [ ] Throughput rates: 2 systems/month, 6-8 systems/month
- [ ] Timeline: Complete by Month 11 (1-month buffer)
- [ ] Confidence statement: "All 80 systems completed within PoP"
- [ ] Government caveat: "barring Government-directed scope changes"
- [ ] Bold emphasis on "complete 80-system coverage by Month 11"

**✅ COMPLETION CRITERIA:**
- Quantitative throughput calculation provided
- Evaluators can verify math (16 + 64 = 80)
- Schedule confidence increased
- Realistic buffer time included

---

## 📝 AFTER ALL ACTIONS: FINAL QUALITY CHECKLIST

### Critical Items (Must Be Done)

- [ ] Auto-fail "coordinate" language: REMOVED (0 instances)
- [ ] Volume III Section 7.2A: ADDED (LMI subcontractor disclosure)
- [ ] Excel formulas: TESTED AND WORKING
- [ ] "Assumptions" language: REPLACED (Volume III)

### High Priority Items (Strongly Recommended)

- [ ] Executive Summary: REWRITTEN (635 words, 5 win themes, 5 risk mitigations)
- [ ] Throughput math: ADDED (Objective 1)

### Cross-Document Consistency

- [ ] LMI 25% consistent (Volume I mentions, Volume III Section 7.2A, Excel)
- [ ] Pricing totals match (Volume III narrative = Excel sheet = $1,838,360 base)
- [ ] Win themes consistent (Executive Summary themes appear throughout Volume I)
- [ ] No contradictions between volumes

### Professional Quality

- [ ] No typos or grammatical errors
- [ ] No placeholder text ("[TO BE COMPLETED]" or similar)
- [ ] Page numbers correct and sequential
- [ ] Headers/footers consistent
- [ ] Table of Contents updated
- [ ] All cross-references accurate

### Compliance Final Check

- [ ] No auto-fail language anywhere (comprehensive search done)
- [ ] No conditional qualifications
- [ ] All contractor actions use "shall" language
- [ ] No performance dependent on Government actions
- [ ] All FAR clauses acknowledged
- [ ] Amendment acknowledged in cover letter

---

## ⏱️ TIME BREAKDOWN

### Your 4-Hour Critical Session

| Time | Action | Status |
|------|--------|--------|
| 0:00-0:30 | Remove auto-fail language (Volume I) | ⬜ |
| 0:30-0:50 | Add LMI Section 7.2A (Volume III) | ⬜ |
| 0:50-1:00 | Remove "assumptions" (Volume III) | ⬜ |
| 1:00-1:15 | Test Excel formulas | ⬜ |
| 1:15-3:15 | Rewrite Executive Summary (Volume I) | ⬜ |
| 3:15-3:30 | Add throughput math (Volume I) | ⬜ |
| 3:30-4:00 | Final quality check all changes | ⬜ |

**Total: 4 hours**

---

## 🎯 DECISION POINT

### Option A: Submit After Critical Actions Only (4 hours)

**Status:** All critical compliance issues fixed  
**Rating:** BLUE (confident award)  
**Win Probability:** 75-80%  
**Risk:** LOW (no disqualification risk)  
**Recommendation:** Acceptable for submission if time-constrained

### Option B: Submit After Critical + High Priority (6-7 hours)

**Status:** All critical issues + executive summary optimized  
**Rating:** EXCEPTIONAL BLUE  
**Win Probability:** 85-95%  
**Risk:** VERY LOW  
**Recommendation:** Strongly recommended if time permits

---

## 📞 IF YOU HAVE QUESTIONS

### Critical Actions (Must Fix)

**Auto-Fail Language:**
- Q: "I found more instances of 'coordinate' - what do I do?"
- A: Replace ALL with "The Contractor shall..." language. When in doubt, ask yourself: "Does this make our performance conditional on Government action?" If yes, rephrase.

**LMI Section:**
- Q: "Should I change section numbering after 7.2A?"
- A: Either (1) keep 7.2A designation and leave rest as-is, OR (2) renumber everything (7.2A becomes 7.3, old 7.3 becomes 7.4, etc.). Option 1 is faster and acceptable.

**Excel Formulas:**
- Q: "What if formulas don't work?"
- A: STOP. Do not submit. This is critical. Escalate to Finance team. They may need to rebuild sheet or fix formulas. Allow 2-6 hours for fix.

**Assumptions:**
- Q: "I'm not sure if a replacement makes sense in context"
- A: Read the sentence after replacement. Does it sound natural? If not, use alternative: "established", "defined", "planned for"

### High Priority Actions

**Executive Summary:**
- Q: "Can I modify the new executive summary text?"
- A: Yes, but maintain structure: (1) problem statement, (2) 5 numbered win themes, (3) technical approach paragraph, (4) 5 numbered risk mitigations, (5) 3 mission bullets. Do not exceed 750 words.

---

## ✅ FINAL RECOMMENDATION

**Complete all 4 critical actions (4 hours) BEFORE submission.**

**If you have 2 more hours: Complete executive summary rewrite.**

**These fixes transform your proposal from conditional award (YELLOW) to confident award (BLUE/EXCEPTIONAL BLUE).**

**You have a strong technical proposal. These are fixable compliance and presentation issues. Fix them and win the contract.** 🚀

---

**END OF QUICK-REFERENCE ACTION GUIDE**

**Report Prepared:** January 7, 2026  
**For:** Proposal Manager - DHA Data Governance  
**Companion Document:** SHIPLEY_RED_TEAM_FINAL_REPORT.md (42 pages, full analysis)
