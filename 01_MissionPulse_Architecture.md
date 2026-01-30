# MissionPulse System Architecture & Data Flow

## System Overview
MissionPulse is a secure orchestration layer (Middleware) designed to interface between Federal Health users, the AskSage GenAI platform, and the Advana data reservoir.

## Architecture Components
1. **The User (Client):** Validated DoD Common Access Card (CAC) holder. Accesses via IL5 network.
2. **MissionPulse (The Orchestrator):** - Hosted in: FedRAMP Moderate / IL5 Environment.
   - Responsibilities: Identity Management (ICAM), Prompt Sanitization, Context Retrieval, Audit Logging.
3. **AskSage (The Brain):** - External GenAI API. 
   - Constraint: TREATED AS UNTRUSTED PUBLIC ZONE. No PII/PHI or Raw CUI allowed here.
4. **Advana (The Vault):** - DoD Data Reservoir. 
   - Constraint: INTERNAL TRUSTED ZONE. Source of Truth.

## The "Golden Path" (Data Flow)
1. **Ingest:** User submits query -> MissionPulse intercepts.
2. **Sanitize:** MissionPulse scrubs PII/CUI using Regex & NLP entity recognition.
3. **Augment:** MissionPulse queries Advana for *context* (RAG pattern) via secure API.
4. **Construct:** MissionPulse builds a "Safe Prompt" (User Query + Sanitized Advana Context).
5. **Inference:** Safe Prompt sent to AskSage API.
6. **Reconstruct:** AskSage response received -> MissionPulse re-injects specific mission details (if redacted).
7. **Deliver:** Final response displayed to user with "Confidence Score" and "Source Citations."

## Critical Boundaries
- **Boundary A (The Airgap):** Between MissionPulse and AskSage. Encryption: TLS 1.3 (FIPS).
- **Boundary B (The Vault Door):** Between MissionPulse and Advana. Auth: mTLS + OAuth 2.0.
