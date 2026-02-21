# MissionPulse GTM & Revenue Architecture Extension

**Go-To-Market Sprints — Parallel Track**
3 Sprints (S-GTM-1 through S-GTM-3) • 14 Tickets
Runs PARALLEL to Phase G/H — does NOT consume S19–S28 sprint numbers.

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**

---

## Amendments to Existing Roadmap

### Amendment A-1: T-20.1 — Updated Pricing

**Supersedes** Product Spec Section 17 pricing ($99/$199/$299).

New pricing effective immediately:

| Plan | Monthly | Annual (17% discount) | Tokens/mo | Overage/MTok |
|------|---------|----------------------|-----------|-------------|
| Starter | $149 | $1,484/yr ($123.67/mo) | 500K | $0.80 |
| Professional | $499 | $4,970/yr ($414.17/mo) | 2M | $0.60 |
| Enterprise | $2,500 | $24,900/yr ($2,075/mo) | 10M | $0.40 |

**Required schema change:** Add `annual_price` column to `subscription_plans` table.

All annual plans price below the $15,000 federal micro-purchase threshold (FAR 13.2).

### Amendment A-2: T-20.4 — Annual Billing

Frame annual billing as "2 months free" (equivalent to 17% discount). Stripe Checkout supports both `monthly` and `annual` billing intervals. `company_subscriptions.billing_interval` column tracks which interval is active.

### Amendment A-3: T-20.3 — Decoy Pricing Display

On the public pricing page (`app/(public)/pricing/`), display Enterprise as the anchor price. Professional is the target tier — positioned as the best value. Starter is the entry point. Visual emphasis on Professional column (recommended badge, highlighted border).

---

## Sprint GTM-1: Multi-Model AI Abstraction

*Decouple from AskSage dependency. Provider-agnostic interface. Classification-aware routing. CUI data routes through FedRAMP providers only.*

### T-GTM-1.1 — AI Provider Interface & Router

Abstract the AI gateway behind a provider-agnostic interface. AskSage remains primary for CUI-classified requests (FedRAMP). Claude and OpenAI available as fallbacks for UNCLASSIFIED work.

**Acceptance Criteria:**
- [ ] `lib/ai/providers/interface.ts` — `AIProvider` interface with `query()`, `embed()`, `classify()` methods
- [ ] `lib/ai/providers/asksage.ts` — AskSage adapter (existing `asksage-client.ts` refactored)
- [ ] `lib/ai/providers/anthropic.ts` — Claude adapter (Anthropic SDK)
- [ ] `lib/ai/providers/openai.ts` — OpenAI adapter
- [ ] `lib/ai/router.ts` — Routes requests based on classification level:
  - CUI/FOUO/SECRET → AskSage only (FedRAMP)
  - UNCLASSIFIED → Primary provider (from `AI_PRIMARY_PROVIDER` env), fallback to secondary
- [ ] Environment variables: `AI_PRIMARY_PROVIDER`, `AI_FALLBACK_PROVIDER`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
- [ ] npm run build passes

**Files:** lib/ai/providers/interface.ts, lib/ai/providers/asksage.ts, lib/ai/providers/anthropic.ts, lib/ai/providers/openai.ts, lib/ai/router.ts

---

### T-GTM-1.2 — Provider Health Monitoring

Track provider availability, latency, and error rates. Auto-failover when primary provider is degraded.

**Acceptance Criteria:**
- [ ] `lib/ai/providers/health.ts` — Health check per provider (ping endpoint, measure latency)
- [ ] Circuit breaker pattern: 3 consecutive failures → mark provider degraded → route to fallback
- [ ] Provider status stored in Redis (5-minute TTL)
- [ ] Health dashboard widget on admin page
- [ ] npm run build passes

**Files:** lib/ai/providers/health.ts, components/features/admin/ProviderHealthCard.tsx

---

### T-GTM-1.3 — Model Cost Tracking by Provider

Per-provider cost tracking for budget projection and vendor comparison.

**Acceptance Criteria:**
- [ ] `token_usage` table gets `provider` column (migration)
- [ ] Cost rates configurable per provider per model
- [ ] Analytics breakdown by provider on AI usage page
- [ ] npm run build passes

**Files:** supabase/migrations/YYYYMMDD_provider_tracking.sql, lib/ai/providers/costs.ts

---

### T-GTM-1.4 — Provider Configuration UI

Admin page for managing AI provider configuration and priority.

**Acceptance Criteria:**
- [ ] Provider settings page at `/admin/ai-providers`
- [ ] Set primary/fallback provider
- [ ] Test connection button per provider
- [ ] View provider health status
- [ ] RBAC: executive/admin only
- [ ] npm run build passes

**Files:** app/(dashboard)/admin/ai-providers/page.tsx, components/features/admin/ProviderConfig.tsx

---

## Sprint GTM-2: Paid Pilot Infrastructure

*30-day pilot at 50% of annual price. Engagement scoring 0-100. Conversion tracking. Auto-expiry.*

### T-GTM-2.1 — Pilot Subscription Type

Add pilot support to the billing system. 30 days at 50% of annual price, credited on full conversion.

**Acceptance Criteria:**
- [ ] `company_subscriptions.status` supports `'pilot'` value
- [ ] Pilot pricing: 50% of annual rate, pro-rated to 30 days
- [ ] Auto-expire after 30 days → status changes to `'expired'`
- [ ] Conversion: pilot amount credited against first annual payment
- [ ] Pilot token allocation: same as plan tier (no reduction)
- [ ] npm run build passes

**Files:** lib/billing/pilot.ts, supabase/migrations/YYYYMMDD_pilot_support.sql

---

### T-GTM-2.2 — Engagement Scoring Engine

Score pilot accounts 0-100 based on feature adoption, login frequency, AI usage, and team activity.

**Acceptance Criteria:**
- [ ] `lib/billing/engagement.ts` — Scoring function with weighted factors:
  - Login frequency (20%)
  - AI requests/day (25%)
  - Features used / features available (25%)
  - Team members invited (15%)
  - Documents generated (15%)
- [ ] Score calculated daily via Edge Function
- [ ] Score stored in `company_subscriptions.metadata.engagement_score`
- [ ] Admin view: engagement leaderboard for all pilots
- [ ] npm run build passes

**Files:** lib/billing/engagement.ts, supabase/functions/engagement-scorer/index.ts

---

### T-GTM-2.3 — Pilot Admin Dashboard

Admin view for managing active pilots, viewing engagement, and triggering conversion outreach.

**Acceptance Criteria:**
- [ ] Admin page at `/admin/pilots`
- [ ] Table: company, plan, days remaining, engagement score, token usage %
- [ ] Sort by engagement score descending (highest conversion probability first)
- [ ] "Extend Pilot" action (7-day extension, one-time)
- [ ] "Convert to Paid" action (generates Stripe link)
- [ ] RBAC: executive only
- [ ] npm run build passes

**Files:** app/(dashboard)/admin/pilots/page.tsx, components/features/admin/PilotTable.tsx, lib/billing/pilot-actions.ts

---

### T-GTM-2.4 — Pilot Onboarding Flow

Guided onboarding for pilot customers. Tracks completion and feeds engagement score.

**Acceptance Criteria:**
- [ ] 5-step pilot checklist (create opp, run AI agent, invite team member, generate doc, review compliance)
- [ ] Progress stored in `company_onboarding` table
- [ ] Checklist widget on dashboard for pilot accounts
- [ ] Completion triggers congratulations notification
- [ ] npm run build passes

**Files:** components/features/onboarding/PilotChecklist.tsx, lib/billing/onboarding.ts

---

## Sprint GTM-3: Public Marketing & Revenue Pages

*Public pricing page, 8(a) toolkit landing, newsletter signup. No auth required.*

### T-GTM-3.1 — Public Route Group

Create `app/(public)/` route group with dedicated layout. No authentication middleware. MMT branding.

**Acceptance Criteria:**
- [ ] `app/(public)/layout.tsx` — Public layout (MMT branding, no sidebar, no auth)
- [ ] Middleware updated to skip auth for `/(public)` routes
- [ ] Clean navigation: logo, pricing link, login CTA
- [ ] Mobile responsive
- [ ] npm run build passes

**Files:** app/(public)/layout.tsx, middleware.ts (modify)

---

### T-GTM-3.2 — Public Pricing Page

Three-tier pricing display with annual/monthly toggle. Enterprise as anchor (Amendment A-3).

**Acceptance Criteria:**
- [ ] `app/(public)/pricing/page.tsx` — Three plan cards
- [ ] Monthly/Annual toggle with "Save 17%" badge
- [ ] Professional tier highlighted as "Most Popular"
- [ ] Feature comparison table below cards
- [ ] "Start Free Pilot" CTA on each card
- [ ] All annual prices < $15K micro-purchase threshold displayed
- [ ] npm run build passes

**Files:** app/(public)/pricing/page.tsx, components/marketing/PricingCards.tsx

---

### T-GTM-3.3 — 8(a) Toolkit Landing Page

Targeted landing page for 8(a) small businesses. Highlights MissionPulse value for set-aside contractors.

**Acceptance Criteria:**
- [ ] `app/(public)/8a-toolkit/page.tsx`
- [ ] Hero: "Win More 8(a) Contracts with AI"
- [ ] Value props: compliance automation, proposal generation, pWin scoring
- [ ] Social proof section (testimonial placeholders)
- [ ] CTA: "Start Your Free Pilot"
- [ ] npm run build passes

**Files:** app/(public)/8a-toolkit/page.tsx

---

### T-GTM-3.4 — Newsletter Subscriber Endpoint

Email capture for marketing communications. Service-role insert (public API, no client auth).

**Acceptance Criteria:**
- [ ] `newsletter_subscribers` table (email, source, subscribed_at, unsubscribed_at)
- [ ] `app/api/newsletter/route.ts` — POST endpoint, validates email, inserts via service role
- [ ] Rate limited: 5 requests per IP per hour
- [ ] GDPR-compliant: unsubscribe endpoint included
- [ ] npm run build passes

**Files:** supabase/migrations/YYYYMMDD_newsletter.sql, app/api/newsletter/route.ts

---

### T-GTM-3.5 — Marketing Analytics Pixel Integration

Track marketing page conversions for attribution.

**Acceptance Criteria:**
- [ ] Google Analytics 4 script in public layout (via `NEXT_PUBLIC_GA4_ID` env var)
- [ ] Conversion events: pricing_page_view, pilot_signup_click, newsletter_subscribe
- [ ] No tracking on authenticated dashboard pages
- [ ] npm run build passes

**Files:** app/(public)/layout.tsx (modify), lib/analytics/gtag.ts

---

### T-GTM-3.6 — SEO & Open Graph Metadata

SEO optimization for public pages.

**Acceptance Criteria:**
- [ ] Per-page metadata (title, description, OG image)
- [ ] Sitemap generation for public routes
- [ ] robots.txt allows public routes, blocks dashboard
- [ ] Canonical URLs set
- [ ] npm run build passes

**Files:** app/(public)/pricing/page.tsx (modify metadata), app/sitemap.ts, app/robots.ts

---

## Execution Order

GTM sprints run in parallel with Phase G/H:

```
Phase G (S19-S24)  ──────────────────────────────►
Phase H (S25-S28)                    ──────────────►
S-GTM-1 (AI Abstraction)  ──────►
S-GTM-2 (Pilot Infra)       ──────────►
S-GTM-3 (Marketing)              ──────────►
```

S-GTM-1 can start any time after S19. S-GTM-2 depends on S20 (billing). S-GTM-3 has no dependencies.

---

**PROPRIETARY — Mission Meets Tech, LLC — February 2026**
