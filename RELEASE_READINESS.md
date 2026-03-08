# RELEASE_READINESS.md
**Status:** RELEASE CANDIDATE
**Branch:** v2-development
**HEAD:** d4e426b
**Prepared:** 2026-03-08
**Prepared by:** Forge (Autonomous DevSecOps Agent)
**Review required by:** CEO (Go/No-Go authority per TASK_CONTRACT.json)

---

## Summary Judgment

`v2-development` is **READY TO MERGE** into `main` with one documented risk acknowledged.
All blocking quality and security gates have passed. Two infrastructure-layer items are
open but do not block the merge -- they are tracked, mitigated at the application layer,
and documented with concrete remediation paths.

---

## Phase 1 -- Branch and Repo State

| Item | Result |
|------|--------|
| Current branch | v2-development |
| Working tree | Clean |
| Local ahead of remote | 0 commits |
| main aligned with origin/main | Yes |
| Branches diverged | No |

---

## Phase 2 -- Build and Quality Verification

Every command below was run against the actual branch. Results are from command output,
not assumption.

**TypeScript strict typecheck**
Command: `npx tsc --noEmit`
Result: PASS -- zero errors

**ESLint**
Command: `npm run lint`
Result: PASS -- zero errors, zero warnings that block

**Unit and integration tests**
Command: `npx vitest run --coverage`
Result: PASS -- 139 test files, 1546 tests, 0 failures, 0 skipped

**Coverage thresholds**
Result: PASS -- all thresholds met (see COVERAGE_POLICY.md for detail)

**Production build**
Command: `npm run build`
Result: PASS -- 127 pages compiled, zero build errors

---

## Phase 3 -- Security Gate Audit

Results mapped to SECURITY_GATES.md v2.0 (7 gates). Full detail in SECURITY_NOTES.md.

| Gate | Control Area | Status |
|------|-------------|--------|
| Gate 1: Secret Isolation | SC-12 | PASS |
| Gate 2: Data Boundary Enforcement | AC-3, AC-4 | PASS |
| Gate 3: RBAC Compliance | AC-2, AC-6 | PASS |
| Gate 4: Audit Trail Integrity | AU-2, AU-3, AU-9 | PASS |
| Gate 5: CUI Protection | MP-3, SC-8 | PASS |
| Gate 6: Input Validation | SI-10, SI-11 | PASS |
| Gate 7: Session Management | AC-11, AC-12 | PASS |

---

## Phase 4 -- Security Vulnerabilities Resolved This Sprint

Six vulnerabilities were identified in the launch-readiness audit and patched before this
release candidate was prepared. All six are confirmed closed by code inspection and test
coverage.

**VULN-001: Invitation bypass (Severity: Critical)**
File: `app/(auth)/join/[token]/actions.ts`
The join-workspace action was consuming `company_id` and `role` directly from FormData,
allowing an attacker to supply an arbitrary role on account creation. Fix: the invitation
record is now fetched from `user_invitations` first; `company_id` and `role` are extracted
from the DB row, not from client-submitted form fields. Used or non-pending invitations are
rejected before any auth operation occurs.

**VULN-002: Missing tenant isolation on addLaborCategory (Severity: High)**
File: `app/(dashboard)/pipeline/[id]/pricing/actions.ts`
A cross-tenant write was possible because `cost_volumes` ownership was not verified before
insert. Fix: the calling user's `company_id` is resolved from `profiles`, then the target
`cost_volumes` row is verified to belong to that company before proceeding. NaN guard added
for numeric inputs.

**VULN-003: Cross-tenant proposal outline operations (Severity: High)**
File: `app/(dashboard)/proposals/actions.ts`
`deleteProposalOutline` and `createProposalOutline` had no tenant scoping. A user could
delete or create outlines against an opportunity owned by another company. Fix: both
operations now resolve `company_id` from `profiles` and scope the DB operation accordingly.

**VULN-004: Admin engagement route hardcoded role check (Severity: Medium)**
File: `app/api/admin/engagement/[companyId]/route.ts`
Authorization was a string comparison (`profile?.role !== 'executive'`) that bypassed the
canonical `hasPermission()` system. No company scoping existed. Fix: replaced with
`resolveRole()` + `hasPermission(role, 'admin', 'canEdit')`, and added company scope check.

**VULN-005: Admin pilots route same pattern (Severity: Medium)**
File: `app/api/admin/pilots/[id]/route.ts`
Identical hardcoded role check, no ownership verification on `company_subscriptions`. Fix:
same RBAC correction + subscription ownership lookup before any action.

**VULN-006: Missing CSP frame-ancestors directive (Severity: Medium)**
File: `middleware.ts`
The Content Security Policy lacked `frame-ancestors 'none'`, leaving clickjacking as a
possible attack vector. Fix: directive added to the CSP header chain.

---

## Phase 5 -- Open Items (Non-Blocking)

These items are documented, mitigated at the application layer, and tracked for the next
infrastructure sprint. They do not block this merge.

**OPEN-001: Token ledger TOCTOU race condition**
Risk level: Medium (requires concurrent requests to exploit)
Current mitigation: Application-layer checks reduce window; low probability under normal
single-user load.
Remediation: PostgreSQL RPC `consume_tokens_atomic` using `FOR UPDATE` row locking
eliminates the race entirely. Migration file included in this sprint package at
`migrations/fix_token_ledger_toctou.sql`. Target: deploy before GA launch.

**OPEN-002: In-memory rate limiting**
Risk level: Low-Medium (only meaningful under multi-instance Netlify scale-out)
Current mitigation: Supabase RLS and auth gating limit abuse surface. Single-instance
deploys are not affected.
Remediation: Upstash Redis integration using `@upstash/ratelimit`. Full implementation
spec in SECURITY_NOTES.md. Target: deploy when Netlify functions scale beyond one instance.

---

## Phase 6 -- Deploy Safety

| Config Item | Status |
|-------------|--------|
| `netlify.toml` build command | `npm run build` -- correct |
| `netlify.toml` publish directory | `.next` -- correct |
| `@sentry/netlify-build-plugin` | Absent -- confirmed on both branches |
| `@netlify/plugin-nextjs` | Present -- required |
| Hardcoded secrets in config | None detected |
| Security headers | Present in middleware.ts |

Next Netlify branch deploy is expected to succeed.

---

## Human-in-the-Loop Gate (Per SECURITY_GATES.md)

The following changes in this release candidate require your awareness before merge. No
action is required from you to approve them -- this is notification only, consistent with
SECURITY_GATES.md policy.

`middleware.ts` was modified (CSP header addition). This file controls auth for the entire
application. The change is additive only (`frame-ancestors 'none'` directive). No auth
flow was altered.

No RLS policies, database migrations, new role definitions, or service-role access patterns
were changed in this release candidate.

---

## Final Checklist

- [x] TypeScript: 0 errors
- [x] Lint: 0 errors
- [x] Tests: 1546/1546 passing
- [x] Coverage thresholds: all met
- [x] Production build: 127 pages, 0 errors
- [x] Security vulnerabilities: 6/6 closed
- [x] Open items: 2 documented with remediation paths
- [x] Deploy config: clean
- [x] Working tree: clean
- [x] Branch synced with remote: yes
- [x] Human-in-the-loop notifications: complete

---

## GO / NO-GO Recommendation

**GO.**

`v2-development` is merge-ready. All quality gates pass. All blocking security
vulnerabilities are patched. Open infrastructure items have documented remediation paths
and do not represent unacceptable risk for a staging-to-production merge at this stage of
the product lifecycle.

Recommended merge command:

```bash
git checkout main
git merge --no-ff v2-development -m "release: merge v2-development -- security patch sprint, 1546 tests passing"
git push origin main
```

After merge, trigger a manual Netlify deploy from the Netlify dashboard to confirm
production deploy succeeds end-to-end.
