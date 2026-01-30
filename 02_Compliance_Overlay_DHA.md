# DHA Compliance Overlay (NIST 800-53 Rev 5) for AI Systems

## High-Priority Controls for MissionPulse

### AC (Access Control)
- **AC-2 (Account Management):** Automated auditing of accounts. "Public Trust" users must NOT access "Secret" datasets via AI inference.
- **AC-3 (Access Enforcement):** The AI must respect the *user's* data permissions. If User A cannot see "Table X" in Advana, the AI cannot summarize "Table X" for them.

### AU (Audit & Accountability)
- **AU-3 (Content of Audit Records):** Logs MUST contain:
  1. Original User Prompt (Hashed).
  2. Sanitized Prompt sent to LLM.
  3. Token Usage / Cost.
  4. Timestamp (UTC).
  5. User Distinguished Name (DN) from CAC.

### SC (System and Communications Protection)
- **SC-7 (Boundary Protection):** STRICT separation between the Application Layer (MissionPulse) and External Inference Layer (AskSage).
- **SC-13 (Cryptographic Protection):** All data in transit must use FIPS 140-2 validated modules. (No standard SSL; must be FIPS-mode).

### SI (System and Information Integrity)
- **SI-10 (Information Input Validation):** - **Constraint:** All inputs to the LLM must be validated for "Prompt Injection" attacks.
  - **Requirement:** Input length limits, character whitelisting, and "System Instruction" reinforcement.
