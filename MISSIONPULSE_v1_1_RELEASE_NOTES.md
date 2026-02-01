# MissionPulse v1.1 Release Notes

**Release Date:** February 1, 2026  
**Version:** 1.1.0  
**Codename:** Solo Strike  
**Classification:** UNCLASSIFIED // FOR PUBLIC RELEASE

---

## RELEASE HIGHLIGHTS

MissionPulse v1.1 introduces **Solo Proposal Manager Mode** for small business operators and **CUI Auto-Classification** for automated compliance protection. This release democratizes enterprise-grade proposal management for companies of any size while enhancing data security for all users.

---

## NEW FEATURES

### 🚀 Solo Proposal Manager Mode

**For:** Small businesses (1-10 employees), solo BD professionals, companies without dedicated proposal staff

Solo Mode transforms MissionPulse into a personal proposal command center where a single operator can manage the complete capture-to-submission lifecycle.

**Key Capabilities:**

- **6-Phase Guided Workflow:** Step-by-step Shipley methodology from Discovery through Final Review
- **AI Virtual Team:** All 8 AI agents serve as your virtual Capture Manager, Pricing Analyst, Compliance Officer, and more
- **Self-Approval Gates:** Make go/no-go decisions with AI recommendations at each checkpoint
- **Simplified Interface:** Streamlined UI without multi-team coordination complexity
- **New SOLO_OWNER Role:** Full permissions across all modules with self-gate authority

**How to Enable:**
1. Navigate to Admin Settings → Features
2. Toggle "Solo Proposal Manager Mode" to ON
3. Start a new proposal and select "Start in Solo Mode"

**Subscription Requirement:** Professional or Enterprise tier

[SCREENSHOT: Solo Mode dashboard with 6-phase timeline]

---

### 🔒 CUI Auto-Classification Engine

**For:** All users handling Controlled Unclassified Information

MissionPulse now automatically detects CUI in your AI queries and routes them to FedRAMP High authorized systems—no manual classification required.

**Key Capabilities:**

- **Three-Layer Detection:** Regex patterns, keyword combinations, and agent context defaults
- **Automatic Routing:** CUI queries → AskSage (FedRAMP High); Non-CUI → Standard AI
- **Immutable Audit Logging:** SHA-256 query hashes (never raw CUI) for compliance
- **5 CUI Categories:** SP-PROPIN, SP-PRVCY, SP-SSEL, SP-FEDCON, CTI

**How It Works:**

1. Type your query in any AI chat widget
2. System classifies the query in < 50ms
3. CUI detected? Query routes to AskSage automatically
4. Secure indicator appears: "🔒 Secure AI: Your query is being processed by a FedRAMP High authorized system"

**Compliance Coverage:**
- NIST 800-53 Rev 5: SC-7, SC-8, AU-3, AC-3
- CMMC 2.0 Level 2
- NIST 800-171 r2

[SCREENSHOT: CUI detection banner in AI chat]

---

### ⚙️ Enhanced Admin Settings

**For:** Executive, Operations, and Admin roles

The new Admin Settings module provides centralized control over features, subscriptions, and security.

**New Admin Settings Tabs:**

| Tab | Functions |
|-----|-----------|
| **Company Settings** | CAGE, UEI, NAICS, set-aside certifications |
| **Features** | Solo Mode toggle, CUI classification settings |
| **Subscription** | Tier management, usage metrics |
| **Security** | MFA, session timeout, password policy |
| **Users & Roles** | Team management, role assignments |
| **Integrations** | Microsoft 365, HubSpot, SharePoint |
| **Audit Log** | View and export administrative actions |

**URL:** `missionpulse-admin-settings.html`

[SCREENSHOT: Admin Settings dashboard]

---

## DATABASE CHANGES

### New Tables

| Table | Purpose |
|-------|---------|
| `solo_mode_gates` | Tracks gate approvals for Solo Mode proposals |
| `cui_classification_audit` | Immutable audit log for CUI routing decisions |
| `solo_mode_phase_config` | Configurable Shipley phase parameters |

### New Columns

| Table.Column | Type | Purpose |
|--------------|------|---------|
| `companies.solo_mode` | BOOLEAN | Feature flag |
| `companies.solo_mode_enabled_at` | TIMESTAMP | Enablement timestamp |
| `companies.solo_mode_enabled_by` | UUID | User who enabled |
| `companies.subscription_tier` | TEXT | starter/professional/enterprise |

### New Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `get_my_company_id()` | UUID | Returns current user's company ID |
| `get_user_role()` | TEXT | Returns current user's role |
| `is_user_solo_mode()` | BOOLEAN | Checks if user is in Solo Mode |
| `log_cui_classification()` | VOID | Audit logging for CUI decisions |

---

## API CHANGES

### New Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/classify` | Classify query for CUI content |
| GET | `/api/solo-mode/phases` | Get phase configuration |
| POST | `/api/solo-mode/gates` | Record gate decision |
| GET | `/api/admin/settings` | Retrieve admin settings |
| PUT | `/api/admin/settings` | Update admin settings |

### Updated Endpoints

| Endpoint | Change |
|----------|--------|
| `POST /api/agents/{id}/chat` | Added CUI classification and routing |
| `GET /api/proposals` | Added Solo Mode filter parameter |
| `POST /api/proposals` | Added Solo Mode creation option |

---

## RBAC UPDATES

### New Role: SOLO_OWNER

| Attribute | Value |
|-----------|-------|
| ID | `solo_owner` |
| Display Name | Solo Owner |
| Type | Internal |
| UI Complexity | Admin |
| Inherits From | All 11 Shipley roles |

**Module Access:** Full access to all modules including Pricing and Black Hat

**AI Agents:** Access to all 8 agents with full override capability

**Gate Authority:** Can approve all gates (self-approval)

---

## SECURITY ENHANCEMENTS

- **CUI Boundary Protection:** Automatic routing prevents CUI exposure to unauthorized systems
- **Hash-Only Audit Logging:** Query content never stored in audit logs
- **Subscription-Based Feature Gating:** Solo Mode enforced at server level, not just UI
- **Solo Mode Audit Trail:** All gate decisions and AI overrides logged immutably

---

## KNOWN ISSUES

| Issue | Workaround | Status |
|-------|------------|--------|
| Solo Mode conversion may take 30+ seconds for large proposals | Wait for completion notification | Investigating |
| CUI classification may false-positive on certain medical terms | Adjust strictness to "Low" in Admin Settings | By design |
| AskSage routing requires Enterprise tier | Professional users see CUI warnings but route to Claude | By design |

---

## UPGRADE INSTRUCTIONS

### For Netlify Deployments (Standard)

1. Pull latest from `main` branch
2. Deploy via Netlify (auto-deploy enabled)
3. Run Supabase migrations (see `migrations/v1.1/`)

### Database Migrations

Execute in order:
1. `001_create_solo_mode_tables.sql`
2. `002_create_cui_audit_table.sql`
3. `003_add_company_columns.sql`
4. `004_create_helper_functions.sql`
5. `005_add_rls_policies.sql`

### Backend API Deployment

1. Update `cui_classifier.py` and `model_router.py`
2. Redeploy to Render.com
3. Verify health check: `GET /health`

---

## DOCUMENTATION UPDATES

| Document | Changes |
|----------|---------|
| Solo Mode User Guide | **NEW** - Complete user documentation |
| Admin Settings Guide | Updated with new tabs and settings |
| CUI Technical Brief | **NEW** - Classification engine documentation |
| SSP Control Narratives | Updated SC-7, SC-8, AU-3, AC-3 |
| Demo Script | Added Solo Mode walkthrough |
| Training Package | Solo Mode module added |

---

## WHAT'S NEXT (v1.2 Preview)

- **SAM.gov Integration:** Auto-import opportunities from SAM.gov
- **HubSpot Bidirectional Sync:** Two-way CRM synchronization
- **Mobile App (Beta):** iOS and Android companion apps
- **Advanced Analytics Dashboard:** B&P efficiency metrics and trend analysis
- **Deltek GovWin Integration:** Opportunity intelligence feed

---

## SUPPORT

**Documentation:** https://docs.missionpulse.io  
**Support Email:** support@missionpulse.io  
**Status Page:** https://status.missionpulse.io

---

*Classification: UNCLASSIFIED // FOR PUBLIC RELEASE*  
*Mission Meets Tech - MissionPulse v1.1.0*  
*Mission. Technology. Transformation.*
