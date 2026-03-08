# MissionPulse Platform Reliability

## Audit Date: 2026-03-08

## Security Fixes Applied

### P0: Cross-Tenant Data Access (FIXED)
- **API proposals route** (`app/api/v1/proposals/[id]/route.ts`): Added `company_id` verification before returning proposal sections/volumes. Previously any API key holder could read data from any company.
- **API compliance route** (`app/api/v1/compliance/[opportunityId]/route.ts`): Same fix — added opportunity ownership check.
- **Section content update** (`app/(dashboard)/pipeline/[id]/sections/[sectionId]/actions.ts`): Added opportunity-to-company ownership verification.
- **Cost volume actions** (`app/(dashboard)/pipeline/[id]/pricing/actions.ts`): Added company ownership checks to `createCostVolume` and `updateCostVolumeRates`.

### P0: Missing RBAC on Billing (FIXED)
- **Billing checkout** (`app/api/billing/checkout/route.ts`): Added `hasPermission(role, 'admin', 'canEdit')` check. Previously any authenticated user could initiate Stripe checkout.

### P1: Input Validation (FIXED)
- **Pricing actions**: Added `isNaN()` guards for numeric FormData fields (`headcount`, `hourlyRate`, `annualHours`) to prevent NaN in database.

## Known Risks (Documented, Not Fixed)

### Token Ledger TOCTOU Race Condition
**File**: `lib/billing/ledger.ts:94-133, 138-158`
**Issue**: `debitTokens()` and `creditPurchasedTokens()` use read-then-write pattern. Concurrent AI requests can lose token consumption; concurrent purchases can lose credits.
**Impact**: Billing inaccuracy under concurrent load.
**Required Fix**: PostgreSQL RPC function with `SET tokens_consumed = tokens_consumed + $1` for atomic increment. Cannot be fixed at the application layer alone.
**Workaround**: Low-concurrency deployments are unlikely to trigger this. Monitor for billing discrepancies.

### In-Memory Rate Limiting
**Files**: `middleware.ts`, `lib/api/rate-limiter.ts`
**Issue**: Rate limit state stored in JavaScript Map, lost on restart, doesn't work across instances.
**Impact**: Distributed deployments bypass rate limits.
**Required Fix**: Move to Redis (Upstash) when available.

### Subscription Webhook Race
**File**: `app/api/billing/webhook/route.ts:69-85`
**Issue**: Concurrent Stripe webhooks for same company could race on upsert.
**Impact**: Out-of-order event processing could set incorrect billing period.
**Mitigation**: Stripe's retry with exponential backoff makes this unlikely in practice.

## Architecture Notes
- Auth: Supabase Auth via `@supabase/ssr`, session refreshed in middleware
- RBAC: Invisible pattern — unauthorized users redirected to /dashboard, not shown error pages
- Billing: Stripe Checkout + webhook-based subscription management
- Deployment: Netlify with Next.js 14 App Router
- AI: Provider-agnostic interface, CUI routing to FedRAMP providers
