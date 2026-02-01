# CUI Auto-Classification Engine - Technical Brief

**Version:** 1.0  
**Last Updated:** February 1, 2026  
**Owner:** Mission Meets Tech (MMT)  
**Classification:** CUI // SP-PROPIN

---

## EXECUTIVE SUMMARY

MissionPulse's CUI Auto-Classification Engine automatically detects Controlled Unclassified Information (CUI) in user queries and routes them to appropriate AI systems based on data sensitivity. This ensures compliance with NIST 800-171, CMMC 2.0, and DHS CUI requirements without requiring manual classification by end users.

---

## HOW IT WORKS

### Three-Layer Detection Architecture

The CUI Auto-Classification Engine uses a multi-layer detection approach:

**Layer 1: Regex Pattern Matching**

Pre-compiled patterns detect explicit CUI markers and known sensitive patterns:
- Classification markings (CUI, FOUO, SP-PROPIN)
- Social Security Number patterns
- Contract/CAGE/UEI number formats
- DoD document identifiers

**Layer 2: Keyword Combination Analysis**

Context-aware keyword matching identifies sensitive combinations:
- Pricing + Government + Contract → SP-PROPIN
- Medical + Patient + Federal → SP-PRVCY
- Technical + Proprietary + Contractor → CTI

**Layer 3: Agent Context Defaults**

Certain AI agents automatically apply CUI classification:
- Pricing Agent → Always routes to AskSage (SP-PROPIN)
- Black Hat Agent → Always routes to AskSage (SP-CTI)
- Compliance Agent → Context-dependent routing

---

## CUI CATEGORIES DETECTED

| Category Code | Full Name | Triggers |
|---------------|-----------|----------|
| **SP-PROPIN** | Specified Proprietary Information | Pricing, rates, margins, cost data |
| **SP-PRVCY** | Specified Privacy | Personnel data, medical info, PII |
| **SP-SSEL** | Specified Source Selection | Evaluation criteria, scoring data |
| **SP-FEDCON** | Specified Federal Contract | Contract terms, modifications, CLINs |
| **CTI** | Controlled Technical Information | Technical specs, drawings, designs |

---

## AI MODEL ROUTING

Based on classification results, queries are routed to appropriate AI systems:

| Classification | AI Model | Authorization |
|----------------|----------|---------------|
| No CUI Detected | Anthropic Claude | Standard |
| CUI Detected | AskSage | FedRAMP High |
| Explicit CUI Marking | AskSage | FedRAMP High |
| Pricing/Black Hat Agent | AskSage | FedRAMP High |

> **Enterprise Requirement:** AskSage routing requires Enterprise subscription. Professional users receive CUI detection warnings but queries route to Claude with enhanced logging.

---

## AUDIT LOGGING

Every classification decision is logged to `cui_classification_audit` table:

| Field | Description |
|-------|-------------|
| `id` | Unique audit record ID |
| `query_hash` | SHA-256 hash of query (never raw CUI) |
| `classification_result` | Detected CUI category or NONE |
| `detection_layer` | Which layer triggered (regex/keyword/agent) |
| `model_routed` | AskSage or Claude |
| `user_id` | User who submitted query |
| `agent_id` | AI agent that received query |
| `created_at` | Timestamp (UTC) |

**Privacy Protection:** Raw query text is never stored in audit logs. Only SHA-256 hashes are retained for forensic analysis.

---

## CONFIGURATION OPTIONS

Administrators can adjust CUI detection in Admin Settings → Features:

| Setting | Options | Description |
|---------|---------|-------------|
| Auto-Classification | On/Off | Enable/disable automatic detection |
| Default Model | AskSage/Claude | Fallback when detection inconclusive |
| Strictness | Low/Medium/High | Detection sensitivity level |

**Strictness Levels:**

- **Low:** Only explicit CUI markers and obvious patterns
- **Medium:** Balanced detection with context awareness
- **High:** Maximum sensitivity, may produce false positives

---

## COMPLIANCE ALIGNMENT

The CUI Auto-Classification Engine satisfies these NIST 800-53 Rev 5 controls:

| Control | Requirement | Implementation |
|---------|-------------|----------------|
| **SC-7** | Boundary Protection | Routes CUI to authorized systems only |
| **SC-8** | Transmission Confidentiality | TLS 1.3 for all AI model connections |
| **AU-3** | Audit Records | SHA-256 query hashes logged immutably |
| **AC-3** | Access Enforcement | Agent-level routing enforcement |

---

## USER EXPERIENCE

From the end user's perspective:

1. User types a query in any AI chat widget
2. System instantly classifies the query (< 50ms)
3. If CUI detected, a subtle banner appears: "🔒 Secure AI: Your query is being processed by a FedRAMP High authorized system"
4. Response is returned with appropriate classification marking
5. User continues working without workflow interruption

**No Manual Classification Required:** The system handles all classification automatically, reducing user burden and classification errors.

---

## TECHNICAL IMPLEMENTATION

**Backend Files:**
- `cui_classifier.py` - Classification engine
- `model_router.py` - AI model routing logic

**Database Tables:**
- `cui_classification_audit` - Immutable audit log

**API Endpoint:**
- `POST /api/classify` - Query classification
- `POST /api/agents/{id}/chat` - Updated with CUI routing

---

## LEARN MORE

- [Admin Settings Guide](/docs/admin-settings-guide) - Configure CUI settings
- [SSP Control Narratives](/docs/ssp-controls) - Compliance documentation
- [Security Architecture](/docs/security-architecture) - System security overview

---

*Classification: CUI // SP-PROPIN*  
*Mission Meets Tech - MissionPulse*  
*Mission. Technology. Transformation.*  
*AI GENERATED - REQUIRES HUMAN REVIEW*
