# 🧅 GLASS ONION STRESS TEST SCORECARD
## MissionPulse Validation Checklist

**Test Date:** _______________  
**Tester:** _______________  
**Module(s) Tested:** _______________

---

## THE 4 TRAPS

### TRAP 1: Timeline Paradox (Section 2.0)
**The Issue:** System must be live Sept 30, but code access isn't allowed until Oct 1.

| Question | Result |
|----------|--------|
| Did MissionPulse flag this as a risk? | ☐ Yes ☐ No |
| Was it marked as CRITICAL/HIGH severity? | ☐ Yes ☐ No |
| Did it recommend seeking clarification? | ☐ Yes ☐ No |

**Score:** ___/3

**What MissionPulse Said:**
```
[Paste the actual output here]


```

---

### TRAP 2: Hidden Footnote Requirement (Section 3.2)
**The Issue:** TS/SCI clearance for Sr. Developer is buried in footnote, not in main requirement.

| Question | Result |
|----------|--------|
| Did MissionPulse extract the TS/SCI requirement? | ☐ Yes ☐ No |
| Did it flag the footnote as a "hidden requirement"? | ☐ Yes ☐ No |
| Did it include clearance in staffing checklist? | ☐ Yes ☐ No |

**Score:** ___/3

**What MissionPulse Said:**
```
[Paste the actual output here]


```

---

### TRAP 3: Format Specification (Section 4.0)
**The Issue:** Deliverable A003/A004 requires VISIO ONLY - not generic "document."

| Question | Result |
|----------|--------|
| Did MissionPulse extract "Visio ONLY" format? | ☐ Yes ☐ No |
| Did it flag this as a potential capability gap? | ☐ Yes ☐ No |
| Did it correctly parse the combined A003/A004 row? | ☐ Yes ☐ No |

**Score:** ___/3

**What MissionPulse Said:**
```
[Paste the actual output here]


```

---

### TRAP 4: SLA Contradiction (Section 5.0)
**The Issue:** Standard says "24/7/365" but AQL says "95% during business hours."

| Question | Result |
|----------|--------|
| Did MissionPulse flag the contradiction? | ☐ Yes ☐ No |
| Did it identify which takes precedence? | ☐ Yes ☐ No |
| Did it recommend clarification in Q&A? | ☐ Yes ☐ No |

**Score:** ___/3

**What MissionPulse Said:**
```
[Paste the actual output here]


```

---

## OVERALL SCORING

| Trap | Max Points | Your Score |
|------|------------|------------|
| 1. Timeline Paradox | 3 | ___ |
| 2. Hidden Footnote | 3 | ___ |
| 3. Format Specification | 3 | ___ |
| 4. SLA Contradiction | 3 | ___ |
| **TOTAL** | **12** | **___** |

---

## GRADE SCALE

| Score | Grade | Assessment |
|-------|-------|------------|
| 11-12 | **A** | Production-ready. Ship it! |
| 9-10 | **B** | Good but needs minor tuning |
| 7-8 | **C** | Functional but missing edge cases |
| 5-6 | **D** | Needs significant improvement |
| 0-4 | **F** | Not ready for real proposals |

**YOUR GRADE:** ___

---

## IMPROVEMENT NOTES

**What worked well:**
```


```

**What needs fixing:**
```


```

**Specific prompts/logic to adjust:**
```


```

---

## TEST PROMPTS TO TRY

Copy these into MissionPulse to test different modules:

### For RFP Shredder:
```
Analyze this PWS and extract all requirements. Flag any contradictions, 
ambiguities, or risks that could affect our bid decision.
```

### For Iron Dome (Compliance):
```
Generate a compliance matrix for this PWS. Identify any requirements 
that conflict with each other or are impossible to meet as written.
```

### For Black Hat:
```
What questions should we ask in the Q&A period to clarify ambiguities 
in this PWS? What risks would a competitor identify?
```

### For Staffing/Delivery:
```
Extract all personnel requirements from this PWS including any 
requirements in footnotes or supplementary text.
```

---

*Scorecard v1.0 - MissionPulse Stress Testing*
