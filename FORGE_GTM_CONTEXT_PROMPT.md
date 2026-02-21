# Forge GTM Context Prompt

**Inject this prompt at the start of any Forge/Claude Code session where GTM or billing tickets are in scope.**

---

## Context: MissionPulse GTM Architecture

You are working on the MissionPulse GovCon proposal management SaaS. The following decisions have been made and must be respected:

### Pricing (Supersedes Product Spec Section 17)

| Plan | Monthly | Annual (17% off) | Tokens/mo | Overage |
|------|---------|------------------|-----------|---------|
| Starter | $149 | $1,484/yr | 500K | $0.80/MTok |
| Professional | $499 | $4,970/yr | 2M | $0.60/MTok |
| Enterprise | $2,500 | $24,900/yr | 10M | $0.40/MTok |

All annual plans price below $15,000 federal micro-purchase threshold.

### AI Architecture

- **Primary:** AskSage (FedRAMP authorized — required for CUI/FOUO/SECRET)
- **Fallback:** Anthropic Claude or OpenAI (UNCLASSIFIED only)
- **Router:** `lib/ai/router.ts` reads `AI_PRIMARY_PROVIDER` env var
- **Classification:** CUI data MUST route through FedRAMP-authorized providers only

### Environment Variables (Add to .env.local)

```env
AI_PRIMARY_PROVIDER=asksage
AI_FALLBACK_PROVIDER=anthropic
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
ASKSAGE_API_KEY=
ASKSAGE_API_URL=https://api.asksage.ai/v1
```

### Billing Tables

Three tables were added via Sprint 20 migration (`20260221_token_billing.sql`):
- `subscription_plans` — Plan definitions with `annual_price` column
- `company_subscriptions` — Per-company active subscription
- `token_ledger` — Per-period token allocation/consumption tracking

Types manually added to `database.types.ts`. Will be overwritten on next `supabase gen types`.

### Token Gate

Integrated into `lib/ai/pipeline.ts` → `aiRequest()`:
1. Pre-flight: `checkTokenGate(companyId)` — verify balance
2. Execute AI call
3. Post-response: `recordTokenUsage(companyId, tokensUsed)` — debit ledger

Graduated enforcement: info (50%) → warning (75%) → urgent (90%) → soft-block (100%, 10K grace period) → hard-block (120%)

### Pilot Infrastructure

- 30-day pilot at 50% of annual price
- Engagement scoring 0-100 (login freq, AI usage, features used, team invites, docs generated)
- Auto-expire after 30 days
- Pilot amount credited on conversion to paid annual

### Public Routes

- `app/(public)/` — No auth middleware, MMT branding
- Pricing page: Enterprise anchor, Professional "Most Popular"
- 8(a) toolkit landing page
- Newsletter subscriber endpoint (service-role insert only)

### Key Constraints

- `as any` is forbidden. TypeScript strict mode.
- `database.types.ts` is sole schema authority.
- Pricing is $149/$499/$2,500 monthly (NOT $99/$199/$299).
- CUI data → FedRAMP providers only.
- `STRIPE_SECRET_KEY` in `.env.local` only, never in `NEXT_PUBLIC_*`.
- Build must pass before committing.

---

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**
