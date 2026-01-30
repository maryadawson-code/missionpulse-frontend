# VA CCN NEXT GENERATION MEDICAL — PIPELINE UPDATE
## AI Agent Training Document
**Version:** 1.0  
**Date:** January 17, 2026  
**Classification:** CAPTURE SENSITIVE

---

## PIPELINE UPDATE INSTRUCTIONS

### CRITICAL CHANGES FROM PREVIOUS VERSION
1. **TriWest status changed:** Active → Conditional (relationship repair required)
2. **Humana added:** New hedge option for West Region
3. **West Prime:** Changed from "TriWest" to "TBD (decision Jan 31)"
4. **Dual-track strategy:** Now pursuing TriWest AND Humana in parallel for hedge

---

## MASTER OPPORTUNITY RECORD

```yaml
opportunity:
  name: "VA CCN Next Generation Medical IDIQ"
  solicitation_number: "36C10G26R0003"
  agency: "Department of Veterans Affairs (VA)"
  contract_type: "IDIQ — Multi-Award"
  set_aside: "Unrestricted"
  naics: "TBD"
  size_standard: "$47M"
  period_of_performance: "10-Year IDIQ; Initial TOPRs: 3-Year Base + Options"
  regions:
    - "East Region"
    - "West Region"
  proposal_due: "2026-03-16T14:00:00-05:00"
  latest_amendment: "2025-12-15"
  
rockitdata_role: "SUBCONTRACTOR"
stage: "Capture — Teaming Development"
decision: "GO — Conditional on Prime confirmation"
overall_pwin: "35-42%"
next_gate: 
  name: "West Prime Selection"
  date: "2026-01-31"

incumbents:
  east:
    company: "Optum Public Sector Solutions"
    parent: "UnitedHealth Group"
  west:
    company: "TriWest Healthcare Alliance"
    parent: "Private"
    financial_status: "STRUGGLING"
```

---

## TRACK 1: PRIMARY (rockITdata → Optum)

```yaml
track:
  name: "CCN Next Gen — Optum Track"
  designation: "PRIMARY"
  entity: "rockITdata (direct — no JV)"
  
prime:
  name: "Optum Serve"
  parent: "UnitedHealth Group"
  incumbent: true
  region: "East"
  
relationship:
  status: "STRONG"
  key_contact:
    name: "BG (Ret.) Peder L. Swanson"
    title: "VP & DoD/DHA Account Executive"
    company: "Optum Serve"
    location: "Oakton, VA"
    decision_authority: "VP-level — capture/teaming decisions"
  history: "Prior positive engagement; helped in past"
  
probabilities:
  p_prime_wins: 0.65
  p_on_team: 0.55
  p_favorable_terms: 0.65
  combined_pwin: 0.232
  
resource_allocation: 0.70
status: "ACTIVE — Outreach in progress"

scope_lane:
  - "Technology & Interoperability"
  - "Data & Analytics"
  - "Customer Service Technology"
  - "Program Integrity Support"
  
value_proposition:
  - "Small Business Credit: SDVOSB + WOSB"
  - "VA-Specific Experience: MRDC, DHA, Fort Meade MEDDAC"
  - "Technology Modernization: AI/ML, analytics, interoperability"
  - "Cost-Effective Alternative to large integrators"

actions:
  - action: "Contact BG Swanson"
    deadline: "2026-01-20"
    owner: "Capture Lead"
    status: "PENDING"
  - action: "Attend Pre-Proposal Conference"
    deadline: "2026-01-22"
    owner: "Capture Lead"
    status: "CONFIRMED"
```

---

## TRACK 2: HEDGE (Arazzo → West Prime TBD)

```yaml
track:
  name: "CCN Next Gen — West Hedge Track"
  designation: "HEDGE"
  entity: "Arazzo (JV: rockITdata + Accenture Federal Services)"
  target_region: "West"
  
prime_options:
  option_a:
    name: "TriWest Healthcare Alliance"
    status: "STRAINED — Repair in progress"
    incumbent: true
    key_contact: "Derek Emlet"
    probabilities:
      p_prime_wins: 0.55
      p_on_team_if_repaired: 0.65
      p_favorable_terms: 0.55
      combined_pwin_if_repaired: 0.197
    risks:
      - "Financial struggles"
      - "Difficult Prime culture"
      - "Margin pressure likely"
      - "Payment delays possible"
    advantages:
      - "Incumbent knowledge"
      - "Existing past performance (TRICARE AWS Connect)"
      - "Proven working relationship history"
    conditions_for_selection:
      - "Relationship demonstrably repaired"
      - "Written commitment to minimum workshare"
      - "Rate card agreed (no margin compression)"
      - "Payment terms Net 30-45"
      - "Scope lane defined (not staff-aug)"
      - "TA timeline acceptable"
      
  option_b:
    name: "Humana Military"
    status: "COLD — Outreach initiated"
    incumbent: false
    key_contacts:
      - name: "Karen Moran"
        title: "President, Humana Military"
      - name: "Sue Schick"
        title: "Segment President, Group and Military Business"
      - name: "SBLO"
        email: "SBLO@humana.com"
    probabilities:
      p_prime_wins: 0.30
      p_on_team: 0.70
      p_favorable_terms: 0.80
      combined_pwin: 0.168
    risks:
      - "Not incumbent — higher transition risk"
      - "Lower probability of winning region"
      - "No existing relationship"
    advantages:
      - "Financial strength (Fortune 50)"
      - "Professional partnership culture"
      - "NEED VA expertise — rockITdata fills gap"
      - "Higher leverage for favorable terms"
      - "Lower sub competition"
    intelligence:
      - "Confirmed pursuing CCN via job postings"
      - "Hiring Principal Solutions Architect for VA CCN"
      - "Hiring Lead Technology Leader for VA CCN"
      
resource_allocation: 0.30
status: "ACTIVE — Parallel pursuit; decision pending"

decision_gate:
  name: "West Prime Selection"
  date: "2026-01-31"
  decision_rule: "Choose TriWest IF all conditions met; otherwise Humana"
```

---

## DECISION GATES

```yaml
gates:
  - gate: 1
    name: "West Prime Selection"
    date: "2026-01-31"
    decision: "Choose ONE West Region Prime (TriWest or Humana)"
    owner: "BD Director"
    status: "PENDING"
    
  - gate: 2
    name: "Teaming Agreement Approval"
    date: "2026-02-14"
    decision: "Approve and sign TAs for both tracks"
    owner: "Contracts"
    status: "NOT STARTED"
    
  - gate: 3
    name: "Final Go/No-Go"
    date: "2026-03-01"
    decision: "Confirm proposal submission"
    owner: "BD Director"
    status: "NOT STARTED"
```

---

## KEY CONTACTS DATABASE

```yaml
contacts:
  - name: "BG (Ret.) Peder L. Swanson"
    company: "Optum Serve"
    title: "VP & DoD/DHA Account Executive"
    location: "Oakton, VA"
    relationship: "STRONG"
    track: "Primary"
    outreach_deadline: "2026-01-20"
    
  - name: "Derek Emlet"
    company: "TriWest Healthcare Alliance"
    relationship: "STRAINED"
    track: "Hedge (Option A)"
    outreach_deadline: "2026-01-20"
    action: "Relationship repair"
    
  - name: "Karen Moran"
    company: "Humana Military"
    title: "President"
    relationship: "COLD"
    track: "Hedge (Option B)"
    outreach_deadline: "2026-01-21"
    channel: "LinkedIn"
    
  - name: "SBLO"
    company: "Humana Military"
    email: "SBLO@humana.com"
    relationship: "COLD"
    track: "Hedge (Option B)"
    outreach_deadline: "2026-01-20"
    channel: "Email"
```

---

## ACTION ITEMS

```yaml
immediate_actions:
  - id: 1
    action: "Contact BG Swanson (Optum)"
    owner: "Capture Lead"
    deadline: "2026-01-20"
    priority: "CRITICAL"
    status: "PENDING"
    
  - id: 2
    action: "Contact Derek Emlet (TriWest) — initiate repair"
    owner: "Capture Lead"
    deadline: "2026-01-20"
    priority: "HIGH"
    status: "PENDING"
    
  - id: 3
    action: "Send Humana SBLO inquiry email"
    owner: "Capture Lead"
    deadline: "2026-01-20"
    priority: "HIGH"
    status: "PENDING"
    
  - id: 4
    action: "LinkedIn outreach to Karen Moran"
    owner: "Capture Lead"
    deadline: "2026-01-21"
    priority: "MEDIUM"
    status: "PENDING"
    
  - id: 5
    action: "Pre-clear internal approvals"
    owner: "Contracts"
    deadline: "2026-01-21"
    priority: "HIGH"
    status: "PENDING"
    
  - id: 6
    action: "ATTEND PRE-PROPOSAL CONFERENCE"
    owner: "Capture Lead"
    deadline: "2026-01-22"
    priority: "CRITICAL"
    status: "CONFIRMED"
    location: "DC Metro"
```

---

## RISK REGISTER

```yaml
risks:
  - id: "R-01"
    description: "Optum declines teaming"
    probability: 2
    impact: 3
    score: 6
    level: "HIGH"
    mitigation: "Leverage BG Swanson relationship; demonstrate unique value"
    
  - id: "R-02"
    description: "TriWest relationship not repairable"
    probability: 2
    impact: 2
    score: 4
    level: "MEDIUM"
    mitigation: "Pivot to Humana as West hedge"
    
  - id: "R-03"
    description: "TriWest financial/payment issues"
    probability: 3
    impact: 2
    score: 6
    level: "HIGH"
    mitigation: "Require favorable payment terms; consider Humana instead"
    
  - id: "R-04"
    description: "Scope lane undefined"
    probability: 2
    impact: 2
    score: 4
    level: "MEDIUM"
    mitigation: "Negotiate specifics before TA signature"
    
  - id: "R-05"
    description: "OCI challenge on dual-track"
    probability: 2
    impact: 3
    score: 6
    level: "HIGH"
    mitigation: "Separate entities by region; maintain firewall; disclose"
```

---

## PAST PERFORMANCE SUMMARY

```yaml
past_performance:
  va_dod_healthcare:
    - contract: "TriWest — TRICARE"
      role: "SUB"
      relevance: "AWS Connect GovCloud; AI/IVR; 1,200+ CSRs; FedRAMP High"
      priority: 1
      
    - contract: "MRDC (Army Medical R&D)"
      role: "PRIME"
      relevance: "Data/Analytics/AI; enterprise analytics; real-time insights"
      priority: 2
      
    - contract: "Fort Meade MEDDAC"
      role: "PRIME"
      relevance: "Healthcare org restructuring; military medical admin"
      priority: 3
      
    - contract: "DHA EM Clinical (Madigan)"
      role: "PRIME"
      relevance: "Clinical support; DHA healthcare"
      priority: 4
      
    - contract: "DHA Hearing Center"
      role: "SUB"
      relevance: "DHA healthcare support"
      priority: 5
      
    - contract: "VA TISTA / EHRM / ECFax"
      role: "SUB"
      relevance: "VA enterprise systems experience"
      priority: 6
      
  transferable:
    - contract: "AbbVie, Merck, Novo Nordisk"
      relevance: "Healthcare data/analytics; AI/ML; Qlik; Databricks; GenAI"
      
    - contract: "VerusRx (PBM)"
      relevance: "Pharmacy benefit management analytics"
      
    - contract: "AIS Healthcare"
      relevance: "Qlik Cloud implementation; healthcare analytics"
```

---

## COMPETITIVE INTELLIGENCE

```yaml
competitors:
  prime_level:
    - name: "Optum Serve"
      incumbent: "East"
      p_win: 0.65
      threat: "N/A — Partner"
      
    - name: "TriWest Healthcare Alliance"
      incumbent: "West"
      p_win: 0.55
      threat: "N/A — Potential Partner"
      financial_status: "STRUGGLING"
      
    - name: "Humana Military"
      incumbent: false
      p_win: 0.30
      threat: "N/A — Potential Partner"
      intelligence: "Confirmed pursuing via job postings"
      
    - name: "CVS/Aetna"
      incumbent: false
      p_win: 0.15
      threat: "LOW"
      notes: "Unlikely to bid"
      
    - name: "Centene"
      incumbent: false
      p_win: 0.20
      threat: "LOW-MEDIUM"
      
  sub_level_for_optum:
    - name: "Optum Internal"
      threat: "HIGH"
      counter: "VA-specific needs"
      
    - name: "Accenture Federal Services"
      threat: "HIGH"
      counter: "Cost; SB credit"
      
    - name: "Deloitte"
      threat: "HIGH"
      counter: "Cost; SB credit"
      
    - name: "Booz Allen Hamilton"
      threat: "MEDIUM"
      counter: "Relationship"
```

---

## ENTITY STRUCTURE

```yaml
entities:
  rockitdata:
    full_name: "rockITdata, LLC"
    type: "Small Business"
    certifications:
      - "WOSB"
      - "SDVOSB"
    role: "Protégé (under AFS Mentor-Protégé)"
    use_for: "Direct sub to Optum (Primary Track)"
    
  arazzo:
    full_name: "Arazzo"
    type: "Joint Venture"
    structure: "rockITdata (Protégé) + Accenture Federal Services (Mentor)"
    mentor: "Accenture Federal Services"
    use_for: "Sub to West Prime (Hedge Track)"
    past_performance: "TRICARE AWS Connect (via TriWest)"
```

---

## TIMELINE

```yaml
milestones:
  - date: "2026-01-20"
    event: "Outreach to all Primes (Optum, TriWest, Humana)"
    
  - date: "2026-01-22"
    event: "Pre-Proposal Conference (DC Metro)"
    
  - date: "2026-01-24"
    event: "Post-conference follow-up; assess repair progress"
    
  - date: "2026-01-27"
    event: "Capability briefs prepared; KP confirmed"
    
  - date: "2026-01-31"
    event: "GATE 1: West Prime Selection Decision"
    
  - date: "2026-02-14"
    event: "GATE 2: Teaming Agreements Signed"
    
  - date: "2026-02-21"
    event: "Technical content and PP narratives complete"
    
  - date: "2026-02-28"
    event: "Content delivered to Prime(s)"
    
  - date: "2026-03-01"
    event: "GATE 3: Final Go/No-Go"
    
  - date: "2026-03-07"
    event: "Prime Red Team reviews"
    
  - date: "2026-03-16"
    event: "PROPOSAL DUE TO VA (2:00 PM EST)"
```

---

## VERSION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-17 | Capture Team | Initial release; dual-track strategy; Humana added as hedge option |

---

**END OF PIPELINE UPDATE DOCUMENT**
