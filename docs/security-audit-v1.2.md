# MissionPulse v1.2 Security Audit

**Date:** February 2026
**Auditor:** Automated + Manual Review
**Scope:** All v1.1 + v1.2 features (Sprints 19-28)

---

## 1. OAuth Integration Security

### Google Workspace (T-26.1)
- [ ] OAuth tokens stored in `integrations.credentials_encrypted` (not plaintext)
- [ ] Refresh token rotation enabled
- [ ] Scopes minimized: Drive, Calendar, Gmail (read/write only as needed)
- [ ] Client secret in server-only env var (`GOOGLE_CLIENT_SECRET`), never `NEXT_PUBLIC_`
- [ ] Token expiry checked before every API call

### DocuSign (T-26.2)
- [ ] OAuth tokens in `integrations.credentials_encrypted`
- [ ] Production vs demo environment properly separated
- [ ] RSA key for JWT auth stored server-side only
- [ ] Envelope callbacks validated (webhook signature)

### Microsoft 365 (T-23.1, T-28.3)
- [ ] MSAL tokens in `integrations.credentials_encrypted`
- [ ] Tenant-specific vs multi-tenant properly configured
- [ ] Graph API permissions follow least-privilege principle
- [ ] Teams adaptive card actions validated server-side

### Salesforce (T-22.1)
- [ ] OAuth tokens in `integrations.credentials_encrypted`
- [ ] Connected app permissions scoped to required objects only
- [ ] Webhook payloads validated

### Slack (T-23.3)
- [ ] Bot token in server-only env var
- [ ] Slash command signatures validated
- [ ] Interactive component payloads verified

---

## 2. Data Flow Security

### Real-time Collaboration (T-28.1)
- [ ] Supabase Realtime channels respect RLS policies
- [ ] Presence data does not leak across companies
- [ ] Section locks cannot be spoofed (user ID validated)
- [ ] Channel names include opportunity ID (scoped)

### In-app Commenting (T-28.2)
- [ ] Comments stored in `activity_feed` with company_id scoping
- [ ] @role mentions only notify users in same company
- [ ] Comment content sanitized (no XSS in rendered HTML)
- [ ] Role-based visibility enforced

### RAG Pipeline (T-27.1)
- [ ] Vector embeddings scoped by company_id
- [ ] Cross-company document retrieval impossible via RLS
- [ ] AI-generated summaries do not leak source data across companies

### Fine-tuning (T-27.5)
- [ ] Training data export requires executive role
- [ ] JSONL content scoped to company's own AI interactions
- [ ] Fine-tune jobs audited in `audit_logs`

---

## 3. API Surface Review

### New API Routes
| Route | Method | Auth | RBAC |
|-------|--------|------|------|
| /api/webhooks/stripe | POST | Stripe signature | N/A (webhook) |
| /api/integrations/m365/callback | GET | OAuth state param | N/A (callback) |
| /api/integrations/google/callback | GET | OAuth state param | N/A (callback) |
| /api/integrations/docusign/callback | GET | OAuth state param | N/A (callback) |

### Server Actions
All server actions use `createClient()` (cookie-based auth) and inherit RLS policies.
No server action uses `createAdminClient()` unless specifically required for cross-company operations.

---

## 4. RLS Policy Verification

### New/Modified Tables
| Table | RLS Enabled | Policy Verified |
|-------|-------------|-----------------|
| activity_feed | Yes | [ ] Company-scoped read/write |
| ai_approvals | Yes | [ ] Company-scoped via opportunity |
| ai_interactions | Yes | [ ] Company-scoped |
| integrations | Yes | [ ] Company-scoped |
| proposal_sections | Yes | [ ] Company-scoped via opportunity |
| section_versions | Yes | [ ] Section-scoped |
| companies.features | Yes | [ ] Company-scoped |

---

## 5. Secret Management

### Environment Variables Audit
| Variable | Location | Status |
|----------|----------|--------|
| SUPABASE_SERVICE_ROLE_KEY | .env.local only | [ ] Not in client code |
| STRIPE_SECRET_KEY | .env.local only | [ ] Not in NEXT_PUBLIC_ |
| GOOGLE_CLIENT_SECRET | .env.local only | [ ] Server-only |
| DOCUSIGN_INTEGRATION_KEY | .env.local only | [ ] Server-only |
| M365_CLIENT_SECRET | .env.local only | [ ] Server-only |
| SLACK_BOT_TOKEN | .env.local only | [ ] Server-only |
| ASKSAGE_API_KEY | .env.local only | [ ] Server-only |

---

## 6. CUI/OPSEC Controls

- [ ] CUI banners present on Pricing module views
- [ ] CUI banners present on Black Hat module views
- [ ] CUI-classified AI requests route only through AskSage
- [ ] Partner watermarks applied on partner-visible pages
- [ ] Audit trail immutable (no DELETE on audit_logs)

---

## 7. Penetration Test Checklist

### Authentication
- [ ] Session fixation prevention
- [ ] CSRF tokens on all state-changing forms
- [ ] Rate limiting on auth endpoints (10 req/min)
- [ ] MFA enforcement for CUI-accessing roles
- [ ] Password complexity requirements

### Authorization
- [ ] RBAC invisible pattern (no 403 pages, just missing content)
- [ ] Horizontal privilege escalation (company A accessing company B data)
- [ ] Vertical privilege escalation (partner accessing executive features)
- [ ] Direct object reference (accessing /pipeline/[otherCompanyOppId])

### Injection
- [ ] SQL injection via Supabase parameterized queries
- [ ] XSS in user-generated content (comments, descriptions)
- [ ] Command injection in file upload handlers
- [ ] SSRF in integration callback URLs

### Data Exposure
- [ ] API responses do not leak other company data
- [ ] Error messages do not reveal internal structure
- [ ] Supabase service role key not in browser bundle
- [ ] No PII in URL parameters or logs

---

## 8. Findings Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | - |
| High | 0 | - |
| Medium | 0 | - |
| Low | 0 | - |
| Info | 0 | - |

**Overall Assessment:** PENDING — Run `/verify` for automated checks.

---

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**
