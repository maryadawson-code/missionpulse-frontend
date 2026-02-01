# 🛡️ MISSIONPULSE DATA HYGIENE PROTOCOL
## Safe Stress-Testing in Commercial Environment

**Version:** 1.0  
**Effective:** Until Azure Gov ATO achieved  
**Classification:** INTERNAL USE ONLY

---

## PURPOSE

This protocol enables Mission Meets Tech to validate MissionPulse using real proposal complexity while protecting sensitive information in the commercial (non-ATO) environment.

**Remember:** Until Azure Gov deployment is complete, treat the commercial environment like a **public coffee shop WiFi** - assume everything could be exposed.

---

## 🚫 THE RED LINES (Never Upload)

### Absolutely Prohibited

| Category | Examples | Why |
|----------|----------|-----|
| **CUI-Marked Documents** | Anything with "CUI", "FOUO", "Distribution B/C/D/E" banners | DFARS 7012 violation |
| **Government-Furnished Information (GFI)** | Draft SOWs from CORs, pricing ceilings, evaluation criteria | Procurement integrity |
| **Clearable PII** | SSN, DOB + Full Name, SF-86 data, clearance levels | Privacy Act violation |
| **ITAR/EAR Controlled** | Technical drawings, specs for defense articles | Export control violation |
| **Source Selection Sensitive** | Competitor pricing, evaluator names, oral board questions | FAR 3.104 violation |
| **Client Proprietary** | rockITdata internal financials, wrap rates, indirect rates | Business confidential |

### Warning Signs to Stop

If you see ANY of these in a document, **STOP and sanitize first:**

```
□ "CUI" or "Controlled Unclassified Information"
□ "FOUO" or "For Official Use Only"  
□ "Distribution Statement B/C/D/E/F"
□ "NOFORN" or "REL TO"
□ "Source Selection Information"
□ "Procurement Sensitive"
□ Social Security Numbers (XXX-XX-XXXX pattern)
□ Dates of Birth with full names
□ Security clearance levels (TS/SCI, Secret, etc.)
□ Contract numbers with pricing (FA8XXX-XX-X-XXXX)
□ Technical drawings with ITAR markings
```

---

## ✅ THE SANITIZATION WORKFLOW

### Step 1: Pre-Upload Checklist

Before uploading ANY document, complete this checklist:

```
DOCUMENT: _________________________________
DATE: ____________________________________

□ No CUI/FOUO markings visible
□ No government contract numbers with values
□ No real agency names (or replaced with generics)
□ No real personnel names/contact info
□ No SSNs, DOBs, or clearance levels
□ No proprietary pricing (wrap rates, indirects)
□ No competitor-specific intelligence
□ No technical data with ITAR/EAR markings

SANITIZED BY: _____________________________
APPROVED BY: _____________________________
```

### Step 2: Search & Replace Scrub

Use these replacements for common sensitive terms:

| Real Term | Replacement |
|-----------|-------------|
| Department of Veterans Affairs | Federal Veterans Agency |
| Defense Health Agency | Federal Health Agency |
| Department of Defense | Federal Defense Agency |
| Centers for Medicare & Medicaid | Federal Health Services |
| [Real Project Name] | Project PHOENIX |
| [Real Contract Number] | CONTRACT-2026-0001 |
| Fort Liberty / Fort Bragg | Site Alpha |
| Walter Reed | Medical Center A |
| [Incumbent Name] | Legacy Systems Inc. |
| [Real Competitor] | Competitor A, B, C |
| rockITdata | Demo Corp |

### Step 3: Personnel Sanitization

For resumes and staffing plans:

**Original:**
```
John Smith
123 Main Street, Arlington, VA 22201
(703) 555-1234 | john.smith@email.com
DOB: 03/15/1985
Clearance: TS/SCI (Active)
```

**Sanitized:**
```
Candidate A - Senior Cloud Engineer
[Location Redacted]
[Contact Redacted]
Clearance: Active at required level
```

### Step 4: Financial Sanitization

For pricing and BOE data:

**Original:**
```
Labor Category: Cybersecurity SME IV
Direct Rate: $145.00/hr
Overhead: 85%
G&A: 12%
Fee: 8%
Wrap Rate: $312.45/hr
```

**Sanitized:**
```
Labor Category: Resource Level 4
Direct Rate: $XXX.XX/hr (use industry average)
Overhead: XX% (use synthetic rate)
G&A: XX%
Fee: X%
Wrap Rate: [Calculated]
```

**Synthetic Rate Card for Testing:**

| Level | Synthetic Direct Rate | Use For |
|-------|----------------------|---------|
| Level 1 | $45/hr | Junior/Entry |
| Level 2 | $75/hr | Mid-level |
| Level 3 | $110/hr | Senior |
| Level 4 | $145/hr | SME |
| Level 5 | $185/hr | Principal |
| Level 6 | $225/hr | Executive |

---

## 🤖 THE AI SANITIZER PROMPT

Copy this prompt into a **local/secure AI instance** (not the commercial MissionPulse) to sanitize documents before upload:

```
SYSTEM PROMPT FOR DOCUMENT SANITIZATION:

You are a Document Sanitization Assistant. Your task is to create a 
"Sanitized Twin" of sensitive documents that:

1. PRESERVES the complexity, structure, and difficulty of the original
2. REMOVES all identifying information that could cause compliance issues

REPLACEMENT RULES:
- Government agencies → Generic equivalents (e.g., "DHA" → "Federal Health Agency")
- Real locations → Generic sites (e.g., "Fort Liberty" → "Site Alpha")  
- Contract numbers → Synthetic (e.g., "FA8XXX-XX-X-XXXX" → "CONTRACT-2026-XXXX")
- Personnel names → Role-based (e.g., "John Smith" → "Candidate A")
- Companies → Generic (e.g., "Leidos" → "Large Prime A")
- Specific dates → Relative (e.g., "March 15, 2026" → "Q1 FY26")
- Dollar amounts → Ranges (e.g., "$45.2M" → "$40-50M range")

PRESERVATION RULES:
- Keep all technical requirements exactly as written
- Keep all compliance requirements (FAR/DFARS citations)
- Keep all contradictions and ambiguities (these test the system)
- Keep page limits, formats, and structural complexity
- Keep evaluation criteria and weighting

OUTPUT FORMAT:
Provide the sanitized document with [REDACTED] markers where 
information was removed, and [SYNTHETIC] markers where fake 
data was substituted.

Ready to sanitize. Paste your document below:
```

---

## 🔥 THE WIPE PROTOCOL

After completing a test (win or lose), purge the data:

### Immediate Actions (Within 24 hours of proposal submission)

```powershell
# 1. Export any learnings to sanitized format
#    (win themes, lessons learned - no specifics)

# 2. Delete opportunity from MissionPulse
#    Dashboard → Opportunity → Delete → Confirm

# 3. Clear browser cache for the test tenant
#    Chrome: Ctrl+Shift+Delete → Cached images and files

# 4. Verify deletion in Supabase
#    Supabase Dashboard → Table Editor → opportunities
#    Confirm record is removed
```

### Tenant Hygiene

For dogfooding, create a **separate tenant** in MissionPulse:

| Tenant | Purpose | Data Allowed |
|--------|---------|--------------|
| **Demo Corp** | Live proposal testing | Sanitized data only |
| **Mission Meets Tech** | Product development | Synthetic test data only |
| **[Customer Name]** | Production (post-ATO) | Real CUI (Azure Gov only) |

---

## 📋 OPERATIONAL CHECKLIST

### Before Each Test Session

```
□ Created/using "Demo Corp" tenant (not real company name)
□ All documents passed sanitization checklist
□ No CUI/FOUO markings in any uploads
□ Personnel data anonymized
□ Pricing uses synthetic rates
□ Team briefed on data hygiene rules
```

### After Each Test Session

```
□ Captured lessons learned (sanitized)
□ Deleted test opportunity from system
□ Cleared browser cache
□ Verified deletion in database
□ No sensitive data remains in commercial environment
```

### Weekly Hygiene Audit

```
□ Review all opportunities in commercial environment
□ Delete any completed/stale test data
□ Verify no real company names in tenant list
□ Check audit logs for any PII patterns
□ Update sanitization dictionary with new terms
```

---

## 🚨 INCIDENT RESPONSE

### If Sensitive Data is Accidentally Uploaded

**Immediate Actions (within 1 hour):**

1. **DELETE** the record immediately from MissionPulse
2. **DOCUMENT** what was uploaded (type, volume, duration exposed)
3. **NOTIFY** Mary Womack (as ISSO)
4. **CHECK** if data was synced to any backups
5. **ROTATE** any credentials that may have been exposed

**Assessment Questions:**

- Was CUI involved? → May require DFARS 7012 reporting
- Was PII involved? → May require breach notification
- Was client data involved? → May require client notification
- How long was data exposed? → Affects risk assessment

**Reporting (if required):**

| Data Type | Report To | Timeline |
|-----------|-----------|----------|
| CUI | DoD CIO | 72 hours |
| PII (500+ individuals) | HHS OCR | 60 days |
| Client proprietary | Client security POC | 24 hours |

---

## APPROVAL

This Data Hygiene Protocol is approved for use during the commercial validation phase of MissionPulse development.

| Role | Name | Signature | Date |
|------|------|-----------|------|
| CEO/ISSO | Mary Womack | _____________ | _____________ |

---

**Document Version:** 1.0  
**Next Review:** Upon Azure Gov ATO achievement  
**Classification:** INTERNAL USE ONLY

---

*This protocol expires automatically when MissionPulse achieves FedRAMP Moderate ATO in Azure Government.*
