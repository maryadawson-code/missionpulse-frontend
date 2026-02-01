# MissionPulse SSP Control Narrative Updates - v1.1

**Document:** System Security Plan Appendix - Control Narrative Updates  
**Version:** 1.1  
**Last Updated:** February 1, 2026  
**Classification:** CUI // SP-PROPIN  
**Prepared By:** Mission Meets Tech Security Team

---

## PURPOSE

This document provides updated control narratives for the MissionPulse System Security Plan (SSP) to reflect Sprint 29 features: Solo Mode and CUI Auto-Classification Engine.

These narratives should be incorporated into the master SSP document: `MissionPulse_SSP_CMMC_Level2_v2_1.docx`

---

## SC-7: BOUNDARY PROTECTION

### Control Statement
The information system monitors and controls communications at the external boundary of the system and at key internal boundaries within the system.

### Updated Implementation Narrative

MissionPulse implements boundary protection through the CUI Auto-Classification Engine, which enforces strict data flow controls between the user interface, internal AI agents, and external AI model providers.

**Boundary Protection Mechanisms:**

1. **AI Model Boundary Enforcement:** The CUI Auto-Classification Engine (`cui_classifier.py`) analyzes all user queries before transmission to AI systems. Queries containing CUI indicators are automatically routed to FedRAMP High authorized systems (AskSage), while non-sensitive queries may be processed by standard AI systems (Anthropic Claude).

2. **Three-Layer Detection:** The system employs three detection layers to identify CUI:
   - Layer 1: Regex pattern matching for explicit CUI markers
   - Layer 2: Keyword combination analysis for context-sensitive detection
   - Layer 3: Agent context defaults for inherently sensitive workflows

3. **Agent-Level Boundaries:** Certain AI agents (Pricing Agent, Black Hat Agent) automatically classify all queries as CUI regardless of content, ensuring sensitive business functions always route to authorized systems.

4. **Solo Mode Boundary Controls:** Solo Mode consolidates role permissions under a single Solo Owner identity while maintaining all boundary protection controls. Solo Mode users cannot bypass CUI routing regardless of their elevated permissions.

**Evidence:**
- `cui_classifier.py` - Classification engine source code
- `model_router.py` - Routing logic source code
- `cui_classification_audit` table schema
- Audit logs demonstrating classification decisions

---

## SC-8: TRANSMISSION CONFIDENTIALITY

### Control Statement
The information system protects the confidentiality of transmitted information.

### Updated Implementation Narrative

MissionPulse protects transmission confidentiality for all AI model communications, particularly those containing or potentially containing CUI.

**Confidentiality Protections:**

1. **TLS 1.3 Encryption:** All communications between MissionPulse and external AI providers are encrypted using TLS 1.3. This includes:
   - User queries transmitted to classification engine
   - Classified queries transmitted to AskSage (FedRAMP High)
   - Classified queries transmitted to Anthropic Claude
   - AI model responses returned to users

2. **CUI-in-Transit Protection:** When the CUI Auto-Classification Engine determines a query contains CUI, the query is:
   - Routed exclusively through HTTPS connections
   - Transmitted only to FedRAMP High authorized endpoints
   - Never cached in intermediate systems
   - Logged by hash only (SHA-256), never in plaintext

3. **Solo Mode Transmission Security:** Solo Mode does not alter transmission confidentiality controls. All queries, regardless of user role, are subject to the same encryption and routing requirements.

4. **Audit Hash Protection:** The `cui_classification_audit` table stores SHA-256 hashes of classified queries rather than raw text, ensuring that even database administrators cannot access CUI content through audit records.

**Evidence:**
- TLS certificate configuration
- Network traffic analysis showing TLS 1.3 negotiation
- `cui_classification_audit` table demonstrating hash-only storage
- AskSage FedRAMP authorization documentation

---

## AU-3: CONTENT OF AUDIT RECORDS

### Control Statement
The information system generates audit records containing information that establishes what type of event occurred, when the event occurred, where the event occurred, the source of the event, the outcome of the event, and the identity of any individuals or subjects associated with the event.

### Updated Implementation Narrative

MissionPulse generates comprehensive audit records for CUI classification decisions and Solo Mode gate approvals.

**Audit Record Content - CUI Classification:**

Each CUI classification event generates an audit record in `cui_classification_audit` containing:

| Field | Description | AU-3 Requirement |
|-------|-------------|------------------|
| `id` | Unique record identifier | Event identification |
| `query_hash` | SHA-256 hash of query | Event source (privacy-protected) |
| `classification_result` | CUI category detected | Event type |
| `detection_layer` | Regex/Keyword/Agent | Event details |
| `model_routed` | AskSage or Claude | Event outcome |
| `user_id` | Authenticated user UUID | Subject identity |
| `agent_id` | AI agent identifier | Event location |
| `created_at` | UTC timestamp | Event time |

**Audit Record Content - Solo Mode Gates:**

Each Solo Mode gate approval generates an audit record in `solo_mode_gates` containing:

| Field | Description | AU-3 Requirement |
|-------|-------------|------------------|
| `id` | Unique record identifier | Event identification |
| `proposal_id` | Associated proposal | Event source |
| `phase` | Shipley phase number | Event type |
| `gate_decision` | GO/CONDITIONAL/PAUSE/NO-GO | Event outcome |
| `ai_recommendation` | AI-suggested decision | Event details |
| `override_flag` | Whether user overrode AI | Event details |
| `override_rationale` | User's stated reason | Event details |
| `user_id` | Solo Owner UUID | Subject identity |
| `created_at` | UTC timestamp | Event time |

**Audit Record Integrity:**

All audit tables are configured with Row Level Security (RLS) policies that:
- Prevent modification of existing records
- Allow append-only operations for new records
- Restrict deletion to database administrators only
- Maintain referential integrity with user and proposal tables

**Evidence:**
- `cui_classification_audit` table schema and sample records
- `solo_mode_gates` table schema and sample records
- RLS policy definitions
- Database trigger configurations

---

## AC-3: ACCESS ENFORCEMENT

### Control Statement
The information system enforces approved authorizations for logical access to information and system resources in accordance with applicable access control policies.

### Updated Implementation Narrative

MissionPulse enforces access controls for CUI classification settings and Solo Mode capabilities through role-based access control (RBAC) and subscription-based feature gating.

**Access Enforcement - CUI Classification:**

1. **Administrative Controls:** Only users with Executive, Operations, or Admin roles can modify CUI classification settings in Admin Settings:
   - Enable/disable auto-classification
   - Adjust classification strictness level
   - Configure default AI model routing

2. **Classification Override Prevention:** End users cannot override CUI classification decisions. If the system determines a query contains CUI, routing to FedRAMP High systems is mandatory regardless of user preference or role.

3. **Audit Log Access:** CUI classification audit logs are visible only to Executive and Admin roles. The `cui_classification_audit` table implements RLS policies restricting SELECT operations to authorized roles.

**Access Enforcement - Solo Mode:**

1. **Feature Gating:** Solo Mode is gated by subscription tier. The `companies.subscription_tier` field must be 'professional' or 'enterprise' for Solo Mode features to render.

2. **Role-Based Enablement:** Only users with Executive, Operations, or Admin roles can enable Solo Mode for the organization through Admin Settings.

3. **Solo Owner Role:** When Solo Mode is enabled for a proposal, the system creates a SOLO_OWNER role assignment that:
   - Inherits permissions from all 11 Shipley roles
   - Grants self-approval authority for all gates
   - Maintains full access to all AI agents
   - Cannot be shared with other users for the same proposal

4. **Gate Enforcement:** Solo Mode gate decisions are enforced by `solo_mode_gates` table constraints:
   - Each phase requires gate approval before proceeding
   - Gate decisions are immutable once recorded
   - AI recommendations are logged but do not override user decisions

**Invisible RBAC Implementation:**

Solo Mode maintains MissionPulse's invisible RBAC principle: features that users cannot access do not render in the DOM. Starter subscription users never see Solo Mode options regardless of their role assignments.

**Evidence:**
- RBAC configuration (`roles_permissions_config.json`)
- Supabase RLS policies
- Frontend conditional rendering logic
- Subscription tier validation code

---

## ATTESTATION

These control narrative updates have been reviewed and approved for inclusion in the MissionPulse System Security Plan.

| Role | Name | Date |
|------|------|------|
| System Owner | Mary Womack | _____________ |
| ISSO | _____________ | _____________ |
| Authorizing Official | _____________ | _____________ |

---

*Classification: CUI // SP-PROPIN*  
*Mission Meets Tech - MissionPulse*  
*AI GENERATED - REQUIRES HUMAN REVIEW FOR ATO SUBMISSION*
