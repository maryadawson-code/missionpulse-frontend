# SECURITY_NOTES.md
**Status:** AUTHORITATIVE
**Version:** 1.0
**Date:** 2026-03-08
**Scope:** MissionPulse v2-development security audit -- launch-readiness sprint
**Standard:** NIST SP 800-171 Rev 2 (CUI protection), CMMC 2.0 Level 2 readiness
**Author:** Forge (Autonomous DevSecOps Agent)

---

## 1. Purpose

This document records the security posture of MissionPulse as of the v2-development
release candidate. It serves three purposes: (1) a living audit record for the SSP, (2)
a root-cause analysis for every vulnerability found and fixed, and (3) a concrete
implementation roadmap for the two remaining open items.

---

## 2. Audit Scope

The audit covered all seven security gates defined in `SECURITY_GATES.md v2.0`:

Secret Isolation (SC-12), Data Boundary Enforcement (AC-3/AC-4), RBAC Compliance
(AC-2/AC-6), Audit Trail Integrity (AU-2/AU-3/AU-9), CUI Protection (MP-3/SC-8), Input
Validation (SI-10/SI-11), and Session Management (AC-11/AC-12).

Code paths reviewed: server actions, API route handlers, middleware, auth flows, and
admin endpoints. The audit was conducted against commit `39b3cab` (the build-verified
base) and fixes were applied in commit `d4e426b`.

---

## 3. Vulnerabilities Found and Closed

### VULN-001 -- Invitation Role/Company Bypass (Critical)

**File:** `app/(auth)/join/[token]/actions.ts`

**Root cause:** The `joinWorkspace` server action accepted `company_id` and `role` as
`FormData` fields and passed them directly into `supabase.auth.signUp()` user metadata.
Any client could submit a crafted form and self-assign the `executive` role or attach
themselves to any `company_id` in the system.

**Attack path:** POST to `/join/[any-token]` with `role=executive` and
`company_id=<target-uuid>` in the request body. No server-side validation would reject it.

**Fix:** The action now fetches the invitation record from `user_invitations` using the
`invitationId` from the form, then reads `company_id` and `role` from the database row.
Client-submitted values for those fields are ignored entirely. Invitations with
`status !== 'pending'` are rejected before any auth call is made.

**NIST Controls:** AC-2 (Account Management), AC-6 (Least Privilege), IA-5 (Authenticator
Management)

---

### VULN-002 -- Cross-Tenant Labor Category Write (High)

**File:** `app/(dashboard)/pipeline/[id]/pricing/actions.ts`

**Root cause:** `addLaborCategory` inserted into `cost_labor_categories` after resolving
the target `cost_volume_id` from form data, but never verified that the `cost_volumes` row
belonged to the authenticated user's company. A user from Company A could write labor
categories into a cost volume owned by Company B if they knew or guessed the UUID.

**Attack path:** POST to the pricing action with `costVolumeId` set to a UUID from another
tenant. The insert would succeed and the foreign row would be polluted.

**Fix:** The user's `company_id` is resolved from `profiles` after auth. The target
`cost_volumes` row is looked up with a compound filter on both `id` and `company_id`. If
the row is not found (either because it does not exist or belongs to another tenant), the
action returns an error before any write occurs. NaN guards were added for `headcount`,
`hourlyRate`, and `annualHours` to prevent arithmetic injection via malformed numeric
fields.

**NIST Controls:** AC-3 (Access Enforcement), AC-4 (Information Flow Enforcement),
SI-10 (Information Input Validation)

---

### VULN-003 -- Cross-Tenant Proposal Outline Operations (High)

**File:** `app/(dashboard)/proposals/actions.ts`

**Root cause:** Both `createProposalOutline` and `deleteProposalOutline` operated on rows
by primary key alone. No company scoping was applied. A user could create outlines under
opportunities they did not own, or delete outlines belonging to other tenants.

**Attack path:** For `createProposalOutline`, submit a request with `opportunityId` set to
a UUID from another tenant; the outline would be created with a foreign opportunity FK. For
`deleteProposalOutline`, submit a request with `outlineId` set to any UUID in the table.

**Fix:** Both operations resolve the caller's `company_id` from `profiles`. The create
path verifies the target opportunity exists and belongs to that company before inserting.
The delete path appends `.eq('company_id', profile.company_id)` to the delete filter so
the operation silently fails if the row belongs to another tenant.

**NIST Controls:** AC-3 (Access Enforcement), AC-4 (Information Flow Enforcement)

---

### VULN-004 -- Hardcoded Role Check on Admin Engagement Route (Medium)

**File:** `app/api/admin/engagement/[companyId]/route.ts`

**Root cause:** Authorization was implemented as a raw string comparison:
`if (profile?.role !== 'executive')`. This bypasses the canonical `hasPermission()` system
defined in `roles_permissions_config.json`. Any future role changes to the config would
have no effect on this endpoint. Additionally, the route accepted any `companyId` path
parameter without verifying that the requesting user belonged to that company.

**Fix:** Replaced with `resolveRole()` + `hasPermission(role, 'admin', 'canEdit')` to
route authorization through the canonical RBAC system. Added explicit company scope check:
`if (profile?.company_id !== companyId) return 403`.

**NIST Controls:** AC-2 (Account Management), AC-3 (Access Enforcement), AC-6 (Least
Privilege)

---

### VULN-005 -- Hardcoded Role Check on Admin Pilots Route (Medium)

**File:** `app/api/admin/pilots/[id]/route.ts`

**Root cause:** Identical pattern to VULN-004 on a different endpoint. Additionally, the
route would execute `convertPilotToAnnual(id)` for any subscription `id` without verifying
that the subscription belonged to the requesting user's company.

**Fix:** Same RBAC correction as VULN-004, plus a `company_subscriptions` ownership lookup
before the convert action is executed.

**NIST Controls:** AC-2 (Account Management), AC-3 (Access Enforcement)

---

### VULN-006 -- Missing CSP frame-ancestors Directive (Medium)

**File:** `middleware.ts`

**Root cause:** The Content Security Policy header chain did not include `frame-ancestors
'none'`. Without this directive, the application could be embedded in an attacker-
controlled `<iframe>`, enabling clickjacking attacks that trick users into performing
authenticated actions they did not intend.

**Fix:** `"frame-ancestors 'none'"` added to the directive array in the CSP composition
block. This instructs all compliant browsers to refuse to render MissionPulse inside any
frame, regardless of origin.

**NIST Controls:** SC-8 (Transmission Confidentiality and Integrity), SI-11 (Error
Handling)

---

## 4. Open Items -- Infrastructure Layer

These two items could not be closed at the application code layer. Both require
infrastructure provisioning or database function deployment. Remediation code is provided
below so the next sprint can execute without a research phase.

---

### OPEN-001 -- Token Ledger TOCTOU Race Condition

**Risk:** Medium. Under concurrent requests from the same session (e.g., rapid double-
submit or a race between two browser tabs), a read-then-check-then-decrement sequence
on the token ledger could allow a user to consume more tokens than their balance permits.

**Why it cannot be fixed at the app layer:** The race window exists between the Supabase
client's SELECT and its subsequent UPDATE. The application cannot atomically lock a row
across two separate round-trips to the database.

**Remediation -- PostgreSQL RPC (atomic decrement with balance guard):**

The migration file `migrations/fix_token_ledger_toctou.sql` in this sprint package
contains the full implementation. The core logic is:

```sql
CREATE OR REPLACE FUNCTION consume_tokens_atomic(
  p_company_id  uuid,
  p_amount      integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current integer;
  v_new     integer;
BEGIN
  SELECT token_balance
  INTO   v_current
  FROM   company_token_ledger
  WHERE  company_id = p_company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'remaining_tokens', 0,
      'error', 'Ledger record not found');
  END IF;

  IF v_current < p_amount THEN
    RETURN jsonb_build_object('success', false, 'remaining_tokens', v_current,
      'error', 'Insufficient token balance');
  END IF;

  v_new := v_current - p_amount;

  UPDATE company_token_ledger
  SET    token_balance = v_new, updated_at = now()
  WHERE  company_id = p_company_id;

  INSERT INTO audit_logs (user_id, action, target_table, target_id, metadata, created_at)
  VALUES (auth.uid(), 'token_consumed', 'company_token_ledger', p_company_id::text,
    jsonb_build_object('amount', p_amount, 'remaining', v_new), now());

  RETURN jsonb_build_object('success', true, 'remaining_tokens', v_new, 'error', null);
END;
$$;

REVOKE ALL ON FUNCTION consume_tokens_atomic(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_tokens_atomic(uuid, integer) TO service_role;
```

**Caller pattern (server action after migration is deployed):**

```typescript
const { data, error } = await supabaseAdmin.rpc('consume_tokens_atomic', {
  p_company_id: companyId,
  p_amount: tokensRequired,
})

if (error || !data?.success) {
  return { error: data?.error ?? 'Token consumption failed' }
}
```

**Deploy steps:** Run `supabase migration new fix_token_ledger_toctou`, paste the SQL,
run `supabase db push` on the v2-development project, then update all token-consumption
server actions to call `consume_tokens_atomic` via `supabaseAdmin.rpc()`.

---

### OPEN-002 -- In-Memory Rate Limiting

**Risk:** Low-Medium. The current rate limiting runs in Node.js process memory. When
Netlify auto-scales to multiple function instances, each instance maintains its own
counter, so a client can make N requests against each instance independently.

**Remediation -- Upstash Redis with @upstash/ratelimit:**

Infrastructure setup:
1. Create an Upstash account at console.upstash.com.
2. Create a Redis database in us-east-1 (same region as Netlify deployment).
3. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Netlify env and `.env.local`.

```bash
npm install @upstash/ratelimit @upstash/redis
```

**Rate limiter module (`lib/rate-limit.ts`):**

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '60 s'),
  analytics: true,
  prefix: 'mp:ai',
})

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'mp:auth',
})

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '60 s'),
  analytics: true,
  prefix: 'mp:api',
})
```

**Usage pattern in an API route:**

```typescript
import { aiRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  const ip = headers().get('x-forwarded-for') ?? '127.0.0.1'
  const { success, limit, reset, remaining } = await aiRateLimit.limit(ip)

  if (!success) {
    return Response.json(
      { error: 'Rate limit exceeded. Please wait before retrying.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    )
  }
}
```

Target endpoints to migrate: `app/api/v1/ai/query/route.ts`, `app/api/auth/*/route.ts`,
and any token-consuming AI endpoints.

---

## 5. Security Posture by NIST 800-171 Control

**3.1.1 -- Limit system access to authorized users**
Status: Implemented. Supabase Auth enforces authenticated sessions via JWT. `middleware.ts`
redirects unauthenticated requests to `/login` on every route in the `/(dashboard)/` group.
All API routes call `supabase.auth.getUser()` and reject on missing session.

**3.1.2 -- Limit system access to authorized transaction types**
Status: Implemented. RBAC enforced via `roles_permissions_config.json` v9.5 (12 roles x 14
modules). `hasPermission()` function gates canView/canEdit per module. Invisible RBAC
removes unauthorized UI elements from the DOM entirely (no access-denied screens).

**3.1.3 -- Control the flow of CUI**
Status: Implemented. CUI modules (pricing, contracts) display watermark banners. CUI data
is not embedded in URL parameters. External roles receive CUI watermarking on exports.
`log_cui_classification()` called at classification decision points.

**3.4.1 -- Establish and maintain baseline configurations**
Status: Implemented. `netlify.toml` defines the canonical build pipeline. `tsconfig.json`
enforces strict TypeScript. `roles_permissions_config.json` is the canonical RBAC baseline.
All configuration is version-controlled on `main`.

**3.5.1 -- Identify system users**
Status: Implemented. Every user has a `profiles` row with `id` (UUID), `role`, `company_id`,
and `status`. The `handle_new_user` trigger creates the profile row on `auth.signup`.

**3.13.1 -- Monitor, control, and protect communications at external boundaries**
Status: Implemented. Netlify enforces HTTPS on all traffic. `middleware.ts` sets
`Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
and `Content-Security-Policy` headers on every response. `frame-ancestors 'none'` added
in this sprint.

**3.13.8 -- Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI**
Status: Implemented. All CUI data in transit is protected by TLS 1.2+ (Netlify/Supabase
default). Supabase encrypts data at rest. No CUI is written to client-side storage.

**3.14.6 -- Monitor organizational systems to detect attacks**
Status: Partially implemented. Sentry is configured for error monitoring. UptimeRobot
monitors availability. The Sentinel agent performs autonomous infrastructure health checks.
Full SIEM integration is planned for v2.0 Enterprise (Phase L).

---

## 6. Version History

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-08 | Forge | Initial security audit record for launch-readiness sprint |
