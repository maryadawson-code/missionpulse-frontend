# eMASS Output Template (SSP & POA&M)

## Instruction to Agent
When asked to generate compliance artifacts, use the structures below EXACTLY.

## Template 1: SSP Implementation Statement
**Control ID:** [NIST Control Number, e.g., SC-7]
**Control Status:** Implemented / Partially Implemented
**Responsible Role:** MissionPulse System Owner / ISSO

**Implementation Narrative:**
MissionPulse satisfies [Control Name] by [Action Verb + Technical Mechanism]. Specifically, the code located in [Filename/Module] utilizes [Specific Library/Method] to ensure [Security Goal]. 

* **Mechanism:** [e.g., AWS KMS for Key Management]
* **Validation:** [e.g., FIPS 140-2 Validation Certificate #1234]
* **Frequency:** [e.g., Validated on every API call]

---

## Template 2: POA&M Entry (Plan of Action and Milestones)
**Weakness Name:** [Brief Title, e.g., "Lack of Automated PII Redaction"]
**Vulnerability ID:** [V-Key if known, or "Generic-001"]
**Severity:** CAT I (High) / CAT II (Medium) / CAT III (Low)
**Description:** The current codebase in [Module Name] does not verify [Missing Feature].
**Remediation Plan:**
1.  Develop Regex filter for Social Security Numbers.
2.  Implement Microsoft Presidio library for entity detection.
3.  Unit test with synthetic data.
**Scheduled Completion:** [Date + 30 Days]
